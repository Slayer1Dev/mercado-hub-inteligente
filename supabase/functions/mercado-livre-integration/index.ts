import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ... (as funções createLog, getValidAccessToken, e outras continuam as mesmas) ...
async function createLog(supabase: any, userId: string | null, action: string, status: string, message: string, details: any = null) {
  try {
    await supabase
      .from('integration_logs')
      .insert({
        user_id: userId,
        integration_type: 'mercado_livre',
        action,
        status,
        message,
        details
      });
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
}

async function getValidAccessToken(supabase: any, userId: string) {
  const { data: integration, error: integrationError } = await supabase
    .from('user_integrations')
    .select('credentials, updated_at')
    .eq('user_id', userId)
    .eq('integration_type', 'mercado_livre')
    .single();

  if (integrationError || !integration?.credentials) {
    throw new Error('Credenciais do Mercado Livre não encontradas para o usuário.');
  }

  const { credentials, updated_at } = integration;
  const { access_token, refresh_token, expires_in } = credentials;

  const expirationTime = new Date(updated_at).getTime() + (expires_in * 1000) - (5 * 60 * 1000);
  const isExpired = Date.now() > expirationTime;

  if (!isExpired) {
    return access_token;
  }

  await createLog(supabase, userId, 'refresh_token', 'info', 'Token de acesso expirado. Renovando...', null);

  const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
  const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
  const body = `grant_type=refresh_token&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}&refresh_token=${refresh_token}`;
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao renovar token.', errorData);
    throw new Error('Não foi possível renovar a autenticação com o Mercado Livre. Por favor, conecte-se novamente.');
  }

  const newTokens = await response.json();

  const { error: updateError } = await supabase
    .from('user_integrations')
    .update({
      credentials: { ...credentials, access_token: newTokens.access_token, refresh_token: newTokens.refresh_token, expires_in: newTokens.expires_in },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId).eq('integration_type', 'mercado_livre');

  if (updateError) {
    await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao salvar novos tokens no banco de dados.', updateError);
  } else {
    await createLog(supabase, userId, 'refresh_token', 'success', 'Token renovado e salvo com sucesso.', null);
  }

  return newTokens.access_token;
}

async function handleOAuthStart(req: Request, supabase: any) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      await createLog(supabase, null, 'oauth_start', 'error', 'Usuário não autenticado', { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-livre-integration/oauth-callback`;

    if (!ML_CLIENT_ID) {
      await createLog(supabase, user.id, 'oauth_start', 'error', 'CLIENT_ID do Mercado Livre não configurado', null);
      return new Response(JSON.stringify({ error: 'Configuração incompleta' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`;

    await createLog(supabase, user.id, 'oauth_start', 'success', 'URL de autorização gerada', { authUrl });

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    await createLog(supabase, null, 'oauth_start', 'error', 'Erro interno no OAuth start', { error: error.message });
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function handleOAuthCallback(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      await createLog(supabase, state, 'oauth_callback', 'error', 'Usuário cancelou autorização', { error });
      return new Response('Autorização cancelada', { status: 400 });
    }

    if (!code || !state) {
      await createLog(supabase, state, 'oauth_callback', 'error', 'Parâmetros inválidos no callback', { code: !!code, state: !!state });
      return new Response('Parâmetros inválidos', { status: 400 });
    }

    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-livre-integration/oauth-callback`;

    const body = `grant_type=authorization_code&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}&code=${code}&redirect_uri=${redirectUri}`;

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      await createLog(supabase, state, 'oauth_callback', 'error', 'Falha ao obter tokens', { error: errorData });
      return new Response('Falha na autenticação', { status: 400 });
    }

    const tokens = await tokenResponse.json();
    
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        integration_type: 'mercado_livre',
        is_connected: true,
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          ml_user_id: tokens.user_id,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, integration_type' });

    if (dbError) {
      await createLog(supabase, state, 'oauth_callback', 'error', 'Erro ao salvar tokens', { error: dbError.message });
      return new Response('Erro ao salvar configuração', { status: 500 });
    }

    await createLog(supabase, state, 'oauth_callback', 'success', 'Integração com Mercado Livre conectada com sucesso', null);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/integrations?connected=mercado_livre`,
      },
    });

  } catch (error) {
    await createLog(supabase, null, 'oauth_callback', 'error', 'Erro interno no callback', { error: error.message });
    return new Response('Erro interno', { status: 500 });
  }
}

async function handleSyncProducts(req: Request, supabase: any, user: any) {
  try {
    await createLog(supabase, user.id, 'sync_products', 'info', 'Iniciando sincronização de produtos.', null);

    const accessToken = await getValidAccessToken(supabase, user.id);
    
     const { data: integrationData } = await supabase
      .from('user_integrations')
      .select('credentials->ml_user_id')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    const mlUserId = integrationData?.ml_user_id;
    if(!mlUserId) throw new Error("ID de usuário do Mercado Livre não encontrado.");

    const itemsResponse = await fetch(`https://api.mercadolibre.com/users/${mlUserId}/items/search`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!itemsResponse.ok) throw new Error('Falha ao buscar lista de itens do ML.');
    
    const itemsData = await itemsResponse.json();
    const itemIds = itemsData.results;

    if (!itemIds || itemIds.length === 0) {
      await createLog(supabase, user.id, 'sync_products', 'success', 'Sincronização concluída. Nenhum produto encontrado.', { count: 0 });
      return new Response(JSON.stringify({ message: 'Nenhum produto encontrado para sincronizar.' }));
    }

    const detailsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${itemIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!detailsResponse.ok) throw new Error('Falha ao buscar detalhes dos itens do ML.');

    const detailsData = await detailsResponse.json();

    const productsToUpsert = detailsData.map((item: any) => ({
      user_id: user.id,
      ml_item_id: item.body.id,
      title: item.body.title,
      price: item.body.price,
      stock_quantity: item.body.available_quantity,
      status: item.body.status,
      permalink: item.body.permalink,
      thumbnail: item.body.thumbnail,
      last_synced_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'user_id, ml_item_id' });

    if (upsertError) {
      throw new Error(`Erro ao salvar produtos no banco de dados: ${upsertError.message}`);
    }

    await createLog(supabase, user.id, 'sync_products', 'success', `${productsToUpsert.length} produtos sincronizados com sucesso.`, { count: productsToUpsert.length });

    return new Response(JSON.stringify({ message: `${productsToUpsert.length} produtos sincronizados!` }));

  } catch (error) {
    await createLog(supabase, user.id, 'sync_products', 'error', 'Erro durante a sincronização de produtos.', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// FUNÇÃO ALTERADA
async function handleSyncQuestions(req: Request, supabase: any, user: any) {
  try {
    await createLog(supabase, user.id, 'sync_questions', 'info', 'Iniciando sincronização de perguntas.', null);

    const accessToken = await getValidAccessToken(supabase, user.id);
    const { data: integrationData } = await supabase
      .from('user_integrations')
      .select('credentials->ml_user_id')
      .eq('user_id', user.id).eq('integration_type', 'mercado_livre')
      .single();
    const mlUserId = integrationData?.ml_user_id;
    if (!mlUserId) throw new Error("ID de usuário do Mercado Livre não encontrado.");

    const questionsResponse = await fetch(`https://api.mercadolibre.com/my/received_questions/search?seller=${mlUserId}&status=UNANSWERED`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!questionsResponse.ok) {
      const errorBody = await questionsResponse.text();
      throw new Error(`Falha ao buscar perguntas no Mercado Livre: ${errorBody}`);
    }
    const questionsData = await questionsResponse.json();

    if (questionsData.questions.length === 0) {
      await createLog(supabase, user.id, 'sync_questions', 'success', 'Nenhuma pergunta nova encontrada.', null);
      return new Response(JSON.stringify({ message: 'Nenhuma pergunta nova encontrada.' }));
    }

    let generatedCount = 0;
    for (const question of questionsData.questions) {
      // ETAPA ADICIONADA: Buscar detalhes do produto
      const itemDetailsResponse = await fetch(`https://api.mercadolibre.com/items/${question.item_id}?attributes=title,price,attributes`);
      if (!itemDetailsResponse.ok) {
          console.error(`Falha ao buscar detalhes para o item ${question.item_id}`);
          continue; // Pula para a próxima pergunta se não conseguir os detalhes
      }
      const itemDetails = await itemDetailsResponse.json();

      const { data: iaData, error: iaError } = await supabase.functions.invoke('gemini-ai/generate', {
        headers: {
          'Authorization': req.headers.get('Authorization')!
        },
        body: { 
          questionText: question.text,
          itemDetails: { // Enviando o contexto do produto
            title: itemDetails.title,
            price: itemDetails.price,
            attributes: itemDetails.attributes
          }
        }
      });

      let ia_response = "Não foi possível gerar uma resposta com a IA.";
      if (!iaError && iaData.success) {
        ia_response = iaData.response;
        generatedCount++;
      }

      await supabase.from('mercado_livre_questions').upsert({
        user_id: user.id,
        question_id: String(question.id),
        item_id: question.item_id,
        question_text: question.text,
        status: 'ia_answered',
        ia_response: ia_response,
        question_date: question.date_created,
      }, { onConflict: 'question_id' });
    }

    const successMessage = `${questionsData.questions.length} perguntas encontradas, ${generatedCount} respostas geradas pela IA.`;
    await createLog(supabase, user.id, 'sync_questions', 'success', successMessage, null);
    return new Response(JSON.stringify({ message: successMessage }));

  } catch (error) {
    await createLog(supabase, user.id, 'sync_questions', 'error', 'Erro durante a sincronização de perguntas.', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

async function handleAnswerQuestion(req: Request, supabase: any, user: any) {
  try {
    const { question_id, text } = await req.json();
    if (!question_id || !text) {
      throw new Error("ID da pergunta e texto da resposta são obrigatórios.");
    }
    
    await createLog(supabase, user.id, 'answer_question', 'info', `Tentando responder à pergunta ${question_id}`, { text });

    const accessToken = await getValidAccessToken(supabase, user.id);

    const answerResponse = await fetch(`https://api.mercadolibre.com/answers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question_id: question_id,
        text: text,
      }),
    });

    if (!answerResponse.ok) {
      const errorBody = await answerResponse.text();
      throw new Error(`Falha ao enviar resposta para o Mercado Livre: ${errorBody}`);
    }

    await supabase
      .from('mercado_livre_questions')
      .update({ status: 'answered', final_response: text })
      .eq('question_id', String(question_id));

    await createLog(supabase, user.id, 'answer_question', 'success', `Pergunta ${question_id} respondida com sucesso.`, null);

    return new Response(JSON.stringify({ success: true, message: 'Resposta enviada com sucesso!' }));

  } catch (error) {
     await createLog(supabase, user.id, 'answer_question', 'error', 'Erro ao responder pergunta.', { error: error.message });
     return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

async function handleWebhook(req: Request, supabase: any) {
  try {
    const notification = await req.json();
    await createLog(supabase, null, 'webhook_received', 'info', 'Notificação de webhook recebida.', notification);
    return new Response('OK', { status: 200 });
  } catch(error) {
    await createLog(supabase, null, 'webhook_received', 'error', 'Erro ao processar webhook.', { error: error.message });
    return new Response('OK', { status: 200 });
  }
}

// SERVIDOR PRINCIPAL
serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname.includes('/oauth-callback')) { return await handleOAuthCallback(req, supabase); }
    if (pathname.includes('/webhook')) { return await handleWebhook(req, supabase); }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) { return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), { status: 401, headers: corsHeaders }); }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) { return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders }); }

    if (pathname.includes('/oauth-start')) { return await handleOAuthStart(req, supabase); }
    if (pathname.includes('/sync-products')) { return await handleSyncProducts(req, supabase, user); }
    if (pathname.includes('/sync-questions')) { return await handleSyncQuestions(req, supabase, user); }
    if (pathname.includes('/answer-question')) { return await handleAnswerQuestion(req, supabase, user); }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  } catch (err) {
    console.error('Erro geral:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
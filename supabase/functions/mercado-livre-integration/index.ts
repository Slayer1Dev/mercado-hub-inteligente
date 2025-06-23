import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ... (as funções createLog e getValidAccessToken continuam as mesmas) ...
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

// NOVA FUNÇÃO "CÉREBRO" PARA PROCESSAR UMA ÚNICA PERGUNTA
async function processSingleQuestion(supabase: any, userId: string, questionId: string) {
    const accessToken = await getValidAccessToken(supabase, userId);
    
    // 1. Buscar a pergunta específica pelo ID
    const questionResponse = await fetch(`https://api.mercadolibre.com/questions/${questionId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!questionResponse.ok) throw new Error(`Falha ao buscar pergunta ${questionId}`);
    const question = await questionResponse.json();

    // 2. Buscar detalhes do item
    const itemDetailsResponse = await fetch(`https://api.mercadolibre.com/items/${question.item_id}?attributes=title,price,attributes`);
    if (!itemDetailsResponse.ok) throw new Error(`Falha ao buscar detalhes do item ${question.item_id}`);
    const itemDetails = await itemDetailsResponse.json();

    // 3. Chamar a IA para gerar a resposta
    const { data: iaData, error: iaError } = await supabase.functions.invoke('gemini-ai/generate', {
        body: { 
          questionText: question.text,
          itemDetails: { title: itemDetails.title, price: itemDetails.price, attributes: itemDetails.attributes }
        }
    });

    let ia_response = "Não foi possível gerar uma resposta com a IA.";
    if (!iaError && iaData.success) {
      ia_response = iaData.response;
    }

    // 4. Salvar tudo no banco de dados
    const { error: upsertError } = await supabase.from('mercado_livre_questions').upsert({
        user_id: userId,
        question_id: String(question.id),
        item_id: question.item_id,
        question_text: question.text,
        status: 'ia_answered',
        ia_response: ia_response,
        question_date: question.date_created,
      }, { onConflict: 'question_id' });
    
    if (upsertError) throw new Error(`Erro ao salvar pergunta no banco: ${upsertError.message}`);
}


// ... (handleOAuthStart, handleOAuthCallback, handleSyncProducts, handleAnswerQuestion continuam os mesmos) ...

// FUNÇÃO DE WEBHOOK AGORA É INTELIGENTE
async function handleWebhook(req: Request, supabase: any) {
  try {
    const notification = await req.json();
    await createLog(supabase, notification.user_id, 'webhook_received', 'info', 'Notificação de webhook recebida.', notification);

    // Se a notificação for sobre uma pergunta, processe-a
    if (notification.topic === 'questions') {
        const resourceUrl = notification.resource; // ex: /questions/123456
        const questionId = resourceUrl.split('/')[2];
        const userId = notification.user_id; // O ID do dono do app no ML

        // Precisamos encontrar nosso usuário do sistema a partir do ID do usuário do ML
        const { data: userData, error: userError } = await supabase
            .from('user_integrations')
            .select('user_id')
            .eq('credentials->>ml_user_id', userId)
            .single();

        if (userError || !userData) {
            throw new Error(`Usuário do sistema não encontrado para o ml_user_id: ${userId}`);
        }
        
        await processSingleQuestion(supabase, userData.user_id, questionId);
    }

    return new Response('OK', { status: 200 });
  } catch(error) {
    await createLog(supabase, null, 'webhook_received', 'error', 'Erro ao processar webhook.', { error: error.message });
    return new Response('OK', { status: 200 });
  }
}


// SERVIDOR PRINCIPAL (com todas as rotas)
serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    // Rotas públicas que não precisam de autenticação de usuário vindo do nosso frontend
    if (pathname.includes('/oauth-callback')) { return await handleOAuthCallback(req, supabase); }
    if (pathname.includes('/webhook')) { return await handleWebhook(req, supabase); }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) { return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), { status: 401, headers: corsHeaders }); }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) { return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders }); }

    // Rotas protegidas que precisam de um usuário logado
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
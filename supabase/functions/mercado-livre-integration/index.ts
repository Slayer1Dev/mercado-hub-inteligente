import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// As funções auxiliares (createLog, getValidAccessToken, etc.) permanecem as mesmas.
// Apenas as funções de 'handle' e o 'serve' principal foram ajustados.

async function createLog(supabase: any, userId: string | null, action: string, status: string, message: string, details: any = null) {
    try {
      await supabase.from('integration_logs').insert({
        user_id: userId,
        integration_type: 'mercado_livre',
        action,
        status,
        message,
        details,
      });
    } catch (error) {
      console.error('Erro ao criar log:', error);
    }
}

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('credentials, updated_at')
      .eq('user_id', userId)
      .eq('integration_type', 'mercado_livre')
      .single();
  
    if (integrationError || !integration?.credentials) {
      throw new Error('Credenciais do Mercado Livre não encontradas para o usuário.');
    }
  
    const { access_token, refresh_token, expires_in } = integration.credentials as any;
    const updatedAt = new Date(integration.updated_at).getTime();
  
    const expirationTime = updatedAt + (expires_in * 1000) - (5 * 60 * 1000); // 5 min de margem
  
    if (Date.now() < expirationTime) {
      return access_token;
    }
  
    await createLog(supabase, userId, 'refresh_token', 'info', 'Token de acesso expirado. Renovando...', null);
  
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    const body = `grant_type=refresh_token&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}&refresh_token=${refresh_token}`;
  
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao renovar token.', errorData);
      throw new Error('Não foi possível renovar a autenticação com o Mercado Livre.');
    }
  
    const newTokens = await response.json();
    
    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({
        credentials: {
            ...integration.credentials, // Mantém dados antigos como ml_user_id
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || refresh_token, // ML pode não retornar um novo refresh token
            expires_in: newTokens.expires_in,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('integration_type', 'mercado_livre');
  
    if (updateError) {
      await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao salvar novos tokens.', updateError);
    }
  
    return newTokens.access_token;
}

// Suas outras funções (getGeminiResponse, processSingleQuestion) aqui...

// Função de sincronizar produtos COM PAGINAÇÃO
async function handleSyncProducts(req: Request, supabase: any, user: any) {
  try {
    await createLog(supabase, user.id, 'sync_products', 'info', 'Iniciando sincronização completa de produtos.', null);

    const accessToken = await getValidAccessToken(supabase, user.id);
    
    const { data: integrationData } = await supabase
      .from('user_integrations')
      .select('credentials->>ml_user_id')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    const mlUserId = integrationData?.ml_user_id;
    if(!mlUserId) throw new Error("ID de usuário do Mercado Livre não encontrado.");

    let allItemIds: string[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const itemsResponse = await fetch(`https://api.mercadolibre.com/users/${mlUserId}/items/search?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!itemsResponse.ok) throw new Error(`Falha ao buscar lista de itens do ML na página com offset ${offset}.`);
      
      const itemsData = await itemsResponse.json();
      const newIds = itemsData.results || [];
      allItemIds.push(...newIds);

      if (newIds.length < limit) break;
      offset += limit;
    }

    if (allItemIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum produto encontrado para sincronizar.' }), { headers: corsHeaders });
    }
    
    await createLog(supabase, user.id, 'sync_products', 'info', `Total de ${allItemIds.length} IDs de produtos encontrados. Buscando detalhes...`, null);

    const allProductsDetails = [];
    const batchSize = 20;

    for (let i = 0; i < allItemIds.length; i += batchSize) {
      const batchIds = allItemIds.slice(i, i + batchSize);
      const detailsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batchIds.join(',')}&attributes=id,title,price,available_quantity,status,permalink,thumbnail,attributes`, {        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!detailsResponse.ok) {
        await createLog(supabase, user.id, 'sync_products', 'warning', `Falha ao buscar detalhes de um lote de itens.`, { batchIds });
        continue;
      }
      
      const detailsData = await detailsResponse.json();
      allProductsDetails.push(...detailsData.filter((item: any) => item.code === 200).map((item: any) => item.body));
    }
    
    const productsToUpsert = allProductsDetails.map((item: any) => {
      const eanAttribute = item.body.attributes.find((attr: any) => attr.id === 'EAN');
      return {
          user_id: user.id,
          ml_item_id: item.body.id,
          title: item.body.title,
          price: item.body.price,
          stock_quantity: item.body.available_quantity,
          status: item.body.status,
          permalink: item.body.permalink,
          thumbnail: item.body.thumbnail,
          ean: eanAttribute ? eanAttribute.value_name : null, // Salva o EAN
          last_synced_at: new Date().toISOString(),
      };
  });
    
    if (productsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'user_id, ml_item_id' });
        if (upsertError) throw new Error(`Erro ao salvar produtos no banco de dados: ${upsertError.message}`);
    }

    const successMessage = `${productsToUpsert.length} de ${allItemIds.length} produtos sincronizados com sucesso.`;
    await createLog(supabase, user.id, 'sync_products', 'success', successMessage, { count: productsToUpsert.length });

    return new Response(JSON.stringify({ message: successMessage }), { headers: corsHeaders });

  } catch (error) {
    await createLog(supabase, user.id, 'sync_products', 'error', 'Erro durante a sincronização de produtos.', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

// ... (cole aqui as outras funções como handleSyncQuestions, handleOAuthStart, etc., que você já tem) ...

// SERVE PRINCIPAL - Garantindo que todas as respostas tenham os headers
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    // Coloque aqui suas funções completas que foram omitidas para breveidade
    // Exemplo: handleOAuthCallback, handleWebhook, handleOAuthStart, handleSyncQuestions, handleAnswerQuestion

    // Rotas públicas (exemplo)
    if (pathname.includes('/oauth-callback')) {
        // return await handleOAuthCallback(req, supabase);
    }

    // A partir daqui, rotas protegidas
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders });
    }

    if (pathname.includes('/sync-products')) {
      return await handleSyncProducts(req, supabase, user);
    }
    // Adicione outras rotas aqui
    // if (pathname.includes('/sync-questions')) {
    //   return await handleSyncQuestions(req, supabase, user);
    // }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error('Erro geral:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
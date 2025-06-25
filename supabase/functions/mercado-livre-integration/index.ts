// supabase/functions/mercado-livre-integration/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLog, getValidAccessToken } from '../_shared/ml-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Funções Handler para cada Rota ---

async function handleOAuthStart(req: Request, supabase: any, user: any) {
  await createLog(supabase, user.id, 'oauth_start', 'info', 'Iniciando processo de OAuth.', null);

  const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
  if (!ML_CLIENT_ID) {
    throw new Error('ERRO CRÍTICO: ML_CLIENT_ID não encontrado nos segredos do ambiente.');
  }
  
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-livre-integration/oauth-callback`;
  const scopes = 'read write offline_access';
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}&scope=${encodeURIComponent(scopes)}`;

  return new Response(JSON.stringify({ authUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleOAuthCallback(req: Request, supabase: any) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
  
    if (!code || !state) {
      throw new Error('Parâmetros inválidos no callback do Mercado Livre.');
    }
  
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-livre-integration/oauth-callback`;
  
    const body = `grant_type=authorization_code&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}&code=${code}&redirect_uri=${redirectUri}`;
  
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      await createLog(supabase, state, 'oauth_callback', 'error', 'Falha ao obter tokens do ML.', { error: errorData });
      throw new Error('Falha na autenticação com o Mercado Livre.');
    }
  
    const tokens = await tokenResponse.json();
    
    await supabase.from('user_integrations').upsert({
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
  
    await createLog(supabase, state, 'oauth_callback', 'success', 'Integração com Mercado Livre conectada com sucesso.', null);
  
    const SITE_URL = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    return Response.redirect(`${SITE_URL}/integrations?connected=mercado_livre`);
}

async function handleSyncProducts(req: Request, supabase: any, user: any) {
    await createLog(supabase, user.id, 'sync_products', 'info', 'Iniciando sincronização completa de produtos.', null);

    const accessToken = await getValidAccessToken(supabase, user.id);
    const { data: integrationData } = await supabase
      .from('user_integrations')
      .select('credentials->>ml_user_id')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    const mlUserId = integrationData?.ml_user_id;
    if (!mlUserId) throw new Error("ID de usuário do Mercado Livre não encontrado.");

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
    
    const allProductsDetails = [];
    const batchSize = 20;

    for (let i = 0; i < allItemIds.length; i += batchSize) {
      const batchIds = allItemIds.slice(i, i + batchSize);
      const detailsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batchIds.join(',')}&attributes=id,title,price,available_quantity,status,permalink,thumbnail,attributes`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!detailsResponse.ok) {
        await createLog(supabase, user.id, 'sync_products', 'warning', `Falha ao buscar detalhes de um lote de itens.`, { batchIds });
        continue;
      }
      
      const detailsData = await detailsResponse.json();
      allProductsDetails.push(...detailsData.filter((item: any) => item.code === 200).map((item: any) => item.body));
    }
    
    const productsToUpsert = allProductsDetails.map((item: any) => {
      const eanAttribute = item.attributes.find((attr: any) => attr.id === 'EAN');
      return {
          user_id: user.id,
          ml_item_id: item.id,
          title: item.title,
          price: item.price,
          stock_quantity: item.available_quantity,
          status: item.status,
          permalink: item.permalink,
          thumbnail: item.thumbnail,
          ean: eanAttribute ? eanAttribute.value_name : null,
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
}


// --- Servidor Principal ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  );

  const url = new URL(req.url);
  const { pathname } = url;
  
  try {
    // Rotas públicas
    if (pathname.includes('/oauth-callback')) {
      return await handleOAuthCallback(req, supabase);
    }

    // A partir daqui, rotas protegidas
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização ausente');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Roteamento
    if (pathname.includes('/oauth-start')) {
      return await handleOAuthStart(req, supabase, user);
    }
    if (pathname.includes('/sync-products')) {
      return await handleSyncProducts(req, supabase, user);
    }
    
    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
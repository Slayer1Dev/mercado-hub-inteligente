import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar logs detalhados
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

// NOTE: Funções de criptografia não serão usadas por enquanto devido à falta de gerenciamento de chaves.
// async function encryptToken...
// async function decryptToken...

async function handleOAuthStart(req: Request, supabase: any) {
  // ... (código existente, sem alterações)
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
  // ... (código existente, com uma alteração no salvamento dos tokens)
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
    
    // ALTERAÇÃO AQUI: Salvar os tokens em texto plano.
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        integration_type: 'mercado_livre',
        is_connected: true,
        credentials: {
          access_token: tokens.access_token, // Salvo diretamente
          refresh_token: tokens.refresh_token, // Salvo diretamente
          ml_user_id: tokens.user_id,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type,
        },
        last_sync: new Date().toISOString(),
      });

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

// NOVA FUNÇÃO para sincronizar produtos
async function handleSyncProducts(req: Request, supabase: any, user: any) {
  try {
    await createLog(supabase, user.id, 'sync_products', 'info', 'Iniciando sincronização de produtos.', null);

    // 1. Buscar credenciais do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    if (integrationError || !integration?.credentials) {
      throw new Error('Credenciais do Mercado Livre não encontradas.');
    }

    const accessToken = integration.credentials.access_token;
    const mlUserId = integration.credentials.ml_user_id;

    // 2. Buscar IDs dos anúncios do usuário no Mercado Livre
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

    // 3. Buscar detalhes de cada anúncio em lote
    const detailsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${itemIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!detailsResponse.ok) throw new Error('Falha ao buscar detalhes dos itens do ML.');

    const detailsData = await detailsResponse.json();

    // 4. Formatar e salvar no banco de dados
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

    const { error: upsertError } = await supabase.from('products').upsert(productsToUpsert);

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

// SERVIDOR PRINCIPAL
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

    // Rotas públicas que não precisam de autenticação de usuário
    if (pathname.includes('/oauth-callback')) {
      return await handleOAuthCallback(req, supabase);
    }
    
    // A partir daqui, todas as rotas precisam de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders });
    }

    // Rotas protegidas
    if (pathname.includes('/oauth-start')) {
      return await handleOAuthStart(req, supabase);
    }
    
    if (pathname.includes('/sync-products')) {
      return await handleSyncProducts(req, supabase, user);
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (err) {
    console.error('Erro geral:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: corsHeaders,
    });
  }
});
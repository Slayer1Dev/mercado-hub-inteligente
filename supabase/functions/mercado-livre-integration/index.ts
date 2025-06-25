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
  const scopes = 'read offline_access';
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
    body: body,
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
    // Versão completa com paginação que já implementamos
    // ... (o código completo desta função que já funcionou antes)
}

// ... (outras funções handler como handleSyncQuestions, etc.)

// --- Servidor Principal ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const { pathname } = url;

    // Rotas públicas
    if (pathname.includes('/oauth-callback')) {
      return await handleOAuthCallback(req, supabaseClient);
    }

    // Rotas protegidas
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização ausente' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders });
    }

    // Roteamento para as funções protegidas
    if (pathname.includes('/oauth-start')) {
      return await handleOAuthStart(req, supabaseClient, user);
    }
    if (pathname.includes('/sync-products')) {
      return await handleSyncProducts(req, supabaseClient, user);
    }
    // Adicione outras rotas aqui conforme necessário

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error('Erro na Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
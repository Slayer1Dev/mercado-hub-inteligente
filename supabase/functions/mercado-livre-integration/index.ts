
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

// Função para criptografar tokens
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Função para descriptografar tokens
async function decryptToken(encryptedToken: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
  const encrypted = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
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

    // Trocar código por tokens
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID!,
        client_secret: ML_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      await createLog(supabase, state, 'oauth_callback', 'error', 'Falha ao obter tokens', { error: errorData });
      return new Response('Falha na autenticação', { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

    // Salvar tokens no banco
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        integration_type: 'mercado_livre',
        is_connected: true,
        credentials: {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
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

    // Redirecionar para o dashboard
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/settings?connected=mercado_livre`,
      },
    });

  } catch (error) {
    await createLog(supabase, null, 'oauth_callback', 'error', 'Erro interno no callback', { error: error.message });
    return new Response('Erro interno', { status: 500 });
  }
}

async function syncQuestions(req: Request, supabase: any) {
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
      await createLog(supabase, null, 'sync_questions', 'error', 'Usuário não autenticado', { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Buscar credenciais do usuário
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    if (integrationError || !integration) {
      await createLog(supabase, user.id, 'sync_questions', 'error', 'Integração não encontrada', { error: integrationError?.message });
      return new Response(JSON.stringify({ error: 'Mercado Livre não conectado' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Aqui você implementaria a lógica para buscar perguntas do ML
    // Por enquanto, vamos simular o processo
    await createLog(supabase, user.id, 'sync_questions', 'info', 'Iniciando sincronização de perguntas', null);

    // Exemplo de como seria a chamada real:
    // const questionsResponse = await fetch('https://api.mercadolibre.com/questions/search?seller_id=USER_ID', {
    //   headers: { 'Authorization': `Bearer ${accessToken}` }
    // });

    await createLog(supabase, user.id, 'sync_questions', 'success', 'Sincronização concluída', { questionsFound: 0 });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sincronização iniciada com sucesso',
      questionsFound: 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    await createLog(supabase, null, 'sync_questions', 'error', 'Erro na sincronização', { error: error.message });
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname.includes('/oauth-start')) {
      return await handleOAuthStart(req, supabase);
    }
    
    if (pathname.includes('/oauth-callback')) {
      return await handleOAuthCallback(req, supabase);
    }
    
    if (pathname.includes('/sync-questions')) {
      return await syncQuestions(req, supabase);
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

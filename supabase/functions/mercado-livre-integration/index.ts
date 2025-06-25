// supabase/functions/mercado-livre-integration/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLog, getValidAccessToken } from '../_shared/ml-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cole aqui as suas funções handler que não foram movidas, como:
// async function handleOAuthStart(...) { ... }
// async function handleOAuthCallback(...) { ... }
// async function handleSyncProducts(...) { ... }
// async function handleSyncQuestions(...) { ... }
// etc...

// Se você não tiver certeza, pode colar as versões que já funcionaram antes.
// O mais importante é o SERVE abaixo.

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
      // return await handleOAuthCallback(req, supabase); // Exemplo
    }

    // A partir daqui, rotas protegidas
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização ausente');
    
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Usuário não autenticado');

    // Roteamento
    if (pathname.includes('/oauth-start')) {
      // return await handleOAuthStart(req, supabase, user); // Exemplo
    }
    if (pathname.includes('/sync-products')) {
      // return await handleSyncProducts(req, supabase, user); // Exemplo
    }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
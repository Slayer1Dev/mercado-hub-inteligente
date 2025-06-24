// supabase/functions/update-ml-status/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLog, getValidAccessToken } from '../_shared/ml-auth.ts'; // Importa do helper

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let userForLog: any = null;
  let requestBody: any = {};

  try {
    // 1. Get user and request body
    requestBody = await req.json();
    const { item_id, status } = requestBody;
    if (!item_id || typeof item_id !== 'string') {
      throw new Error('O "item_id" é obrigatório e deve ser uma string.');
    }
    if (!['active', 'paused'].includes(status)) {
      throw new Error('O "status" é obrigatório e deve ser "active" ou "paused".');
    }

    // 2. Create Supabase clients
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 3. Get user data
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Usuário não encontrado.");
    userForLog = user;

    // 4. Get user's ML integration details
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('user_integrations')
      .select('ml_user_id, ml_refresh_token')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    if (integrationError || !integration) {
      throw new Error("Integração com Mercado Livre não encontrada para este usuário.");
    }

    // 5. Get a valid ML access token
    const accessToken = await getValidAccessToken(integration.ml_refresh_token, supabaseAdmin, user.id);

    // 6. Update status on Mercado Livre
    const mlResponse = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        status: status,
      }),
    });

    if (!mlResponse.ok) {
      const errorBody = await mlResponse.json();
      console.error(`Erro no ML para ${item_id}:`, errorBody);
      throw new Error(`Erro no ML para ${item_id}: ${errorBody.message || 'Erro desconhecido'}`);
    }

    // 7. Update status on Supabase
    const { error: dbError } = await supabaseAdmin
      .from('products')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('ml_item_id', item_id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error(`Erro no DB para ${item_id}:`, dbError);
      throw new Error(`Erro no DB para ${item_id}: ${dbError.message}`);
    }
    
    // 8. Log success and return response
    await createLog(
      supabaseAdmin,
      user.id,
      'mercado_livre',
      'update_status',
      'success',
      `Status do item ${item_id} atualizado para ${status}.`,
      { item_id, status }
    );
    return new Response(JSON.stringify({ message: `Status do item ${item_id} atualizado para ${status}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await createLog(
      supabaseAdmin,
      userForLog?.id, // May be null if user fetch failed
      'mercado_livre',
      'update_status',
      'error',
      error.message,
      requestBody // Log the original request body if available
    );
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
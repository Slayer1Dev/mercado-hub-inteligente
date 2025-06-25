// supabase/functions/update-ml-status/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getValidAccessToken, createLog } from '../_shared/ml-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
  let userIdForLog: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização ausente');

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Usuário não autenticado');
    userIdForLog = user.id;

    const { item_id, status } = await req.json();
    if (!item_id || !['active', 'paused'].includes(status)) {
      throw new Error('Parâmetros inválidos: item_id e status ("active" ou "paused") são necessários.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);

    const mlResponse = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!mlResponse.ok) {
      const errorBody = await mlResponse.json();
      throw new Error(errorBody.message || 'Erro ao atualizar status no Mercado Livre.');
    }

    const successMessage = `Anúncio ${status === 'active' ? 'ativado' : 'pausado'}.`;
    await createLog(supabase, user.id, 'update_status', 'success', successMessage, { item_id });

    return new Response(JSON.stringify({ success: true, message: successMessage }), { headers: corsHeaders });
  } catch (err) {
    await createLog(supabase, userIdForLog, 'update_status', 'error', err.message, null);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
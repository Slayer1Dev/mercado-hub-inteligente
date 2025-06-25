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

    const { item_ids, stock } = await req.json();
    if (!item_ids || !Array.isArray(item_ids) || stock === undefined || isNaN(Number(stock))) {
      throw new Error('Parâmetros inválidos: item_ids (array) e stock (número) são necessários.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    
    const updates = item_ids.map(itemId => ({
      method: 'PUT',
      path: `/items/${itemId}`,
      body: { available_quantity: Number(stock) },
    }));

    const mlResponse = await fetch('https://api.mercadolibre.com/multiget?s=items', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if(!mlResponse.ok) {
        const errorBody = await mlResponse.json();
        throw new Error(errorBody.message || 'Erro ao atualizar estoque no Mercado Livre.');
    }

    await createLog(supabase, user.id, 'update_stock', 'success', `Estoque de ${item_ids.length} itens atualizado para ${stock}.`, { itemCount: item_ids.length });
    return new Response(JSON.stringify({ success: true, message: 'Estoque atualizado.' }), { headers: corsHeaders });

  } catch (err) {
    await createLog(supabase, userIdForLog, 'update_stock', 'error', err.message, null);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
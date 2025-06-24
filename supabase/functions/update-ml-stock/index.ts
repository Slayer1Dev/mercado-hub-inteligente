// supabase/functions/update-ml-stock/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getValidAccessToken } from '../_shared/ml-auth.ts'; // Helper que vamos criar

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser((req.headers.get('Authorization')!).replace('Bearer ', ''));
    if (!user) throw new Error('Usuário não autenticado');

    const { item_ids, stock } = await req.json();
    if (!item_ids || !Array.isArray(item_ids) || stock === undefined) {
      throw new Error('Parâmetros inválidos: item_ids (array) e stock (número) são necessários.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    const updates = item_ids.map(itemId => ({
      method: 'PUT',
      path: `/items/${itemId}`,
      body: { available_quantity: stock },
    }));

    await fetch('https://api.mercadolibre.com/multiget?s=items', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    return new Response(JSON.stringify({ success: true, message: 'Estoque atualizado.' }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
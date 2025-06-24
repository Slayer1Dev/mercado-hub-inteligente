// supabase/functions/update-ml-stock/index.ts

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

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização ausente');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Usuário não autenticado');

    const { item_ids, stock } = await req.json();
    if (!item_ids || !Array.isArray(item_ids) || stock === undefined || isNaN(Number(stock))) {
      throw new Error('Parâmetros inválidos: item_ids (array) e stock (número) são necessários.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);

    // O Mercado Livre permite atualizar até 20 itens por vez em lote.
    // Esta função prepara os dados para a chamada em lote.
    const updates = item_ids.map(itemId => ({
      method: 'PUT',
      path: `/items/${itemId}`,
      body: {
        variations: [{
          id: (itemId.split('MLB')[1]), // Extrai o ID da variação se existir
          available_quantity: Number(stock)
        }],
        available_quantity: Number(stock)
      },
    }));

    const response = await fetch('https://api.mercadolibre.com/multiget?json_data=true', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(updates),
    });
    
    if(!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Erro da API do ML: ${JSON.stringify(errorBody)}`);
    }

    await createLog(supabase, user.id, 'update_stock', 'success', `Estoque de ${item_ids.length} produtos atualizado para ${stock}.`, null);

    return new Response(JSON.stringify({ success: true, message: 'Estoque atualizado.' }), { headers: corsHeaders });
  } catch (err) {
    // Note que err.message já é uma string, não precisa de stringify
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
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

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
  
  try {
    const { data: { user } } = await supabase.auth.getUser((req.headers.get('Authorization')!).replace('Bearer ', ''));
    if (!user) throw new Error('Usuário não autenticado');

    const { item_ids, stock } = await req.json();
    if (!item_ids || !Array.isArray(item_ids) || stock === undefined || isNaN(Number(stock))) {
      throw new Error('Parâmetros inválidos.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    
    // CORREÇÃO: Simplificamos o corpo da requisição para o formato correto
    // que o Mercado Livre espera para anúncios simples.
    const updates = item_ids.map(itemId => ({
      method: 'PUT',
      path: `/items/${itemId}`,
      body: {
        available_quantity: Number(stock)
      },
    }));

    // Usamos a API de multiget para atualizar todos de uma vez
    const mlResponse = await fetch('https://api.mercadolibre.com/multiget?s=items', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if(!mlResponse.ok) {
        const errorBody = await mlResponse.json();
        throw new Error(`Erro da API do ML: ${JSON.stringify(errorBody)}`);
    }

    await createLog(supabase, user.id, 'update_stock', 'success', `Estoque de ${item_ids.length} produtos atualizado para ${stock}.`, null);
    return new Response(JSON.stringify({ success: true, message: 'Estoque atualizado com sucesso.' }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
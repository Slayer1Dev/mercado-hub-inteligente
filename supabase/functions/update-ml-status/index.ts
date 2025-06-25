// supabase/functions/update-ml-status/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getValidAccessToken, createLog } from '../_shared/ml-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Trata a requisição de pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    );

    // 1. Valida o corpo da requisição
    const { item_id, status } = await req.json();
    if (!item_id || typeof item_id !== 'string') {
      throw new Error('O "item_id" é obrigatório e deve ser uma string.');
    }
    if (!['active', 'paused'].includes(status)) {
      throw new Error('O "status" é obrigatório e deve ser "active" ou "paused".');
    }

    // 2. Autentica o usuário que está fazendo a chamada
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        throw new Error("Token de autorização ausente.");
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
        throw new Error("Usuário não autenticado ou token inválido.");
    }

    // 3. Obtém um token de acesso válido para a API do Mercado Livre
    const accessToken = await getValidAccessToken(supabaseAdmin, user.id);

    // 4. Monta a requisição para a API do Mercado Livre
    const mlResponse = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!mlResponse.ok) {
      const errorBody = await mlResponse.json();
      console.error(`Erro na API do ML para o item ${item_id}:`, errorBody);
      // Lança um erro com a mensagem vinda diretamente do Mercado Livre
      throw new Error(errorBody.message || 'Erro desconhecido ao atualizar o item no Mercado Livre.');
    }

    // 5. Atualiza o status do produto no seu próprio banco de dados para manter a consistência
    const { error: dbError } = await supabaseAdmin
      .from('products')
      .update({ status, updated_at: new Date().toISOString() }) // Assumindo que você tenha uma coluna 'updated_at'
      .eq('ml_item_id', item_id)
      .eq('user_id', user.id);

    if (dbError) {
      // Loga o erro mas não impede a resposta de sucesso, pois a ação no ML funcionou
      await createLog(supabaseAdmin, user.id, 'update_status_db_sync', 'error', `Falha ao sincronizar status do item ${item_id} no banco local.`, { error: dbError.message });
    }
    
    // 6. Loga o sucesso da operação e retorna a resposta
    const successMessage = `Status do item ${item_id} atualizado para ${status}.`;
    await createLog(supabaseAdmin, user.id, 'update_status', 'success', successMessage, { item_id, status });
    
    return new Response(JSON.stringify({ message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função update-ml-status:", error.message);
    // Retorna uma resposta de erro com a mensagem específica da falha
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Usa 400 para erros de cliente/requisição
    });
  }
});
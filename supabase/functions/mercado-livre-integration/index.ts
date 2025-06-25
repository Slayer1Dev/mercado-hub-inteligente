// supabase/functions/mercado-livre-integration/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLog, getValidAccessToken } from '../_shared/ml-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Funções de Lógica de Negócio ---

async function getGeminiResponse(supabase: any, userId: string, questionText: string, itemDetails: any) {
  // Esta função permanece como no seu código original, sem alterações.
  // ...
}

async function processSingleQuestion(supabase: any, userId: string, questionId: string) {
  // Esta função permanece como no seu código original, sem alterações.
  // ...
}

async function handleWebhook(req: Request, supabase: any) {
  // Esta função permanece como no seu código original, sem alterações.
  // ...
}

async function handleOAuthStart(req: Request, supabase: any) {
  // Esta função permanece como na nossa última versão corrigida, sem alterações.
  // ...
}

async function handleOAuthCallback(req: Request, supabase: any) {
    // Esta função permanece como no seu código original, sem alterações.
    // ...
}

async function handleSyncProducts(req: Request, supabase: any, user: any) {
  // Esta é a versão completa e corrigida com paginação e tratamento de erros.
  try {
    await createLog(supabase, user.id, 'sync_products', 'info', 'Iniciando sincronização completa de produtos.', null);

    const accessToken = await getValidAccessToken(supabase, user.id);
    const { data: integrationData } = await supabase
      .from('user_integrations')
      .select('credentials->>ml_user_id')
      .eq('user_id', user.id)
      .eq('integration_type', 'mercado_livre')
      .single();

    const mlUserId = integrationData?.ml_user_id;
    if (!mlUserId) throw new Error("ID de usuário do Mercado Livre não encontrado.");

    let allItemIds: string[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const itemsResponse = await fetch(`https://api.mercadolibre.com/users/${mlUserId}/items/search?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!itemsResponse.ok) throw new Error(`Falha ao buscar lista de itens do ML na página com offset ${offset}.`);
      
      const itemsData = await itemsResponse.json();
      const newIds = itemsData.results || [];
      allItemIds.push(...newIds);

      if (newIds.length < limit) break;
      offset += limit;
    }

    if (allItemIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum produto encontrado para sincronizar.' }), { headers: corsHeaders });
    }
    
    await createLog(supabase, user.id, 'sync_products', 'info', `Total de ${allItemIds.length} IDs de produtos encontrados. Buscando detalhes...`, null);

    const allProductsDetails = [];
    const batchSize = 20;

    for (let i = 0; i < allItemIds.length; i += batchSize) {
      const batchIds = allItemIds.slice(i, i + batchSize);
      const detailsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batchIds.join(',')}&attributes=id,title,price,available_quantity,status,permalink,thumbnail,attributes`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!detailsResponse.ok) {
        await createLog(supabase, user.id, 'sync_products', 'warning', `Falha ao buscar detalhes de um lote de itens.`, { batchIds });
        continue;
      }
      
      const detailsData = await detailsResponse.json();
      allProductsDetails.push(...detailsData.filter((item: any) => item.code === 200).map((item: any) => item.body));
    }
    
    const productsToUpsert = allProductsDetails.map((item: any) => {
      const eanAttribute = item.attributes.find((attr: any) => attr.id === 'EAN');
      return {
          user_id: user.id,
          ml_item_id: item.id,
          title: item.title,
          price: item.price,
          stock_quantity: item.available_quantity,
          status: item.status,
          permalink: item.permalink,
          thumbnail: item.thumbnail,
          ean: eanAttribute ? eanAttribute.value_name : null,
          last_synced_at: new Date().toISOString(),
      };
    });
    
    if (productsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'user_id, ml_item_id' });
        if (upsertError) throw new Error(`Erro ao salvar produtos no banco de dados: ${upsertError.message}`);
    }

    const successMessage = `${productsToUpsert.length} de ${allItemIds.length} produtos sincronizados com sucesso.`;
    await createLog(supabase, user.id, 'sync_products', 'success', successMessage, { count: productsToUpsert.length });

    return new Response(JSON.stringify({ message: successMessage }), { headers: corsHeaders });

  } catch (error) {
    await createLog(supabase, user.id, 'sync_products', 'error', 'Erro durante a sincronização de produtos.', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function handleSyncQuestions(req: Request, supabase: any, user: any) {
  // Esta função permanece como no seu código original, mas com os headers de CORS no retorno
  try {
    // ... (toda a sua lógica de sync questions)
    // No final:
    return new Response(JSON.stringify({ message: "Sincronização de perguntas concluída" }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}

async function handleAnswerQuestion(req: Request, supabase: any, user: any) {
  // Esta função permanece como no seu código original, já que ela já retornava com os headers
  // ...
}

// --- SERVE PRINCIPAL ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    // Rotas públicas que não precisam de autenticação de usuário
    if (pathname.includes('/oauth-callback')) { return await handleOAuthCallback(req, supabase); }
    if (pathname.includes('/webhook')) { return await handleWebhook(req, supabase); }

    // A partir daqui, todas as rotas precisam de um usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), { status: 401, headers: corsHeaders });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: corsHeaders });
    }

    // Roteamento para as funções protegidas
    if (pathname.includes('/oauth-start')) { return await handleOAuthStart(req, supabase); }
    if (pathname.includes('/sync-products')) { return await handleSyncProducts(req, supabase, user); }
    if (pathname.includes('/sync-questions')) { return await handleSyncQuestions(req, supabase, user); }
    if (pathname.includes('/answer-question')) { return await handleAnswerQuestion(req, supabase, user); }

    return new Response(JSON.stringify({ error: "Rota não encontrada" }), { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error('Erro geral na Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
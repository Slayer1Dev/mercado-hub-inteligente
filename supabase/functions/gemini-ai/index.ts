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
        integration_type: 'gemini',
        action,
        status,
        message,
        details
      });
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
}

async function generateResponse(req: Request, supabase: any) {
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
      await createLog(supabase, null, 'generate_response', 'error', 'Usuário não autenticado', { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { questionText, customPrompt, itemDetails } = await req.json();

    if (!questionText) {
      await createLog(supabase, user.id, 'generate_response', 'error', 'Texto da pergunta não fornecido', null);
      return new Response(JSON.stringify({ error: 'Texto da pergunta é obrigatório' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      await createLog(supabase, user.id, 'generate_response', 'error', 'API Key do Gemini não configurada', null);
      return new Response(JSON.stringify({ error: 'Configuração da IA incompleta' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    await createLog(supabase, user.id, 'generate_response', 'info', 'Iniciando geração de resposta com IA', { 
      questionLength: questionText.length,
      hasCustomPrompt: !!customPrompt,
      hasItemDetails: !!itemDetails
    });

    const basePrompt = `Você é um assistente de vendas especialista em Mercado Livre.
Você deve responder perguntas de clientes de forma clara, profissional e persuasiva.
Sempre seja educado, prestativo e focado em ajudar o cliente a tomar a decisão de compra.`;

    const contextPrompt = itemDetails ? `
Informações do produto:
${JSON.stringify(itemDetails, null, 2)}` : '';

    const userCustomPrompt = customPrompt ? `
Instruções específicas do vendedor:
${customPrompt}` : '';

    const fullPrompt = `${basePrompt}
${contextPrompt}
${userCustomPrompt}

Pergunta do cliente: "${questionText}"

Responda de forma direta e útil:`;

    // Chamar API do Gemini (MODELO ALTERADO)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      await createLog(supabase, user.id, 'generate_response', 'error', 'Falha na API do Gemini', { 
        status: geminiResponse.status,
        error: errorText
      });
      return new Response(JSON.stringify({ error: 'Falha ao comunicar com a IA' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      await createLog(supabase, user.id, 'generate_response', 'error', 'Resposta vazia da IA', { geminiData });
      return new Response(JSON.stringify({ error: 'IA não conseguiu gerar resposta' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const generatedText = geminiData.candidates[0].content.parts[0].text;

    await createLog(supabase, user.id, 'generate_response', 'success', 'Resposta gerada com sucesso', {
      questionText: questionText.substring(0, 100) + '...',
      responseLength: generatedText.length,
      tokensUsed: geminiData.usageMetadata?.totalTokenCount || 0
    });

    return new Response(JSON.stringify({ 
      response: generatedText,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    await createLog(supabase, null, 'generate_response', 'error', 'Erro interno na geração', { error: error.message });
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function testConnection(req: Request, supabase: any) {
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
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      await createLog(supabase, user.id, 'test_connection', 'error', 'API Key do Gemini não configurada', null);
      return new Response(JSON.stringify({ 
        connected: false, 
        error: 'API Key não configurada' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Teste simples da API (MODELO ALTERADO)
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Responda apenas 'Conexão OK' para testar a API."
          }]
        }]
      }),
    });

    const isConnected = testResponse.ok;
    const status = isConnected ? 'success' : 'error';
    const message = isConnected ? 'Conexão com Gemini testada com sucesso' : 'Falha na conexão com Gemini';
    
    if (!isConnected) {
        const errorDetails = await testResponse.json();
        await createLog(supabase, user.id, 'test_connection', status, message, { 
            responseStatus: testResponse.status,
            errorDetails: errorDetails
        });
    } else {
        await createLog(supabase, user.id, 'test_connection', status, message, { 
            responseStatus: testResponse.status 
        });
    }


    return new Response(JSON.stringify({ 
      connected: isConnected,
      message: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    await createLog(supabase, null, 'test_connection', 'error', 'Erro no teste de conexão', { error: error.message });
    return new Response(JSON.stringify({ 
      connected: false, 
      error: 'Erro interno' 
    }), {
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
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname.includes('/generate')) {
      return await generateResponse(req, supabase);
    }
    
    if (pathname.includes('/test')) {
      return await testConnection(req, supabase);
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
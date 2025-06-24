// supabase/functions/_shared/ml-auth.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Função de Log
export async function createLog(supabase: any, userId: string | null, action: string, status: string, message: string, details: any = null) {
    try {
        await supabase.from('integration_logs').insert({
            user_id: userId,
            integration_type: 'mercado_livre',
            action,
            status,
            message,
            details,
        });
    } catch (error) {
        console.error('Erro ao criar log:', error);
    }
}

// Função de Autenticação
export async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
    const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('credentials, updated_at')
        .eq('user_id', userId)
        .eq('integration_type', 'mercado_livre')
        .single();

    if (error || !integration?.credentials) {
        throw new Error('Credenciais do Mercado Livre não encontradas para este usuário.');
    }

    const { access_token, refresh_token, expires_in } = integration.credentials as any;
    const updatedAt = new Date(integration.updated_at).getTime();
    const expirationTime = updatedAt + (expires_in * 1000) - (5 * 60 * 1000); // 5 minutos de margem de segurança

    if (Date.now() < expirationTime) {
        return access_token;
    }

    await createLog(supabase, userId, 'refresh_token', 'info', 'Token de acesso expirado. Renovando...', null);

    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');

    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
        await createLog(supabase, userId, 'refresh_token', 'error', 'Variáveis de ambiente ML_CLIENT_ID ou ML_CLIENT_SECRET não encontradas.', null);
        throw new Error('Configuração de integração do Mercado Livre incompleta no servidor.');
    }

    // --- LINHA CORRIGIDA ---
    const body = `grant_type=refresh_token&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}&refresh_token=${refresh_token}`;

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    if (!response.ok) {
        const errorData = await response.json();
        await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao renovar token.', errorData);
        throw new Error('Não foi possível renovar a autenticação com o Mercado Livre.');
    }

    const newTokens = await response.json();
    
    const newCredentials = {
        ...integration.credentials,
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refresh_token, // O ML pode não retornar um novo refresh_token
        expires_in: newTokens.expires_in,
    };

    const { error: updateError } = await supabase.from('user_integrations').update({
        credentials: newCredentials,
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    if (updateError) {
      await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao salvar novos tokens no banco de dados.', updateError);
    }

    return newTokens.access_token;
}
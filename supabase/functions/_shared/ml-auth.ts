async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('credentials, updated_at')
      .eq('user_id', userId)
      .eq('integration_type', 'mercado_livre')
      .single();
  
    if (integrationError || !integration?.credentials) {
      throw new Error('Credenciais do Mercado Livre não encontradas para o usuário.');
    }
  
    const { access_token, refresh_token, expires_in } = integration.credentials as any;
    const updatedAt = new Date(integration.updated_at).getTime();
  
    const expirationTime = updatedAt + (expires_in * 1000) - (5 * 60 * 1000); // 5 min de margem
  
    if (Date.now() < expirationTime) {
      return access_token;
    }
  
    await createLog(supabase, userId, 'refresh_token', 'info', 'Token de acesso expirado. Renovando...', null);
  
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
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
    
    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({
        credentials: {
            ...integration.credentials, // Mantém dados antigos como ml_user_id
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || refresh_token, // ML pode não retornar um novo refresh token
            expires_in: newTokens.expires_in,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('integration_type', 'mercado_livre');
  
    if (updateError) {
      await createLog(supabase, userId, 'refresh_token', 'error', 'Falha ao salvar novos tokens.', updateError);
    }
  
    return newTokens.access_token;
}
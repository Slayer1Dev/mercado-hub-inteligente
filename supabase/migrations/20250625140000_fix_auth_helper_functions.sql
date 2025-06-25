-- supabase/migrations/20250625140000_fix_auth_helper_functions.sql

-- Corrige a função 'update_user_online_status' para aceitar o user_id como parâmetro,
-- tornando-a compatível com a chamada do frontend.
-- A cláusula "AND auth.uid() = p_user_id" garante que um usuário só pode atualizar seu próprio status.
CREATE OR REPLACE FUNCTION public.update_user_online_status(p_user_id UUID, p_is_online BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_online = p_is_online,
    last_login = CASE WHEN p_is_online = true THEN NOW() ELSE last_login END
  WHERE id = p_user_id AND auth.uid() = p_user_id;
END;
$$;

-- Cria a função 'is_current_user_admin' que estava faltando.
-- Ela simplesmente verifica se o USUÁRIO LOGADO ATUALMENTE tem a role de 'admin'.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Necessário para poder ler a tabela user_roles de forma segura
AS $$
BEGIN
  -- Reutiliza a função is_admin(uuid) que já existe,
  -- passando o ID do usuário autenticado no momento da chamada.
  RETURN public.is_admin(auth.uid());
END;
$$;
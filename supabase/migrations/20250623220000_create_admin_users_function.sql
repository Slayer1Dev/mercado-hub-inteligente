-- supabase/migrations/20250623220000_create_admin_users_function.sql

CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    created_at timestamptz,
    last_login timestamptz,
    is_online boolean,
    notes text,
    subscription json,
    integrations json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificação de segurança para garantir que apenas administradores possam chamar esta função
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: você precisa ser um administrador.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.name,
        p.created_at,
        p.last_login,
        p.is_online,
        p.notes,
        -- Agrega a assinatura do usuário em um único objeto JSON
        (SELECT json_build_object(
            'plan_type', us.plan_type,
            'plan_status', us.plan_status,
            'expires_at', us.expires_at
        )
        FROM public.user_subscriptions us
        WHERE us.user_id = p.id
        LIMIT 1) AS subscription,
        -- Agrega todas as integrações do usuário em um array de JSON
        (SELECT COALESCE(json_agg(json_build_object(
            'integration_type', ui.integration_type,
            'is_connected', ui.is_connected,
            'last_sync', ui.last_sync
        )), '[]'::json)
        FROM public.user_integrations ui
        WHERE ui.user_id = p.id) AS integrations
    FROM
        public.profiles p
    ORDER BY
        p.created_at DESC;
END;
$$;
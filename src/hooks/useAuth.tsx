// src/hooks/useAuth.tsx

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces...
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  is_online: boolean;
  last_login: string | null;
  notes: string | null;
}

interface UserSubscription {
  plan_type: 'trial' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';
  plan_status: 'active' | 'expired' | 'cancelled' | 'pending';
  expires_at: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateOnlineStatus = useCallback(async (isOnline: boolean, userId?: string) => {
    if (!userId) return;
    try {
      await supabase.rpc('update_user_online_status', { user_id: userId, is_online: isOnline });
    } catch (error) {
      console.error('Falha ao atualizar status online:', error);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [profileResponse, subscriptionResponse, isAdminResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_subscriptions').select('plan_type, plan_status, expires_at').eq('user_id', userId).single(),
        supabase.rpc('is_current_user_admin')
      ]);
      
      // Não jogue erros aqui, apenas logue para não quebrar a UI
      if (profileResponse.error) console.error("Erro ao buscar perfil:", profileResponse.error.message);
      if (subscriptionResponse.error) console.error("Erro ao buscar assinatura:", subscriptionResponse.error.message);
      if (isAdminResponse.error) console.error("Erro ao verificar admin:", isAdminResponse.error.message);

      setProfile(profileResponse.data);
      setSubscription(subscriptionResponse.data);
      setIsAdmin(isAdminResponse.data || false);
    } catch (error) {
      console.error('Falha crítica ao carregar dados do usuário:', error);
    }
  }, []);
  
  useEffect(() => {
    // Inicia o carregamento
    setLoading(true);

    // Pega a sessão inicial para carregar a UI rapidamente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
        await updateOnlineStatus(true, session.user.id);
      }
      // Finaliza o carregamento inicial
      setLoading(false);
    });

    // Escuta por futuras mudanças de autenticação (login/logout)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true); // Mostra loading ao revalidar
          await loadUserData(session.user.id);
          await updateOnlineStatus(true, session.user.id);
          setLoading(false);
        } else {
          // Limpa o estado se o usuário fizer logout
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [loadUserData, updateOnlineStatus]);

  const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
  
  const signUp = (email: string, password: string, name?: string) => supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: name ? { name } : undefined,
      },
    });

  const signOut = async () => {
    if(user) await updateOnlineStatus(false, user.id);
    await supabase.auth.signOut();
  };
  
  const hasAccess = isAdmin || (subscription?.plan_status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > new Date()));

  return { user, session, profile, subscription, isAdmin, loading, hasAccess, signIn, signUp, signOut };
};
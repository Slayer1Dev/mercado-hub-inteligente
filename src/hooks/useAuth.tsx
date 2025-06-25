// src/hooks/useAuth.tsx

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const loadUserData = useCallback(async (userId: string) => {
    try {
        const [profileResponse, subscriptionResponse, isAdminResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_subscriptions').select('plan_type, plan_status, expires_at').eq('user_id', userId).single(),
            supabase.rpc('is_current_user_admin')
        ]);

        if (profileResponse.error) console.error("Erro ao buscar perfil:", profileResponse.error.message);
        if (subscriptionResponse.error) console.error("Erro ao buscar assinatura:", subscriptionResponse.error.message);
        if (isAdminResponse.error) console.error("Erro ao verificar admin:", isAdminResponse.error.message);

        setProfile(profileResponse.data);
        setSubscription(subscriptionResponse.data);
        setIsAdmin(isAdminResponse.data || false);
    } catch (error) {
        console.error('Falha crítica ao carregar dados do usuário:', error);
        toast.error("Erro crítico", { description: "Não foi possível carregar os dados da sua conta. Tente recarregar a página." });
    }
  }, []);

  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!supabase.auth.getSession()) return;
    try {
      await supabase.rpc('update_user_online_status', { is_online: isOnline });
    } catch (error) {
      // Silencioso para não incomodar o usuário
      console.error('Falha ao atualizar status online:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        await loadUserData(currentUser.id);
        await updateOnlineStatus(true);
      } else {
        setProfile(null);
        setSubscription(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    // Adiciona um listener para quando a aba do navegador fica visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus(true);
      } else {
        updateOnlineStatus(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      authListener.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Garante que o usuário seja marcado como offline ao fechar
      if (user) {
         updateOnlineStatus(false);
      }
    };
  }, [loadUserData, updateOnlineStatus, user]);

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
    await updateOnlineStatus(false);
    return supabase.auth.signOut();
  };
  
  const hasAccess = isAdmin || (subscription?.plan_status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > new Date()));

  return {
    user,
    session,
    profile,
    subscription,
    isAdmin,
    loading,
    hasAccess,
    signIn,
    signUp,
    signOut,
  };
};
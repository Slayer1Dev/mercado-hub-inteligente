// src/hooks/useAuth.tsx

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const loadAuthData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
          await updateOnlineStatus(true);
        }
        setLoading(false);
    };
    
    loadAuthData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserData(session.user.id);
        await updateOnlineStatus(true);
      } else {
        setProfile(null);
        setSubscription(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Carrega perfil e assinatura em paralelo
      const [profileResponse, subscriptionResponse, isAdminResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_subscriptions').select('plan_type, plan_status, expires_at').eq('user_id', userId).single(),
        // --- CORREÇÃO APLICADA AQUI ---
        // Usando a nova função RPC para verificar se é admin
        supabase.rpc('is_current_user_admin')
      ]);

      if (profileResponse.data) setProfile(profileResponse.data);
      if (subscriptionResponse.data) setSubscription(subscriptionResponse.data);
      
      // Define o status de admin com base na resposta da função RPC
      setIsAdmin(isAdminResponse.data || false);
      
      // Trata os erros, se houver
      if (profileResponse.error) throw profileResponse.error;
      if (subscriptionResponse.error) throw subscriptionResponse.error;
      if (isAdminResponse.error) throw isAdminResponse.error;

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await supabase.rpc('update_user_online_status', { is_online: isOnline });
    } catch (error) {
      console.error('Erro ao atualizar status online:', error);
    }
  };

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
  
  const hasAccess = () => {
    if (isAdmin) return true;
    if (!subscription) return false;
    if (subscription.plan_status === 'active') {
      return !subscription.expires_at || new Date(subscription.expires_at) > new Date();
    }
    return false;
  };

  useEffect(() => {
    return () => {
      if (user) {
        updateOnlineStatus(false);
      }
    };
  }, [user]);

  return {
    user,
    session,
    profile,
    subscription,
    isAdmin,
    loading,
    hasAccess: hasAccess(),
    signIn,
    signUp,
    signOut,
    updateOnlineStatus,
  };
};
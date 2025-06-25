// src/hooks/useAuth.tsx

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Interfaces permanecem as mesmas
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Começa como true

  useEffect(() => {
    // Esta é a única fonte de verdade para autenticação.
    // Ele lida com o estado inicial e quaisquer mudanças futuras.
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user;
        setUser(currentUser ?? null);

        // Se houver um usuário, busca seus dados.
        if (currentUser) {
          try {
            const [profileRes, subRes, adminRes] = await Promise.all([
              supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
              supabase.from('user_subscriptions').select('*').eq('user_id', currentUser.id).single(),
              supabase.rpc('is_current_user_admin')
            ]);

            setProfile(profileRes.data);
            setSubscription(subRes.data);
            setIsAdmin(adminRes.data || false);
          } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            // Limpa o estado em caso de falha para evitar dados inconsistentes
            setProfile(null);
            setSubscription(null);
            setIsAdmin(false);
          }
        } else {
          // Se não houver sessão, limpa tudo.
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
        }
        
        // Garante que o estado de carregamento seja desativado após a verificação inicial.
        setLoading(false);
      }
    );

    // Função de limpeza para remover o listener quando o componente desmontar
    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email: string, password: string, name?: string) => supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/`, data: { name } },
  });
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const hasAccess = isAdmin || (subscription?.plan_status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > new Date()));

  return { user, session, profile, subscription, isAdmin, loading, hasAccess, signIn, signUp, signOut };
};
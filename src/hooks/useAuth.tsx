
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
        updateOnlineStatus(true);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id);
        updateOnlineStatus(true);
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
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load subscription
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('plan_type, plan_status, expires_at')
        .eq('user_id', userId)
        .single();

      if (subscriptionData) {
        setSubscription(subscriptionData);
      }

      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await supabase.rpc('update_user_online_status', { is_online: isOnline });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: name ? { name } : undefined,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await updateOnlineStatus(false);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const hasAccess = () => {
    if (isAdmin) return true;
    if (!subscription) return false;
    
    if (subscription.plan_status === 'active') {
      if (subscription.expires_at) {
        return new Date(subscription.expires_at) > new Date();
      }
      return true;
    }
    
    return false;
  };

  // Cleanup on unmount
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

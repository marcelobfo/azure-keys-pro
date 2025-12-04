
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthProvider] initializing auth listeners');

    // Set up auth state listener with proper token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] onAuthStateChange event:', event, { hasSession: !!session });
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthProvider] Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] User signed out, clearing state');
          setSession(null);
          setUser(null);
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthProvider] User updated');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error fetching session:', error);
        // If refresh token is invalid, clear everything
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          console.log('[AuthProvider] Invalid refresh token, clearing session');
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
      } else {
        console.log('[AuthProvider] initial session fetched:', { hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Set up automatic token refresh check every 5 minutes
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[AuthProvider] Session check failed:', error);
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          console.log('[AuthProvider] Forcing logout due to invalid token');
          await supabase.auth.signOut();
          toast({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('[AuthProvider] cleanup auth listener');
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

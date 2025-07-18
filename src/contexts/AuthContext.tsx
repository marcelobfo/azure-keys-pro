
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  const initializationRef = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para persistir estado no localStorage
  const persistAuthState = (session: Session | null) => {
    try {
      if (session) {
        localStorage.setItem('auth_session_backup', JSON.stringify({
          user: session.user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem('auth_session_backup');
      }
    } catch (error) {
      console.warn('Failed to persist auth state:', error);
    }
  };

  // Função para recuperar estado do localStorage
  const recoverAuthState = () => {
    try {
      const backup = localStorage.getItem('auth_session_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        // Verificar se não expirou (24 horas)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          localStorage.removeItem('auth_session_backup');
        }
      }
    } catch (error) {
      console.warn('Failed to recover auth state:', error);
    }
    return null;
  };

  // Função para atualizar estado de auth
  const updateAuthState = (newSession: Session | null, skipPersist = false) => {
    console.log('🔄 Updating auth state:', { hasSession: !!newSession, hasUser: !!newSession?.user });
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    
    if (!skipPersist) {
      persistAuthState(newSession);
    }
  };

  // Gerenciar visibilidade da página para evitar perda de estado
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou oculta - persistir estado atual
        persistAuthState(session);
      } else {
        // Página voltou a ser visível - verificar se estado ainda é válido
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        visibilityTimeoutRef.current = setTimeout(async () => {
          if (!session && !loading) {
            console.log('🔍 Page became visible, checking for valid session...');
            try {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                console.log('✅ Found valid session on visibility change');
                updateAuthState(currentSession);
              } else {
                // Tentar recuperar do backup
                const backup = recoverAuthState();
                if (backup && backup.user) {
                  console.log('🔄 Recovering from backup state');
                  updateAuthState({
                    user: backup.user,
                    access_token: backup.access_token,
                    refresh_token: backup.refresh_token,
                    expires_at: backup.expires_at
                  } as Session, true);
                }
              }
            } catch (error) {
              console.error('Error checking session on visibility change:', error);
            }
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [session, loading]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      console.log('🚀 Initializing auth...');

      try {
        // 1. Configurar listener primeiro
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            
            console.log('🔔 Auth state change:', { event, hasSession: !!session });
            
            if (event === 'SIGNED_OUT') {
              updateAuthState(null);
            } else if (session) {
              updateAuthState(session);
            }
            
            // Só definir loading como false após primeira mudança de estado
            if (loading) {
              setLoading(false);
            }
          }
        );

        // 2. Verificar sessão atual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Tentar recuperar do backup em caso de erro
          const backup = recoverAuthState();
          if (backup && backup.user) {
            console.log('🔄 Using backup state due to error');
            updateAuthState({
              user: backup.user,
              access_token: backup.access_token,
              refresh_token: backup.refresh_token,
              expires_at: backup.expires_at
            } as Session, true);
          }
        } else if (currentSession) {
          console.log('✅ Found existing session');
          updateAuthState(currentSession);
        } else {
          console.log('❌ No session found');
          updateAuthState(null);
        }

        // Garantir que loading seja false após inicialização
        if (mounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.session) {
        updateAuthState(data.session);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
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
        return { error };
      }

      if (data.session) {
        updateAuthState(data.session);
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo!",
        });
      } else {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        updateAuthState(null);
        toast({
          title: "Logout realizado com sucesso!",
          description: "Até logo!",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
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

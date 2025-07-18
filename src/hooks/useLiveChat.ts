import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  id: string;
  lead_id: string;
  attendant_id?: string;
  status: 'waiting' | 'active' | 'ended' | 'abandoned';
  subject?: string;
  started_at: string;
  ended_at?: string;
  lead?: {
    name: string;
    email: string;
    phone?: string;
  };
  attendant?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'lead' | 'attendant' | 'bot';
  sender_id?: string;
  message: string;
  timestamp: string;
  read_status: boolean;
}

export interface AttendantAvailability {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  max_concurrent_chats: number;
  current_chats: number;
}

export const useLiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [availability, setAvailability] = useState<AttendantAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  // Criar nova sessão de chat com fallback robusto
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }) => {
    console.log('=== INICIANDO CRIAÇÃO DE CHAT SESSION ===');
    console.log('Dados do lead:', leadData);
    
    let lead = null;
    let session = null;
    
    try {
      // STEP 1: Criar lead com retry
      console.log('1. Criando lead...');
      
      const leadPayload = {
        name: leadData.name.trim(),
        email: leadData.email.trim().toLowerCase(),
        phone: leadData.phone?.trim() || null,
        message: leadData.message?.trim() || null,
        status: 'new'
      };
      
      console.log('Payload do lead:', leadPayload);
      
      // Retry para criação do lead
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data: leadResult, error: leadError } = await supabase
            .from('leads')
            .insert(leadPayload)
            .select()
            .single();

          if (leadError) {
            console.error(`Tentativa ${attempt} - Erro ao criar lead:`, leadError);
            if (attempt === 3) throw leadError;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          if (!leadResult?.id) {
            console.error(`Tentativa ${attempt} - Lead sem ID válido:`, leadResult);
            if (attempt === 3) throw new Error('Lead criado mas sem ID válido');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          lead = leadResult;
          console.log('Lead criado com sucesso:', lead);
          break;
        } catch (retryError) {
          console.error(`Tentativa ${attempt} falhou:`, retryError);
          if (attempt === 3) throw retryError;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!lead) {
        throw new Error('Falha ao criar lead após 3 tentativas');
      }

      // STEP 2: Criar sessão de chat com fallback
      console.log('2. Criando sessão de chat...');
      
      // Aguardar para garantir que o lead foi persistido
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const sessionPayload = {
        lead_id: lead.id,
        subject: leadData.subject?.trim() || 'Atendimento Geral',
        status: 'waiting'
      };
      
      console.log('Payload da sessão:', sessionPayload);
      
      // Retry para criação da sessão
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data: sessionResult, error: sessionError } = await supabase
            .from('chat_sessions')
            .insert(sessionPayload)
            .select()
            .single();

          if (sessionError) {
            console.error(`Tentativa ${attempt} - Erro ao criar sessão:`, sessionError);
            if (attempt === 3) {
              // Se falhar, pelo menos o lead foi criado
              console.log('FALLBACK: Lead criado mas sessão falhou. Usuário pode tentar novamente.');
              toast({
                title: 'Lead registrado!',
                description: 'Não foi possível iniciar o chat, mas seu contato foi registrado. Retornaremos em breve!',
                variant: 'default',
              });
              return { id: 'fallback-' + lead.id, lead_id: lead.id };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          if (!sessionResult?.id) {
            console.error(`Tentativa ${attempt} - Sessão sem ID:`, sessionResult);
            if (attempt === 3) {
              toast({
                title: 'Lead registrado!',
                description: 'Não foi possível iniciar o chat, mas seu contato foi registrado.',
              });
              return { id: 'fallback-' + lead.id, lead_id: lead.id };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          session = sessionResult;
          console.log('Sessão criada com sucesso:', session);
          break;
        } catch (retryError) {
          console.error(`Tentativa ${attempt} de sessão falhou:`, retryError);
          if (attempt === 3) {
            toast({
              title: 'Lead registrado!',
              description: 'Não foi possível iniciar o chat, mas seu contato foi registrado.',
            });
            return { id: 'fallback-' + lead.id, lead_id: lead.id };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      // STEP 3: Enviar mensagem inicial (opcional, não bloqueia)
      if (session && leadData.message?.trim()) {
        console.log('3. Tentando enviar mensagem inicial...');
        
        try {
          await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              sender_type: 'lead',
              message: leadData.message.trim(),
              read_status: false
            });
          console.log('Mensagem inicial enviada');
        } catch (messageError) {
          console.error('Erro ao enviar mensagem inicial (não crítico):', messageError);
        }
      }

      console.log('=== CHAT SESSION CRIADO COM SUCESSO ===');
      
      toast({
        title: 'Chat iniciado com sucesso!',
        description: 'Um de nossos atendentes estará com você em breve.',
      });

      return session;
      
    } catch (error) {
      console.error('=== ERRO CRÍTICO NA CRIAÇÃO DO CHAT ===');
      console.error('Erro completo:', error);
      
      // Se chegou aqui, mesmo o lead falhou
      let errorMessage = 'Não foi possível processar sua solicitação. Tente novamente em alguns minutos.';
      
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'Sistema em configuração. Tente novamente em alguns minutos.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'Você já possui um contato registrado. Nossa equipe entrará em contato.';
        }
      }
      
      toast({
        title: 'Erro ao processar solicitação',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  // Aceitar sessão de chat (atendente)
  const acceptChatSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          attendant_id: user?.id,
          status: 'active'
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Atualizar contagem de chats ativos
      await supabase
        .from('attendant_availability')
        .update({
          current_chats: availability ? availability.current_chats + 1 : 1
        })
        .eq('user_id', user?.id);

      toast({
        title: 'Chat aceito!',
        description: 'Você agora está atendendo este cliente.',
      });
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar o chat.',
        variant: 'destructive',
      });
    }
  };

  // Finalizar sessão de chat
  const endChatSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Atualizar contagem de chats ativos
      if (availability && availability.current_chats > 0) {
        await supabase
          .from('attendant_availability')
          .update({
            current_chats: availability.current_chats - 1
          })
          .eq('user_id', user?.id);
      }
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async (
    sessionId: string, 
    message: string, 
    senderType: 'lead' | 'attendant' | 'bot' = 'attendant'
  ) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: senderType,
          sender_id: senderType === 'attendant' ? user?.id : null,
          message,
          read_status: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  // Marcar mensagens como lidas
  const markMessagesAsRead = async (sessionId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ read_status: true })
        .eq('session_id', sessionId)
        .eq('read_status', false);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Atualizar disponibilidade do atendente
  const updateAvailability = async (isOnline: boolean) => {
    try {
      const { error } = await supabase
        .from('attendant_availability')
        .upsert({
          user_id: user?.id,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
    }
  };

  // Buscar sessões de chat
  const fetchChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          leads!chat_sessions_lead_id_fkey (name, email, phone),
          profiles!chat_sessions_attendant_id_fkey (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedSessions = data?.map(session => ({
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended' | 'abandoned',
        lead: session.leads,
        attendant: session.profiles
      })) || [];
      
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    }
  };

  // Buscar mensagens de uma sessão
  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'lead' | 'attendant' | 'bot'
      })) || [];
      
      setMessages(prev => ({
        ...prev,
        [sessionId]: formattedMessages
      }));
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  // Configurar real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('live-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          fetchChatSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          fetchChatSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            sender_type: payload.new.sender_type as 'lead' | 'attendant' | 'bot'
          } as ChatMessage;
          setMessages(prev => ({
            ...prev,
            [newMessage.session_id]: [
              ...(prev[newMessage.session_id] || []),
              newMessage
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchChatSessions();
      setLoading(false);
    }
  }, [user]);

  return {
    sessions,
    messages,
    availability,
    loading,
    createChatSession,
    acceptChatSession,
    endChatSession,
    sendMessage,
    markMessagesAsRead,
    updateAvailability,
    fetchMessages,
    fetchChatSessions
  };
};
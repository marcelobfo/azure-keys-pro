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

  // Criar nova sessão de chat
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }) => {
    console.log('=== INICIANDO CRIAÇÃO DE CHAT SESSION ===');
    console.log('Dados do lead:', leadData);
    
    try {
      console.log('1. Criando lead...');
      
      // Primeiro criar o lead - com dados obrigatórios
      const leadPayload = {
        name: leadData.name.trim(),
        email: leadData.email.trim(),
        phone: leadData.phone?.trim() || null,
        message: leadData.message?.trim() || null,
        status: 'new'
      };
      
      console.log('Payload do lead:', leadPayload);
      
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadPayload)
        .select()
        .single();

      if (leadError) {
        console.error('Erro detalhado ao criar lead:', {
          error: leadError,
          code: leadError.code,
          message: leadError.message,
          details: leadError.details
        });
        throw new Error(`Erro ao criar lead: ${leadError.message}`);
      }

      if (!lead || !lead.id) {
        console.error('Lead criado mas sem ID válido:', lead);
        throw new Error('Lead criado mas sem ID válido');
      }

      console.log('2. Lead criado com sucesso:', lead);

      // Aguardar um pouco para garantir que o lead foi persistido
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('3. Criando sessão de chat...');
      
      // Criar a sessão de chat
      const sessionPayload = {
        lead_id: lead.id,
        subject: leadData.subject?.trim() || null,
        status: 'waiting'
      };
      
      console.log('Payload da sessão:', sessionPayload);
      
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert(sessionPayload)
        .select()
        .single();

      if (sessionError) {
        console.error('Erro detalhado ao criar sessão:', {
          error: sessionError,
          code: sessionError.code,
          message: sessionError.message,
          details: sessionError.details,
          hint: sessionError.hint
        });
        throw new Error(`Erro ao criar sessão: ${sessionError.message}`);
      }

      if (!session || !session.id) {
        console.error('Sessão criada mas sem ID válido:', session);
        throw new Error('Sessão criada mas sem ID válido');
      }

      console.log('4. Sessão criada com sucesso:', session);

      // Enviar mensagem inicial se houver
      if (leadData.message && leadData.message.trim()) {
        console.log('5. Enviando mensagem inicial...');
        
        const messagePayload = {
          session_id: session.id,
          sender_type: 'lead',
          message: leadData.message.trim(),
          read_status: false
        };
        
        console.log('Payload da mensagem:', messagePayload);
        
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert(messagePayload);

        if (messageError) {
          console.error('Erro ao enviar mensagem inicial:', messageError);
          // Não bloqueamos o fluxo por causa da mensagem
        } else {
          console.log('6. Mensagem inicial enviada com sucesso');
        }
      }

      console.log('=== CHAT SESSION CRIADO COM SUCESSO ===');
      console.log('Session final:', session);
      
      toast({
        title: 'Chat iniciado!',
        description: 'Aguarde um momento que um de nossos atendentes irá te ajudar.',
      });

      return session;
    } catch (error) {
      console.error('=== ERRO NA CRIAÇÃO DO CHAT ===');
      console.error('Erro completo:', error);
      
      // Tentar mostrar erro mais específico
      let errorMessage = 'Não foi possível iniciar o chat. Tente novamente.';
      
      if (error instanceof Error) {
        console.error('Mensagem do erro:', error.message);
        if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'Problema de permissão. O sistema está sendo configurado.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Problema de conexão. Verifique sua internet.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Erro de referência no banco de dados.';
        }
      }
      
      toast({
        title: 'Erro ao iniciar chat',
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
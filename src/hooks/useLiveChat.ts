
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

  // Criar nova sessão de chat SIMPLIFICADO
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }) => {
    console.log('=== CRIANDO CHAT SESSION SIMPLIFICADO ===');
    console.log('Dados:', leadData);
    
    try {
      // STEP 1: Criar lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: leadData.name.trim(),
          email: leadData.email.trim().toLowerCase(),
          phone: leadData.phone?.trim() || null,
          message: leadData.message?.trim() || null,
          status: 'new'
        })
        .select()
        .single();

      if (leadError) {
        console.error('❌ Erro ao criar lead:', leadError);
        throw leadError;
      }

      console.log('✅ Lead criado:', lead);

      // STEP 2: Criar sessão
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          lead_id: lead.id,
          subject: leadData.subject?.trim() || 'Atendimento Geral',
          status: 'waiting'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Erro ao criar sessão:', sessionError);
        throw sessionError;
      }

      console.log('✅ Sessão criada com ID:', session.id);

      // STEP 3: Mensagem inicial (se houver)
      if (leadData.message?.trim()) {
        try {
          await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              sender_type: 'lead',
              message: leadData.message.trim(),
              read_status: false
            });
          console.log('✅ Mensagem inicial enviada');
        } catch (messageError) {
          console.warn('⚠️ Erro ao enviar mensagem inicial (não crítico):', messageError);
        }
      }

      toast({
        title: 'Chat iniciado!',
        description: 'Você já pode conversar conosco.',
      });

      return session;
      
    } catch (error) {
      console.error('❌ Erro ao criar chat session:', error);
      
      toast({
        title: 'Erro ao iniciar chat',
        description: 'Tente novamente em alguns segundos.',
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
      console.error('❌ Erro ao aceitar chat:', error);
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
      console.error('❌ Erro ao finalizar chat:', error);
    }
  };

  // Enviar mensagem CORRIGIDO
  const sendMessage = async (
    sessionId: string, 
    message: string, 
    senderType: 'lead' | 'attendant' | 'bot' = 'attendant'
  ) => {
    console.log('📤 Enviando mensagem:', { sessionId, message: message.substring(0, 50), senderType });

    // CORREÇÃO: Validação simples e direta
    if (!sessionId || sessionId.length < 10) {
      console.error('❌ SessionId inválido:', sessionId);
      throw new Error('ID de sessão inválido');
    }

    const messagePayload = {
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderType === 'attendant' ? user?.id : null,
      message: message.trim(),
      read_status: false
    };

    console.log('📤 Payload da mensagem:', messagePayload);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messagePayload)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro direto ao enviar:', error);
        throw error;
      }

      console.log('✅ Mensagem enviada com sucesso:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
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
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
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
      console.error('❌ Erro ao atualizar disponibilidade:', error);
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
      console.error('❌ Erro ao buscar sessões:', error);
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
      console.error('❌ Erro ao buscar mensagens:', error);
    }
  };

  // Configurar real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configurando real-time subscriptions');

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
          console.log('🔔 Nova sessão criada');
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
          console.log('🔔 Sessão atualizada');
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
          console.log('🔔 Nova mensagem recebida:', payload.new);
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
      console.log('🧹 Removendo real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado, carregando dados iniciais');
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
    fetchChatSessions,
    messageQueue: 0 // Simplificado - sem queue por enquanto
  };
};

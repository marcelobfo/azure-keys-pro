
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
  tags?: string[];
  notes?: string;
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
  const [activeChannels, setActiveChannels] = useState<Set<string>>(new Set());

  // Função para criar canal único baseado em timestamp
  const createUniqueChannelName = (prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  };

  // Criar nova sessão de chat
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }) => {
    try {
      console.log('Criando nova sessão de chat...', leadData);
      
      // Primeiro criar o lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          message: leadData.message,
          status: 'new'
        })
        .select()
        .single();

      if (leadError) {
        console.error('Erro ao criar lead:', leadError);
        throw leadError;
      }

      console.log('Lead criado:', lead);

      // Depois criar a sessão de chat
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          lead_id: lead.id,
          subject: leadData.subject,
          status: 'waiting'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Erro ao criar sessão:', sessionError);
        throw sessionError;
      }

      console.log('Sessão criada:', session);

      // Enviar mensagem inicial se houver
      if (leadData.message) {
        await sendMessage(session.id, leadData.message, 'lead');
      }

      toast({
        title: 'Chat iniciado!',
        description: 'Aguarde um momento que um de nossos atendentes irá te ajudar.',
      });

      return session;
    } catch (error) {
      console.error('Erro ao criar sessão de chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o chat. Tente novamente.',
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
        .upsert({
          user_id: user?.id,
          is_online: true,
          current_chats: availability ? availability.current_chats + 1 : 1,
          last_seen: new Date().toISOString()
        });

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
  const endChatSession = async (sessionId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          notes: notes
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

  // Adicionar tags à sessão
  const addTagsToSession = async (sessionId: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ tags })
        .eq('id', sessionId);

      if (error) throw error;

      // Atualizar estado local
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, tags }
            : session
        )
      );

      toast({
        title: 'Tags adicionadas',
        description: 'Tags foram adicionadas à sessão com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar as tags.',
        variant: 'destructive',
      });
    }
  };

  // Enviar mensagem
  const sendMessage = async (
    sessionId: string, 
    message: string, 
    senderType: 'lead' | 'attendant' | 'bot' = 'attendant'
  ) => {
    try {
      console.log('Enviando mensagem:', { sessionId, message, senderType });
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: senderType,
          sender_id: senderType === 'attendant' ? user?.id : null,
          message,
          read_status: false
        });

      if (error) {
        console.error('Erro ao inserir mensagem no banco:', error);
        throw error;
      }

      console.log('Mensagem inserida no banco com sucesso');
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
        .order('started_at', { ascending: false });

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

  // Buscar disponibilidade de atendentes
  const fetchAttendantAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('attendant_availability')
        .select('*')
        .eq('is_online', true);

      if (error) throw error;
      
      const onlineAttendants = data?.length || 0;
      return onlineAttendants > 0;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return false;
    }
  };

  // Buscar mensagens de uma sessão
  const fetchMessages = async (sessionId: string) => {
    try {
      console.log('Buscando mensagens para sessão:', sessionId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }
      
      console.log('Mensagens encontradas:', data);
      
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

  // Configurar real-time subscriptions com canais únicos
  useEffect(() => {
    if (!user) return;

    const sessionChannelName = createUniqueChannelName('chat-sessions');
    const messagesChannelName = createUniqueChannelName('chat-messages');
    
    console.log('Configurando canais de real-time:', { sessionChannelName, messagesChannelName });

    // Canal para sessões
    const sessionChannel = supabase
      .channel(sessionChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions'
        },
        (payload) => {
          console.log('Nova sessão criada:', payload);
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
        (payload) => {
          console.log('Sessão atualizada:', payload);
          fetchChatSessions();
        }
      )
      .subscribe();

    // Canal para mensagens
    const messagesChannel = supabase
      .channel(messagesChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
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

    // Adicionar aos canais ativos
    setActiveChannels(prev => new Set([...prev, sessionChannelName, messagesChannelName]));

    return () => {
      console.log('Removendo canais de real-time');
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(messagesChannel);
      setActiveChannels(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionChannelName);
        newSet.delete(messagesChannelName);
        return newSet;
      });
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchChatSessions();
    setLoading(false);
  }, []);

  return {
    sessions,
    messages,
    availability,
    loading,
    createChatSession,
    acceptChatSession,
    endChatSession,
    addTagsToSession,
    sendMessage,
    markMessagesAsRead,
    updateAvailability,
    fetchMessages,
    fetchChatSessions,
    fetchAttendantAvailability
  };
};

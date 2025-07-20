import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useChatSounds } from '@/hooks/useChatSounds';

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
  ticket_id?: string;
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

const SESSION_STORAGE_KEY = 'current_chat_session';

export const useLiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound, playMessageSound } = useChatSounds();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [availability, setAvailability] = useState<AttendantAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const isInitialized = useRef(false);

  // Salvar sessão no localStorage
  const saveSessionToStorage = (sessionId: string, sessionData: any) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        sessionId,
        sessionData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  };

  // Recuperar sessão do localStorage
  const getSavedSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar se a sessão foi salva nas últimas 24 horas
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        }
        // Remover sessão expirada
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
    }
    return null;
  };

  // Limpar sessão salva
  const clearSavedSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // Cleanup de canais
  const cleanupChannels = () => {
    channelsRef.current.forEach((channel, channelName) => {
      console.log('Removendo canal:', channelName);
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
  };

  // Criar canal único
  const createUniqueChannel = (prefix: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  };

  // Criar nova sessão de chat usando Edge Function
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }) => {
    try {
      console.log('Criando nova sessão de chat via Edge Function...', leadData);
      
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'create_chat_session',
          data: {
            leadData: leadData
          }
        }
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error('Falha ao criar sessão de chat');
      }

      console.log('Sessão criada via Edge Function:', data.session);

      toast({
        title: 'Chat iniciado!',
        description: `Seu protocolo é: ${data.session.ticket_protocol}`,
      });

      return data.session;
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
        .upsert(
          {
            user_id: user?.id,
            is_online: true,
            current_chats: availability ? availability.current_chats + 1 : 1,
            last_seen: new Date().toISOString(),
            max_concurrent_chats: availability?.max_concurrent_chats || 3
          },
          {
            onConflict: 'user_id'
          }
        );

      // Tocar som de notificação
      playNotificationSound();

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
          .upsert(
            {
              user_id: user?.id,
              current_chats: availability.current_chats - 1,
              last_seen: new Date().toISOString(),
              is_online: availability.is_online,
              max_concurrent_chats: availability.max_concurrent_chats
            },
            {
              onConflict: 'user_id'
            }
          );
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

  // Enviar mensagem usando Edge Function
  const sendMessage = async (
    sessionId: string, 
    message: string, 
    senderType: 'lead' | 'attendant' | 'bot' = 'attendant'
  ) => {
    try {
      console.log('Enviando mensagem via Edge Function:', { sessionId, message, senderType });
      
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'send_message',
          data: {
            sessionId: sessionId,
            message: message,
            senderType: senderType,
            senderId: senderType === 'attendant' ? user?.id : null
          }
        }
      });

      if (error) {
        console.error('Erro na Edge Function ao enviar mensagem:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error('Falha ao enviar mensagem');
      }

      // Tocar som de mensagem enviada
      playMessageSound();

      console.log('Mensagem enviada via Edge Function com sucesso');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
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
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Atualizar disponibilidade do atendente
  const updateAvailability = async (isOnline: boolean) => {
    try {
      const { error } = await supabase
        .from('attendant_availability')
        .upsert(
          {
            user_id: user?.id,
            is_online: isOnline,
            last_seen: new Date().toISOString(),
            max_concurrent_chats: availability?.max_concurrent_chats || 3,
            current_chats: isOnline ? (availability?.current_chats || 0) : 0
          },
          {
            onConflict: 'user_id'
          }
        );

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

  // Configurar real-time subscriptions
  useEffect(() => {
    if (!user || isInitialized.current) return;

    console.log('Configurando sistema de real-time para usuário:', user.id);
    isInitialized.current = true;

    // Cleanup de canais existentes
    cleanupChannels();

    // Canal para sessões de chat
    const sessionChannelName = createUniqueChannel('chat-sessions');
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
          playNotificationSound();
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
      .subscribe((status) => {
        console.log('Status do canal de sessões:', status);
      });

    // Canal para mensagens
    const messagesChannelName = createUniqueChannel('chat-messages');
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
          
          // Tocar som apenas se não for mensagem própria
          if (payload.new.sender_id !== user?.id) {
            playMessageSound();
          }
          
          setMessages(prev => ({
            ...prev,
            [newMessage.session_id]: [
              ...(prev[newMessage.session_id] || []),
              newMessage
            ]
          }));
        }
      )
      .subscribe((status) => {
        console.log('Status do canal de mensagens:', status);
      });

    // Armazenar referências dos canais
    channelsRef.current.set(sessionChannelName, sessionChannel);
    channelsRef.current.set(messagesChannelName, messagesChannel);

    return () => {
      console.log('Limpando canais de real-time');
      isInitialized.current = false;
      cleanupChannels();
    };
  }, [user?.id]);

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
    addTagsToSession,
    sendMessage,
    markMessagesAsRead,
    updateAvailability,
    fetchMessages,
    fetchChatSessions,
    fetchAttendantAvailability,
    saveSessionToStorage,
    getSavedSession,
    clearSavedSession
  };
};

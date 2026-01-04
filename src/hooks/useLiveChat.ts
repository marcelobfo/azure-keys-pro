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
  protocol?: string;
  lead?: {
    name: string;
    email: string;
    phone?: string;
  };
  support_tickets?: {
    protocol_number: string;
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
const CHAT_ENABLED_KEY = 'chat_system_enabled';

export const useLiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound, playMessageSound } = useChatSounds();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [availability, setAvailability] = useState<AttendantAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  const [chatEnabled, setChatEnabled] = useState(false);
  const isInitialized = useRef(false);

  // Verificar se o chat está habilitado
  useEffect(() => {
    const enabled = localStorage.getItem(CHAT_ENABLED_KEY) === 'true';
    setChatEnabled(enabled);
    console.log('Status do chat carregado:', enabled);
  }, []);

  // Toggle do sistema de chat
  const toggleChatSystem = (enabled: boolean) => {
    setChatEnabled(enabled);
    localStorage.setItem(CHAT_ENABLED_KEY, enabled.toString());
    console.log('Sistema de chat:', enabled ? 'ativado' : 'desativado');
    
    if (!enabled) {
      cleanupChannels();
    } else if (user) {
      setupRealtimeChannels();
    }
    
    toast({
      title: enabled ? 'Chat ativado' : 'Chat desativado',
      description: enabled 
        ? 'Sistema de chat está agora disponível' 
        : 'Sistema de chat foi desativado',
    });
  };

  // Salvar sessão no localStorage
  const saveSessionToStorage = (sessionId: string, sessionData: any) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        sessionId,
        sessionData,
        timestamp: Date.now()
      }));
      console.log('Sessão salva no localStorage:', sessionId);
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
          console.log('Sessão recuperada:', parsed.sessionId);
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
    console.log('Sessão limpa do localStorage');
  };

  // Cleanup de canais
  const cleanupChannels = () => {
    console.log('Limpando canais de real-time');
    if (realtimeChannel) {
      console.log('Removendo canal de sessões');
      try {
        supabase.removeChannel(realtimeChannel);
      } catch (error) {
        console.error('Erro ao remover canal de sessões:', error);
      }
      setRealtimeChannel(null);
    }
    if (messagesChannel) {
      console.log('Removendo canal de mensagens');
      try {
        supabase.removeChannel(messagesChannel);
      } catch (error) {
        console.error('Erro ao remover canal de mensagens:', error);
      }
      setMessagesChannel(null);
    }
  };

  // Configurar canais de real-time
  const setupRealtimeChannels = () => {
    if (!user) return;

    console.log('Configurando canais real-time para usuário:', user.id);
    cleanupChannels();

    // Canal para sessões de chat - usar nome único
    const sessionChannelName = `global-chat-sessions-${user.id}-${Date.now()}`;
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
          console.log('Nova sessão criada (real-time):', payload);
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
          console.log('Sessão atualizada (real-time):', payload);
          fetchChatSessions();
        }
      )
      .subscribe((status) => {
        console.log('Status do canal de sessões:', status);
      });

    setRealtimeChannel(sessionChannel);

    // Canal para mensagens - usar nome único
    const msgChannelName = `global-chat-messages-${user.id}-${Date.now()}`;
    const msgChannel = supabase
      .channel(msgChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('Nova mensagem recebida (real-time):', payload);
          const newMessage = {
            ...payload.new,
            sender_type: payload.new.sender_type as 'lead' | 'attendant' | 'bot'
          } as ChatMessage;
          
          // Verificar se é mensagem própria para evitar duplicação
          const isOwnMessage = 
            (newMessage.sender_type === 'attendant' && newMessage.sender_id === user?.id) ||
            (newMessage.sender_type === 'lead' && !newMessage.sender_id);
          
          if (!isOwnMessage) {
            console.log('Tocando som para nova mensagem de outro usuário');
            playMessageSound();
          }
          
          // Atualizar mensagens no estado
          setMessages(prev => {
            const currentMessages = prev[newMessage.session_id] || [];
            // Evitar duplicatas
            if (currentMessages.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return {
              ...prev,
              [newMessage.session_id]: [
                ...currentMessages,
                newMessage
              ]
            };
          });
        }
      )
      .subscribe((status) => {
        console.log('Status do canal de mensagens:', status);
      });

    setMessagesChannel(msgChannel);
  };

  // Criar nova sessão de chat usando Edge Function
  const createChatSession = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    subject?: string;
  }, tenantId?: string) => {
    try {
      console.log('Criando nova sessão de chat via Edge Function...', leadData, 'tenant_id:', tenantId);
      
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'create_chat_session',
          data: {
            leadData: leadData,
            tenant_id: tenantId
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
      console.log('Aceitando sessão de chat:', sessionId);
      
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

      playNotificationSound();

      toast({
        title: 'Chat aceito!',
        description: 'Você agora está atendendo este cliente.',
      });

      console.log('Chat aceito com sucesso:', sessionId);
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar o chat.',
        variant: 'destructive',
      });
    }
  };

  // Finalizar sessão de chat com status
  const endChatSession = async (sessionId: string, notes?: string, status: 'ended' | 'abandoned' = 'ended') => {
    try {
      console.log('Finalizando sessão de chat:', sessionId, 'Status:', status);
      
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: status,
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

      toast({
        title: status === 'ended' ? 'Chat finalizado com sucesso' : 'Chat abandonado',
        description: status === 'ended' ? 'O atendimento foi concluído.' : 'O chat foi marcado como abandonado.',
      });

      console.log('Chat finalizado com sucesso:', sessionId);
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o chat.',
        variant: 'destructive',
      });
    }
  };

  // Enviar mensagem usando Edge Function
  const sendMessage = async (
    sessionId: string, 
    message: string, 
    senderType: 'lead' | 'attendant' | 'bot' = 'attendant',
    tenantId?: string
  ) => {
    try {
      console.log('Enviando mensagem via Edge Function:', { sessionId, message, senderType, userId: user?.id, tenantId });
      
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'send_message',
          data: {
            sessionId: sessionId,
            message: message,
            senderType: senderType,
            senderId: senderType === 'attendant' ? user?.id : null,
            tenant_id: tenantId
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
      console.log('Atualizando disponibilidade:', isOnline);
      
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
      console.log('Disponibilidade atualizada com sucesso');
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
          leads!lead_id (name, email, phone)
        `)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      const formattedSessions = data?.map(session => ({
        ...session,
        status: session.status as 'waiting' | 'active' | 'ended' | 'abandoned',
        lead: session.leads
      })) || [];
      
      setSessions(formattedSessions);
      console.log('Sessões carregadas:', formattedSessions.length);
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
      
      console.log('Mensagens encontradas:', data?.length);
      
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

  // Configurar real-time quando usuário é carregado
  useEffect(() => {
    if (!user || isInitialized.current) return;

    console.log('Configurando sistema de real-time para usuário:', user.id);
    isInitialized.current = true;
    setupRealtimeChannels();

    return () => {
      console.log('Limpando canais de real-time');
      isInitialized.current = false;
      cleanupChannels();
    };
  }, [user?.id]);

  // Buscar disponibilidade do atendente atual
  useEffect(() => {
    if (user) {
      const fetchMyAvailability = async () => {
        try {
          const { data, error } = await supabase
            .from('attendant_availability')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          setAvailability(data);
        } catch (error) {
          console.error('Erro ao buscar minha disponibilidade:', error);
        }
      };

      fetchMyAvailability();
    }
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
    chatEnabled,
    createChatSession,
    acceptChatSession,
    endChatSession,
    sendMessage,
    markMessagesAsRead,
    updateAvailability,
    fetchMessages,
    fetchChatSessions,
    fetchAttendantAvailability,
    saveSessionToStorage,
    getSavedSession,
    clearSavedSession,
    toggleChatSystem
  };
};

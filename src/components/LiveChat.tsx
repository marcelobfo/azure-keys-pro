import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatSounds } from '@/hooks/useChatSounds';
import { useLiveChat } from '@/hooks/useLiveChat';
import TypingIndicator from '@/components/TypingIndicator';
import { MessageCircle, X, Send, Phone, Mail, User, Clock, CheckCircle2, Volume2, VolumeX, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const LiveChat = () => {
  const { toast } = useToast();
  const { playNotificationSound } = useChatSounds();
  const { 
    createChatSession, 
    sendMessage, 
    fetchMessages,
    getSavedSession,
    clearSavedSession,
    saveSessionToStorage
  } = useLiveChat();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'contact' | 'chat'>('contact');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    sender_type: 'lead' | 'attendant' | 'bot';
    timestamp: string;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBusinessTime, setIsBusinessTime] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [protocolNumber, setProtocolNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRecoveryOption, setShowRecoveryOption] = useState(false);
  const [chatSystemEnabled, setChatSystemEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const configChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(sessionId, 'lead-user');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const subjects = [
    { value: 'compra', label: 'Quero comprar um imóvel' },
    { value: 'venda', label: 'Quero vender meu imóvel' },
    { value: 'aluguel', label: 'Quero alugar um imóvel' },
    { value: 'avaliacao', label: 'Quero avaliar meu imóvel' },
    { value: 'financiamento', label: 'Informações sobre financiamento' },
    { value: 'documentacao', label: 'Dúvidas sobre documentação' },
    { value: 'outros', label: 'Outros assuntos' }
  ];

  // Verificar status do sistema de chat e configurar real-time
  useEffect(() => {
    checkChatSystemStatus();
    setupConfigRealtime();

    return () => {
      if (configChannelRef.current) {
        console.log('🧹 LiveChat: Removendo canal de configurações');
        supabase.removeChannel(configChannelRef.current);
        configChannelRef.current = null;
      }
    };
  }, []);

  // Verificar se há sessão salva ao abrir
  useEffect(() => {
    if (isOpen && step === 'contact') {
      const savedSession = getSavedSession();
      if (savedSession) {
        setShowRecoveryOption(true);
      }
    }
  }, [isOpen]);

  const setupConfigRealtime = () => {
    // Limpar canal existente antes de criar novo
    if (configChannelRef.current) {
      console.log('🧹 LiveChat: Removendo canal de configurações existente');
      supabase.removeChannel(configChannelRef.current);
      configChannelRef.current = null;
    }

    console.log('🔄 LiveChat: Configurando canal real-time para configurações do chat');
    
    // Usar nome único para evitar conflitos
    const channelName = `chat-config-changes-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_configurations'
        },
        (payload) => {
          console.log('🔄 LiveChat: Configuração do chat alterada:', payload);
          checkChatSystemStatus();
        }
      )
      .subscribe((status) => {
        console.log('📡 LiveChat: Status do canal de configurações:', status);
      });

    configChannelRef.current = channel;
  };

  const checkChatSystemStatus = async () => {
    try {
      console.log('🔍 LiveChat: Verificando status do sistema de chat...');
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('active')
        .maybeSingle();
      
      if (error) {
        console.error('❌ LiveChat: Erro ao verificar status do chat:', error);
        return;
      }

      console.log('📊 LiveChat: Dados brutos do banco:', data);
      
      const isActive = data?.active ?? false;
      console.log('🎯 LiveChat: Status do sistema de chat:', isActive ? '✅ ATIVO' : '🚫 INATIVO');
      console.log('🔄 LiveChat: Atualizando estado chatSystemEnabled de', chatSystemEnabled, 'para', isActive);
      
      if (chatSystemEnabled !== isActive) {
        setChatSystemEnabled(isActive);
        
        if (!isActive && isOpen) {
          console.log('🚫 LiveChat: Chat desativado, fechando interface');
          setIsOpen(false);
          resetChat();
        }
      }
    } catch (error) {
      console.error('❌ LiveChat: Erro ao verificar status do sistema de chat:', error);
    }
  };

  const restoreSession = async () => {
    const savedSession = getSavedSession();
    if (savedSession) {
      console.log('♻️ LiveChat: Restaurando sessão:', savedSession.sessionId);
      
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', savedSession.sessionId)
        .eq('status', 'active')
        .single();

      if (error || !sessionData) {
        console.log('⚠️ LiveChat: Sessão não encontrada ou inativa, limpando localStorage');
        clearSavedSession();
        setShowRecoveryOption(false);
        toast({
          title: 'Sessão expirada',
          description: 'A sessão anterior não está mais disponível.',
          variant: 'destructive',
        });
        return;
      }

      setSessionId(savedSession.sessionId);
      setProtocolNumber(savedSession.sessionData.ticket_protocol || 'N/A');
      setStep('chat');
      setShowRecoveryOption(false);
      await loadMessages(savedSession.sessionId);
      setupRealtime(savedSession.sessionId);
      
      toast({
        title: 'Chat restaurado!',
        description: 'Você pode continuar sua conversa anterior.',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkBusinessHours();
  }, []);

  const setupRealtime = (sessionId: string) => {
    if (realtimeChannel) {
      console.log('🧹 LiveChat: Removendo canal de mensagens existente');
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }

    console.log('📡 LiveChat: Configurando real-time para sessão:', sessionId);
    setConnectionStatus('connecting');
    
    // Usar nome único para evitar conflitos
    const channelName = `visitor-session-${sessionId}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('💬 LiveChat: Nova mensagem recebida via real-time:', payload);
          const newMsg = {
            id: payload.new.id,
            message: payload.new.message,
            sender_type: payload.new.sender_type,
            timestamp: payload.new.timestamp
          };
          
          if (payload.new.sender_type !== 'lead' || payload.new.sender_id !== null) {
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMsg.id)) {
                return prev;
              }
              return [...prev, newMsg];
            });

            if (soundEnabled && payload.new.sender_type === 'attendant') {
              playNotificationSound();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 LiveChat: Status da conexão real-time:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    setRealtimeChannel(channel);
  };

  const checkBusinessHours = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: { action: 'check_business_hours' }
      });

      if (error) {
        console.error('❌ LiveChat: Erro ao verificar horário comercial:', error);
        return;
      }

      setIsBusinessTime(data?.isBusinessHours || false);
    } catch (error) {
      console.error('❌ LiveChat: Erro ao verificar horário comercial:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome e email.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 LiveChat: Iniciando nova sessão de chat...', formData);
      
      const session = await createChatSession(formData);
      
      console.log('✅ LiveChat: Sessão criada com sucesso:', session);
      setSessionId(session.id);
      setProtocolNumber(session.ticket_protocol);
      setStep('chat');
      
      saveSessionToStorage(session.id, session);
      
      await loadMessages(session.id);
      
      setupRealtime(session.id);
      setShowRecoveryOption(false);

    } catch (error) {
      console.error('❌ LiveChat: Erro ao iniciar chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      await fetchMessages(sessionId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ LiveChat: Erro ao buscar mensagens:', error);
        return;
      }

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender_type: msg.sender_type as 'lead' | 'attendant' | 'bot',
        timestamp: msg.timestamp
      })) || [];

      setMessages(formattedMessages);
      console.log('✅ LiveChat: Mensagens carregadas:', formattedMessages.length);
    } catch (error) {
      console.error('❌ LiveChat: Erro ao carregar mensagens:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !sessionId) return;

    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: newMessage,
      sender_type: 'lead' as const,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    
    try {
      await sendMessage(sessionId, messageToSend, 'lead');
      console.log('✅ LiveChat: Mensagem de visitante enviada com sucesso');

      setMessages(prev => 
        prev.filter(msg => msg.id !== tempMessage.id)
      );

    } catch (error) {
      console.error('❌ LiveChat: Erro ao enviar mensagem:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageToSend);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const resetChat = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    setStep('contact');
    setSessionId(null);
    setMessages([]);
    setProtocolNumber('');
    setConnectionStatus('disconnected');
    setShowRecoveryOption(false);
    clearSavedSession();
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  console.log('🔍 LiveChat render - chatSystemEnabled:', chatSystemEnabled);
  
  if (!chatSystemEnabled) {
    console.log('🚫 LiveChat: Sistema de chat DESATIVADO, não renderizando componente');
    return null;
  }

  console.log('✅ LiveChat: Sistema de chat ATIVO, renderizando LiveChat');

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative"
        >
          <MessageCircle className="h-6 w-6" />
          {isBusinessTime && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl border-0 overflow-hidden bg-card">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Chat Atendimento</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    connectionStatus === 'connected' ? "bg-green-400" :
                    connectionStatus === 'connecting' ? "bg-yellow-400" :
                    isBusinessTime ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="flex items-center gap-1">
                    {connectionStatus === 'connected' ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        Conectado
                      </>
                    ) : connectionStatus === 'connecting' ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" />
                        {isBusinessTime ? 'Horário Comercial' : 'Fora do Horário'}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {step === 'contact' ? (
            <div className="p-4 space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-foreground">Como podemos ajudar?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha seus dados para iniciar o atendimento
                </p>
              </div>

              {showRecoveryOption && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Chat anterior encontrado</span>
                    </div>
                    <Button size="sm" onClick={restoreSession}>
                      Continuar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode continuar sua conversa anterior
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu nome *"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Seu email *"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu WhatsApp (opcional)"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.value} value={subject.value}>
                        {subject.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Como podemos ajudar você? (opcional)"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  disabled={loading}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Iniciando conversa...' : 'Iniciar Conversa'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col h-96">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {subjects.find(s => s.value === formData.subject)?.label || 'Chat'}
                    </Badge>
                    {protocolNumber && (
                      <Badge variant="outline" className="text-xs">
                        #{protocolNumber}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetChat}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender_type === 'lead' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender_type !== 'lead' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.sender_type === 'bot' ? '🤖' : 'AT'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.sender_type === 'lead'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p>{message.message}</p>
                        <div className={cn(
                          "text-xs mt-1 flex items-center gap-1",
                          message.sender_type === 'lead' 
                            ? "text-primary-foreground/70 justify-end" 
                            : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.sender_type === 'lead' && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <TypingIndicator 
                    isVisible={typingUsers.length > 0} 
                    userName="Atendente"
                  />
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="flex-1"
                    disabled={connectionStatus === 'connecting'}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newMessage.trim() || connectionStatus === 'connecting'}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveChat;


import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTicketsSimple } from '@/hooks/useTicketsSimple';
import { MessageCircle, X, Send, Phone, Mail, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const LiveChat = () => {
  const { toast } = useToast();
  const { createTicket } = useTicketsSimple();
  
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkBusinessHours();
  }, []);

  // Conectar ao sistema de real-time para receber mensagens
  useEffect(() => {
    if (sessionId && !realtimeChannel) {
      console.log('Conectando ao canal de real-time para sessão:', sessionId);
      setConnectionStatus('connecting');
      
      const channelName = `session-${sessionId}-${Date.now()}`;
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
            console.log('Nova mensagem recebida via real-time:', payload);
            const newMessage = {
              id: payload.new.id,
              message: payload.new.message,
              sender_type: payload.new.sender_type,
              timestamp: payload.new.timestamp
            };
            
            // Só adiciona se não for uma mensagem que o próprio usuário enviou
            if (payload.new.sender_type !== 'lead') {
              setMessages(prev => {
                // Evitar duplicação
                if (prev.some(msg => msg.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Status da conexão real-time:', status);
          setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
        });

      setRealtimeChannel(channel);

      return () => {
        console.log('Desconectando canal de real-time');
        if (channel) {
          supabase.removeChannel(channel);
        }
        setConnectionStatus('disconnected');
      };
    }
  }, [sessionId, realtimeChannel]);

  const checkBusinessHours = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: { action: 'check_business_hours' }
      });

      if (error) {
        console.error('Erro ao verificar horário comercial:', error);
        return;
      }

      setIsBusinessTime(data?.isBusinessHours || false);
    } catch (error) {
      console.error('Erro ao verificar horário comercial:', error);
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
      console.log('Iniciando nova sessão de chat...', formData);
      
      // Usar a edge function para criar a sessão
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'create_chat_session',
          data: {
            leadData: formData
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error('Falha ao criar sessão de chat');
      }

      console.log('Sessão criada com sucesso:', data.session);
      setSessionId(data.session.id);
      setProtocolNumber(data.session.ticket_protocol);
      setStep('chat');
      
      // Buscar mensagens iniciais
      await fetchMessages(data.session.id);

      toast({
        title: 'Chat iniciado!',
        description: `Seu protocolo é: ${data.session.ticket_protocol}`,
      });

    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o chat. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender_type: msg.sender_type as 'lead' | 'attendant' | 'bot',
        timestamp: msg.timestamp
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !sessionId) return;

    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: newMessage,
      sender_type: 'lead' as const,
      timestamp: new Date().toISOString()
    };

    // Adicionar mensagem otimisticamente
    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-processor', {
        body: {
          action: 'send_message',
          data: {
            sessionId: sessionId,
            message: messageToSend,
            senderType: 'lead'
          }
        }
      });

      if (error) {
        throw error;
      }

      // Atualizar mensagem temp com dados reais
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: data.message.id }
            : msg
        )
      );

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remover mensagem em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageToSend); // Restaurar texto
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
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
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
                  {connectionStatus === 'connected' ? 'Conectado' :
                   connectionStatus === 'connecting' ? 'Conectando...' :
                   isBusinessTime ? 'Horário Comercial' : 'Fora do Horário'}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
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
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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

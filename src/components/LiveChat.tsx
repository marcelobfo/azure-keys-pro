
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, X, Send, Phone, Mail, User, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatConfiguration } from '@/hooks/useChatConfiguration';
import { useChatBusinessHours } from '@/hooks/useChatBusinessHours';
import { supabase } from '@/integrations/supabase/client';

const LiveChat = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { createChatSession, sendMessage, messageQueue } = useLiveChat();
  const { configuration } = useChatConfiguration();
  const { isWithinBusinessHours, getBusinessHoursMessage } = useChatBusinessHours();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'contact' | 'chat'>('contact');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    sender_type: 'lead' | 'attendant' | 'bot';
    timestamp: string;
    status?: 'sending' | 'sent' | 'error';
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAttendantOnline, setIsAttendantOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Verificar se há atendentes online
  useEffect(() => {
    const checkAttendantAvailability = async () => {
      try {
        const { data } = await supabase
          .from('attendant_availability')
          .select('*')
          .eq('is_online', true)
          .limit(1);
        
        setIsAttendantOnline(data && data.length > 0);
      } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        setIsAttendantOnline(false);
      }
    };

    checkAttendantAvailability();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkAttendantAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar mensagens em tempo real para a sessão atual
  useEffect(() => {
    if (!sessionId || sessionId.startsWith('fallback-')) return;

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = {
            id: payload.new.id,
            message: payload.new.message,
            sender_type: payload.new.sender_type as 'lead' | 'attendant' | 'bot',
            timestamp: payload.new.timestamp,
            status: 'sent'
          };
          
          // Só adicionar se não for uma mensagem duplicada e não for do lead atual
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (!messageExists && newMessage.sender_type !== 'lead') {
              return [...prev, newMessage];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

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

    setSessionError(null);
    setSendingMessage(true);

    try {
      console.log('🚀 Iniciando criação de sessão...');
      
      const session = await createChatSession({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: formData.subject
      });

      if (session?.id) {
        console.log('✅ Sessão criada com ID:', session.id);
        setSessionId(session.id);
        setStep('chat');
        
        // Adicionar mensagem de boas-vindas
        const welcomeMessage = {
          id: 'welcome',
          message: configuration?.welcome_message || `Olá ${formData.name}! ${getBusinessHoursMessage()}`,
          sender_type: 'bot' as const,
          timestamp: new Date().toISOString(),
          status: 'sent' as const
        };
        
        setMessages([welcomeMessage]);
        
        // Adicionar mensagem inicial do usuário se houver
        if (formData.message) {
          const userMessage = {
            id: 'initial',
            message: formData.message,
            sender_type: 'lead' as const,
            timestamp: new Date().toISOString(),
            status: 'sent' as const
          };
          setMessages(prev => [...prev, userMessage]);
        }
        
      } else {
        throw new Error('Sessão criada mas sem ID válido');
      }
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error);
      setSessionError('Não foi possível iniciar o chat. Tente novamente.');
      
      toast({
        title: 'Erro ao iniciar chat',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    if (!sessionId) {
      toast({
        title: 'Erro',
        description: 'Sessão de chat não encontrada. Reinicie o chat.',
        variant: 'destructive',
      });
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Adicionar mensagem temporária com status "sending"
    const tempMessage = {
      id: tempId,
      message: messageText,
      sender_type: 'lead' as const,
      timestamp: new Date().toISOString(),
      status: 'sending' as const
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSendingMessage(true);
    
    try {
      await sendMessage(sessionId, messageText, 'lead');
      
      // Atualizar status da mensagem para "sent"
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'sent' as const }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Atualizar status da mensagem para "error"
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'error' as const }
          : msg
      ));
      
      toast({
        title: 'Erro ao enviar',
        description: 'Mensagem será reenviada automaticamente.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const resetChat = () => {
    setStep('contact');
    setSessionId(null);
    setMessages([]);
    setSessionError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  // Não mostrar chat se não estiver configurado como ativo
  if (!configuration?.active) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative"
          title={isWithinBusinessHours ? 'Chat disponível' : 'Fora do horário - Deixe sua mensagem'}
        >
          <MessageCircle className="h-6 w-6" />
          {!isWithinBusinessHours && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
          )}
          {messageQueue > 0 && (
            <div className="absolute -top-2 -right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{messageQueue}</span>
            </div>
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
                    (isAttendantOnline || isWithinBusinessHours) ? "bg-green-400" : "bg-yellow-400"
                  )} />
                  {isAttendantOnline 
                    ? 'Atendente Online' 
                    : isWithinBusinessHours 
                      ? 'Horário de Atendimento' 
                      : 'Fora do horário'
                  }
                  {messageQueue > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {messageQueue} na fila
                    </Badge>
                  )}
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

              {sessionError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{sessionError}</span>
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
                      disabled={sendingMessage}
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
                      disabled={sendingMessage}
                    />
                  </div>
                  
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu WhatsApp (opcional)"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                      disabled={sendingMessage}
                    />
                  </div>
                </div>

                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                  disabled={sendingMessage}
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

                <Textarea
                  placeholder="Como podemos ajudar você? (opcional)"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="resize-none"
                  disabled={sendingMessage}
                />

                <Button type="submit" className="w-full" disabled={sendingMessage}>
                  {sendingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    'Iniciar Conversa'
                  )}
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
                    {isTyping && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                        Digitando...
                      </div>
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
                          <AvatarImage src={configuration?.custom_responses?.chat_avatar || "/placeholder-avatar.png"} />
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
                            <>
                              {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin" />}
                              {message.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                              {message.status === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                            </>
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
                    disabled={sendingMessage}
                  />
                  <Button type="submit" size="sm" disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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

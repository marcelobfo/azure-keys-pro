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
import { MessageCircle, X, Send, Phone, Mail, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const LiveChat = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { createChatSession, sendMessage, sessions, fetchAttendantAvailability } = useLiveChat();
  
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
  const [isAttendantOnline, setIsAttendantOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conectar ao sistema de real-time para receber mensagens
  useEffect(() => {
    if (sessionId) {
      const channel = supabase.channel(`session-${sessionId}`)
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
              sender_type: payload.new.sender_type,
              timestamp: payload.new.timestamp
            };
            
            // Só adiciona se não for uma mensagem que o próprio usuário enviou
            if (payload.new.sender_type !== 'lead') {
              setMessages(prev => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId]);
  
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

  // Verificar disponibilidade de atendentes
  useEffect(() => {
    const checkAttendantAvailability = async () => {
      try {
        const isOnline = await fetchAttendantAvailability();
        setIsAttendantOnline(isOnline);
      } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
      }
    };
    
    checkAttendantAvailability();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkAttendantAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

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

    try {
      const session = await createChatSession({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: formData.subject
      });

      setSessionId(session.id);
      setStep('chat');
      
      // Adicionar mensagem de boas-vindas
      const welcomeMessage = {
        id: 'welcome',
        message: `Olá ${formData.name}! Obrigado por entrar em contato. ${isAttendantOnline ? 'Um de nossos atendentes estará com você em breve.' : 'No momento nossos atendentes estão offline, mas responderemos assim que possível.'}`,
        sender_type: 'bot' as const,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      if (formData.message) {
        const userMessage = {
          id: 'initial',
          message: formData.message,
          sender_type: 'lead' as const,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !sessionId) return;

    const message = {
      id: Date.now().toString(),
      message: newMessage,
      sender_type: 'lead' as const,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    
    try {
      await sendMessage(sessionId, newMessage, 'lead');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
    
    setNewMessage('');
  };

  const resetChat = () => {
    setStep('contact');
    setSessionId(null);
    setMessages([]);
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
                    isAttendantOnline ? "bg-green-400" : "bg-red-400"
                  )} />
                  {isAttendantOnline ? 'Online' : 'Offline'}
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
                    />
                  </div>
                  
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu WhatsApp (opcional)"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
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
                />

                <Button type="submit" className="w-full">
                  Iniciar Conversa
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
                          <AvatarImage src="/placeholder-avatar.png" />
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
                  />
                  <Button type="submit" size="sm" disabled={!newMessage.trim()}>
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
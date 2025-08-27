import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useTickets } from '@/hooks/useTickets';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatSounds } from '@/hooks/useChatSounds';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Volume2, 
  VolumeX, 
  Users, 
  Clock, 
  CheckCircle, 
  X, 
  Plus,
  FileText,
  ExternalLink,
  Wifi,
  WifiOff,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Power,
  PowerOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { processBotMessage } from '@/utils/chatUtils';
import AttendantStatusToggle from '@/components/AttendantStatusToggle';
import ChatMonitor from '@/components/ChatMonitor';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';

const AttendantDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { createTicket, linkTicketToChat } = useTickets();
  
  const {
    sessions,
    messages,
    loading,
    fetchChatSessions,
    fetchMessages,
    acceptChatSession,
    endChatSession,
    sendMessage,
    toggleChatSystem
  } = useLiveChat();

  // Add missing properties with default values
  const connectionStatus = 'connected'; // Mock connection status
  const chatSystemEnabled = true; // Mock system status

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [activeSessionInfo, setActiveSessionInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endNotes, setEndNotes] = useState('');
  const [isCreateProtocolOpen, setIsCreateProtocolOpen] = useState(false);
  const [protocolForm, setProtocolForm] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    activeSession, 
    user?.id || null
  );

  const { playNotificationSound } = useChatSounds();

  // Fetch sessions and messages on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchChatSessions();
    }
  }, [user, fetchChatSessions]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession);
    }
  }, [activeSession, fetchMessages]);

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active' && s.attendant_id === user?.id);
  const activeSessionData = sessions.find(s => s.id === activeSession);
  const sessionForView = activeSessionData || activeSessionInfo;
  const sessionMessages = activeSession ? messages[activeSession] || [] : [];

  // Fetch session info when activeSession changes but activeSessionData is not available
  useEffect(() => {
    if (activeSession && !activeSessionData && !activeSessionInfo) {
      console.log('[AttendantDashboard] Fetching session data for:', activeSession);
      setIsLoadingSession(true);
      
      supabase
        .from('chat_sessions')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('id', activeSession)
        .maybeSingle()
        .then(({ data: sessionData, error }) => {
          console.log('[AttendantDashboard] Session data fetched:', sessionData, error);
          if (sessionData && !error) {
            setActiveSessionInfo(sessionData);
          }
          setIsLoadingSession(false);
        });
    } else if (activeSessionData) {
      // Use activeSessionData if available and clear loading
      setActiveSessionInfo(activeSessionData);
      setIsLoadingSession(false);
    }
  }, [activeSession, activeSessionData]);

  const handleCreateProtocol = async () => {
    if (!activeSessionInfo?.lead_id) return;

    try {
      const ticket = await createTicket({
        lead_id: activeSessionInfo.lead_id,
        subject: protocolForm.subject,
        description: protocolForm.description,
        priority: protocolForm.priority as any
      });

      // Link ticket to chat session
      await linkTicketToChat(ticket.id, activeSession!);

      // Update local session info to show the protocol
      setActiveSessionInfo(prev => ({
        ...prev,
        ticket_id: ticket.id,
        support_tickets: { protocol_number: ticket.protocol_number }
      }));

      setIsCreateProtocolOpen(false);
      setProtocolForm({ subject: '', description: '', priority: 'medium' });

      toast({
        title: 'Protocolo criado!',
        description: `Protocolo ${ticket.protocol_number} vinculado ao chat`,
      });
    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
    }
  };

  const openProtocolPage = () => {
    if (activeSessionInfo?.support_tickets?.protocol_number) {
      window.open(`/admin/protocols?search=${activeSessionInfo.support_tickets.protocol_number}`, '_blank');
    }
  };

  const handleToggleChatSystem = () => {
    toggleChatSystem(!chatSystemEnabled);
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);
      setActiveSession(sessionId);
      
      // Find session locally first to display immediately
      const localSession = sessions.find(s => s.id === sessionId);
      if (localSession) {
        setActiveSessionInfo(localSession);
      }
      
      await acceptChatSession(sessionId);
      
      // Only open mobile sheet on mobile
      if (isMobile) {
        setIsMobileChatOpen(true);
      }
      
      // Force refresh to load session and messages immediately
      await Promise.all([
        fetchChatSessions(),
        fetchMessages(sessionId)
      ]);
      
      if (soundEnabled) {
        playNotificationSound();
      }
      
      toast({
        title: "Chat aceito",
        description: "Você está agora atendendo este cliente",
      });
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeSession || isSending) return;

    stopTyping();
    setIsSending(true);
    
    try {
      await sendMessage(activeSession, newMessage, 'attendant');
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndSession = (sessionId: string) => {
    setIsEndDialogOpen(true);
  };

  const confirmEndSession = async (status: 'ended' | 'abandoned' = 'ended') => {
    if (!activeSession) return;

    try {
      await endChatSession(activeSession, endNotes, status);
      
      setActiveSession(null);
      setActiveSessionInfo(null);
      setIsEndDialogOpen(false);
      setEndNotes('');
      
      toast({
        title: status === 'ended' ? 'Chat finalizado' : 'Chat abandonado',
        description: status === 'ended' ? 'O atendimento foi concluído com sucesso.' : 'O chat foi marcado como abandonado.',
      });
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aguardando</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'ended':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Concluído</Badge>;
      case 'abandoned':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Abandonado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleTakeOverChat = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);
      setActiveSession(sessionId);
      
      // Find the session and update it
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setActiveSessionInfo(session);
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          attendant_id: user?.id,
          status: 'active'
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      // Only open mobile sheet on mobile
      if (isMobile) {
        setIsMobileChatOpen(true);
      }
      
      // Force refresh to load session and messages immediately
      await Promise.all([
        fetchChatSessions(),
        fetchMessages(sessionId)
      ]);
      
      toast({
        title: "Chat assumido",
        description: "Você agora está atendendo este cliente",
      });
    } catch (error) {
      console.error('Erro ao assumir chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível assumir o chat",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleOpenChat = async (sessionId: string) => {
    console.log('[AttendantDashboard] Opening chat:', sessionId);
    setActiveSession(sessionId);
    
    // Find session locally first to display immediately
    const localSession = sessions.find(s => s.id === sessionId);
    if (localSession) {
      setActiveSessionInfo(localSession);
      // Don't set loading state since we have the data
      setIsLoadingSession(false);
    } else {
      setIsLoadingSession(true);
    }
    
    // Only open mobile sheet on mobile
    if (isMobile) {
      setIsMobileChatOpen(true);
    }
    
    // Fetch messages
    try {
      await fetchMessages(sessionId);
      if (!localSession) {
        setIsLoadingSession(false);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setIsLoadingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Status e Controles */}
      <div className="lg:col-span-1 space-y-4">
        {/* Toggle do Sistema de Chat */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Sistema de Chat
              <div className="flex items-center gap-2">
                {chatSystemEnabled ? (
                  <Power className="h-4 w-4 text-green-500" />
                ) : (
                  <PowerOff className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Receber novos chats</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={chatSystemEnabled}
                  onCheckedChange={handleToggleChatSystem}
                />
                <Badge variant={chatSystemEnabled ? "default" : "secondary"} className="text-xs">
                  {chatSystemEnabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {chatSystemEnabled 
                ? 'O sistema de chat está funcionando normalmente' 
                : 'O sistema de chat está desativado. Novos chats não serão recebidos.'
              }
            </p>
          </CardContent>
        </Card>

        <AttendantStatusToggle />
        
        {/* Monitor de Chats em Tempo Real */}
        <ChatMonitor onTakeOverChat={handleTakeOverChat} onOpenChat={handleOpenChat} />
        
        {/* Controle de Som */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Configurações
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 p-0"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notificações sonoras</span>
              <Badge variant={soundEnabled ? "default" : "secondary"} className="text-xs">
                {soundEnabled ? 'Ativado' : 'Desativado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Chats Aguardando Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-yellow-500" />
              Aguardando Atendimento ({waitingSessions.length})
            </CardTitle>
          </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                   {waitingSessions.map((session) => (
                     <div key={session.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{session.lead?.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                #{session.protocol || session.id.slice(0, 8)}
                              </Badge>
                          </div>
                         <Badge variant="outline" className="text-xs">
                           {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                             hour: '2-digit',
                             minute: '2-digit'
                           })}
                         </Badge>
                       </div>
                      
                      {session.subject && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Assunto: {session.subject}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Mail className="h-3 w-3" />
                        <span>{session.lead?.email}</span>
                        {session.lead?.phone && (
                          <>
                            <Phone className="h-3 w-3 ml-2" />
                            <span>{session.lead.phone}</span>
                          </>
                        )}
                      </div>
                      
                       <Button 
                         size="sm" 
                         onClick={() => handleAcceptSession(session.id)}
                         className="w-full"
                         disabled={!chatSystemEnabled}
                       >
                         {chatSystemEnabled ? 'Aceitar Chat' : 'Chat Desativado'}
                       </Button>
                     </div>
                   ))}
                   
                   {waitingSessions.length === 0 && (
                     <div className="text-center py-8 text-muted-foreground">
                       <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                       <p>Nenhum chat em espera</p>
                     </div>
                   )}
                 </div>
               </ScrollArea>
             </CardContent>
           </Card>

        {/* Meus Chats Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Meus Chats Ativos ({activeSessions.length})
            </CardTitle>
          </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                     <div 
                       key={session.id} 
                       className={cn(
                         "p-2 border rounded cursor-pointer transition-colors",
                         activeSession === session.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                       )}
                        onClick={() => handleOpenChat(session.id)}
                     >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{session.lead?.name}</span>
                        {getStatusBadge(session.status)}
                      </div>
                       <div className="text-xs text-muted-foreground mt-1">
                         {session.protocol && <div>Protocolo: {session.protocol}</div>}
                         {session.subject && <span>Assunto: {session.subject}</span>}
                       </div>
                    </div>
                  ))}
                  
                  {activeSessions.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Nenhum chat ativo
                    </div>
                  )}
                 </div>
               </ScrollArea>
             </CardContent>
           </Card>
      </div>

      {/* Área de Chat - Desktop */}
      <div className="lg:col-span-2 hidden lg:block">
        {isLoadingSession || (activeSession && !sessionForView) ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Carregando conversa...</p>
              </div>
            </CardContent>
          </Card>
        ) : activeSession && sessionForView ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {sessionForView?.lead?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {sessionForView?.lead?.name || 'Cliente'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {sessionForView?.lead?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Protocol Section */}
                  {sessionForView?.support_tickets?.protocol_number ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {sessionForView.support_tickets.protocol_number}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openProtocolPage}
                        title="Abrir protocolo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateProtocolOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Protocolo
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEndSession(sessionForView.id)}
                    title="Encerrar conversa"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 p-4 max-h-96">
                <div className="space-y-4 min-h-full">
                  {sessionMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender_type === 'attendant' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.sender_type === 'attendant'
                            ? "bg-primary text-primary-foreground"
                            : message.sender_type === 'bot'
                            ? "bg-muted text-foreground border"
                            : "bg-muted text-foreground"
                        )}
                       >
                         <p>{message.sender_type === 'bot' ? processBotMessage(message.message) : message.message}</p>
                         <div className={cn(
                          "text-xs mt-1 flex items-center gap-1",
                          message.sender_type === 'attendant' 
                            ? "text-primary-foreground/70 justify-end" 
                            : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.sender_type === 'attendant' && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de digitação */}
                  <TypingIndicator 
                    isVisible={typingUsers.length > 0} 
                    userName="Cliente"
                  />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : !chatSystemEnabled ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <PowerOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Sistema de Chat Desativado</h3>
              <p className="text-muted-foreground mb-4">
                Ative o sistema de chat para começar a receber atendimentos
              </p>
              <Button onClick={handleToggleChatSystem}>
                <Power className="h-4 w-4 mr-2" />
                Ativar Sistema de Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum chat selecionado</h3>
              <p className="text-muted-foreground">
                Aceite um chat em espera ou selecione um chat ativo para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Chat Sheet */}
      <Sheet open={isMobileChatOpen} onOpenChange={setIsMobileChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          {activeSession && sessionForView && (
            <>
              <SheetHeader className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                     <SheetTitle className="flex items-center gap-2">
                       <User className="h-5 w-5" />
                       {sessionForView.lead?.name}
                       <Badge variant="secondary" className="ml-2">
                         #{sessionForView.protocol || sessionForView.id.slice(0, 8)}
                       </Badge>
                     </SheetTitle>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                       <div className="flex items-center gap-1">
                         <Mail className="h-4 w-4" />
                         {sessionForView.lead?.email}
                       </div>
                       {sessionForView.lead?.phone && (
                         <div className="flex items-center gap-1">
                           <Phone className="h-4 w-4" />
                           {sessionForView.lead.phone}
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     {getStatusBadge(sessionForView.status)}
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleEndSession(sessionForView.id)}
                     >
                       <CheckCircle className="h-4 w-4 mr-1" />
                       Finalizar
                     </Button>
                   </div>
                </div>
              </SheetHeader>

              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 min-h-full">
                    {sessionMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender_type === 'attendant' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.sender_type === 'attendant'
                              ? "bg-primary text-primary-foreground"
                              : message.sender_type === 'bot'
                              ? "bg-muted text-foreground border"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <p>{message.sender_type === 'bot' ? processBotMessage(message.message) : message.message}</p>
                          <div className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            message.sender_type === 'attendant' 
                              ? "text-primary-foreground/70 justify-end" 
                              : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3" />
                            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {message.sender_type === 'attendant' && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de digitação */}
                    <TypingIndicator 
                      isVisible={typingUsers.length > 0} 
                      userName="Cliente"
                    />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={handleInputChange}
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || isSending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog para finalizar chat */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Como deseja finalizar este atendimento?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notas do atendimento (opcional)</label>
              <Textarea
                placeholder="Adicione observações sobre o atendimento..."
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEndDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => confirmEndSession('abandoned')}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Abandonar Chat
              </Button>
              <Button 
                onClick={() => confirmEndSession('ended')}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Concluir Atendimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Protocol Dialog */}
      <Dialog open={isCreateProtocolOpen} onOpenChange={setIsCreateProtocolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Protocolo de Atendimento</DialogTitle>
            <DialogDescription>
              Crie um protocolo para organizar este atendimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="protocol-subject">Assunto</Label>
              <Input
                id="protocol-subject"
                placeholder="Descreva brevemente o assunto"
                value={protocolForm.subject}
                onChange={(e) => setProtocolForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="protocol-description">Descrição</Label>
              <Textarea
                id="protocol-description"
                placeholder="Forneça mais detalhes sobre o atendimento"
                value={protocolForm.description}
                onChange={(e) => setProtocolForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="protocol-priority">Prioridade</Label>
              <Select 
                value={protocolForm.priority} 
                onValueChange={(value) => setProtocolForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateProtocolOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateProtocol}>
              Criar Protocolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendantDashboard;
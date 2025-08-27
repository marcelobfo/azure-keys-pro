
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useAuth } from '@/contexts/AuthContext';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatSounds } from '@/hooks/useChatSounds';
import { supabase } from '@/integrations/supabase/client';
import TypingIndicator from '@/components/TypingIndicator';
import AttendantStatusToggle from '@/components/AttendantStatusToggle';
import ChatMonitor from '@/components/ChatMonitor';
import { processBotMessage } from '@/utils/chatUtils';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Send, 
  Phone, 
  Mail,
  CheckCircle2,
  AlertCircle,
  Users,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Power,
  PowerOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AttendantDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound } = useChatSounds();
  const {
    sessions,
    messages,
    loading,
    chatEnabled,
    acceptChatSession,
    sendMessage,
    endChatSession,
    fetchMessages,
    fetchChatSessions,
    toggleChatSystem
  } = useLiveChat();

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endNotes, setEndNotes] = useState('');
  const [sessionToEnd, setSessionToEnd] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    activeSession, 
    user?.id || null
  );

  useEffect(() => {
    if (user) {
      fetchChatSessions();
    }
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession);
    }
  }, [activeSession]);

  const handleToggleChatSystem = () => {
    toggleChatSystem(!chatEnabled);
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await acceptChatSession(sessionId);
      setActiveSession(sessionId);
      setIsMobileChatOpen(true);
      
      // Force refresh to load session and messages immediately
      await fetchChatSessions();
      await fetchMessages(sessionId);
      
      if (soundEnabled) {
        playNotificationSound();
      }
      
      toast({
        title: "Chat aceito",
        description: "Você está agora atendendo este cliente",
      });
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeSession || sendingMessage) return;

    stopTyping();
    setSendingMessage(true);
    
    try {
      await sendMessage(activeSession, newMessage, 'attendant');
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEndSession = (sessionId: string) => {
    setSessionToEnd(sessionId);
    setIsEndDialogOpen(true);
  };

  const confirmEndSession = async (status: 'ended' | 'abandoned' = 'ended') => {
    if (!sessionToEnd) return;

    try {
      await endChatSession(sessionToEnd, endNotes, status);
      
      if (activeSession === sessionToEnd) {
        setActiveSession(null);
      }
      
      setIsEndDialogOpen(false);
      setEndNotes('');
      setSessionToEnd(null);
      
      toast({
        title: status === 'ended' ? 'Chat finalizado' : 'Chat abandonado',
        description: status === 'ended' ? 'O atendimento foi concluído com sucesso.' : 'O chat foi marcado como abandonado.',
      });
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
    }
  };

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active' && s.attendant_id === user?.id);
  const activeSessionData = sessions.find(s => s.id === activeSession);
  const sessionMessages = activeSession ? messages[activeSession] || [] : [];

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleTakeOverChat = async (sessionId: string) => {
    try {
      // Find the session and update it
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          attendant_id: user?.id,
          status: 'active'
        })
        .eq('id', sessionId);

      if (error) throw error;

      setActiveSession(sessionId);
      setIsMobileChatOpen(true);
      
      // Force refresh to load session and messages immediately
      await fetchChatSessions();
      await fetchMessages(sessionId);
      
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
    }
  };

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
                {chatEnabled ? (
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
                  checked={chatEnabled}
                  onCheckedChange={handleToggleChatSystem}
                />
                <Badge variant={chatEnabled ? "default" : "secondary"} className="text-xs">
                  {chatEnabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {chatEnabled 
                ? 'O sistema de chat está funcionando normalmente' 
                : 'O sistema de chat está desativado. Novos chats não serão recebidos.'
              }
            </p>
          </CardContent>
        </Card>

        <AttendantStatusToggle />
        
        {/* Monitor de Chats em Tempo Real */}
        <ChatMonitor onTakeOverChat={handleTakeOverChat} onOpenChat={(id) => { setActiveSession(id); setIsMobileChatOpen(true); fetchMessages(id); }} />
        
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
        
        {/* Chats em Espera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Chats em Espera ({waitingSessions.length})
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
                         disabled={!chatEnabled}
                       >
                         {chatEnabled ? 'Aceitar Chat' : 'Chat Desativado'}
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
                       onClick={() => {
                         setActiveSession(session.id);
                         setIsMobileChatOpen(true);
                       }}
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
        {activeSession && activeSessionData ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="flex items-center gap-2">
                     <User className="h-5 w-5" />
                     {activeSessionData.lead?.name}
                       <Badge variant="secondary" className="ml-2">
                         Protocolo #{activeSessionData.protocol || activeSessionData.id.slice(0, 8)}
                       </Badge>
                   </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {activeSessionData.lead?.email}
                    </div>
                    {activeSessionData.lead?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {activeSessionData.lead.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activeSessionData.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEndSession(activeSessionData.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finalizar
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
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : !chatEnabled ? (
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
          {activeSession && activeSessionData && (
            <>
              <SheetHeader className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {activeSessionData.lead?.name}
                      <Badge variant="secondary" className="ml-2">
                        #{activeSessionData.protocol || activeSessionData.id.slice(0, 8)}
                      </Badge>
                    </SheetTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {activeSessionData.lead?.email}
                      </div>
                      {activeSessionData.lead?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {activeSessionData.lead.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activeSessionData.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEndSession(activeSessionData.id)}
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
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sendingMessage}
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
    </div>
  );
};

export default AttendantDashboard;

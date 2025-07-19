import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useTicketsSimple } from '@/hooks/useTicketsSimple';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Star,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AttendantDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    sessions, 
    messages, 
    acceptChatSession, 
    endChatSession, 
    sendMessage, 
    markMessagesAsRead,
    updateAvailability 
  } = useLiveChat();
  
  const { tickets, updateTicketStatus, rateTicket } = useTicketsSimple();
  
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Filtrar sessões ativas e pendentes
  const activeSessions = sessions.filter(s => s.status === 'active' && s.attendant_id === user?.id);
  const pendingSessions = sessions.filter(s => s.status === 'waiting');
  const ticketsToday = tickets.filter(t => {
    const today = new Date().toDateString();
    const ticketDate = new Date(t.created_at).toDateString();
    return today === ticketDate;
  });

  // Aceitar sessão de chat
  const handleAcceptSession = async (sessionId: string) => {
    try {
      await acceptChatSession(sessionId);
      setSelectedSession(sessionId);
      
      toast({
        title: 'Sucesso',
        description: 'Chat aceito com sucesso',
      });
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aceitar chat',
        variant: 'destructive',
      });
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedSession) return;

    try {
      await sendMessage(selectedSession, newMessage, 'attendant');
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem',
        variant: 'destructive',
      });
    }
  };

  // Finalizar sessão
  const handleEndSession = async (sessionId: string) => {
    try {
      await endChatSession(sessionId, sessionNotes);
      setSelectedSession(null);
      setSessionNotes('');
      
      toast({
        title: 'Sucesso',
        description: 'Chat finalizado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar chat',
        variant: 'destructive',
      });
    }
  };

  // Alternar disponibilidade
  const toggleAvailability = async () => {
    try {
      const newStatus = !isOnline;
      await updateAvailability(newStatus);
      setIsOnline(newStatus);
      
      toast({
        title: 'Sucesso',
        description: newStatus ? 'Você está online' : 'Você está offline',
      });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar disponibilidade',
        variant: 'destructive',
      });
    }
  };

  // Obter mensagens da sessão selecionada
  const sessionMessages = selectedSession ? (messages[selectedSession] || []) : [];
  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-2rem)]">
      {/* Sidebar - Lista de sessões e tickets */}
      <div className="lg:col-span-1 space-y-4">
        {/* Status de disponibilidade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status do Atendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button
                onClick={toggleAvailability}
                variant={isOnline ? 'destructive' : 'default'}
                size="sm"
              >
                {isOnline ? 'Ficar Offline' : 'Ficar Online'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do dia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Estatísticas Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Chats ativos:</span>
              <span className="font-medium">{activeSessions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tickets hoje:</span>
              <span className="font-medium">{ticketsToday.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Em espera:</span>
              <span className="font-medium">{pendingSessions.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sessões pendentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Chats em Espera ({pendingSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {pendingSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAcceptSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{session.lead?.name}</p>
                        <p className="text-xs text-muted-foreground">{session.subject}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Badge>
                    </div>
                  </div>
                ))}
                {pendingSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum chat em espera
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sessões ativas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Chats Ativos ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedSession === session.id 
                        ? "bg-primary/10 border-primary" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{session.lead?.name}</p>
                        <p className="text-xs text-muted-foreground">{session.subject}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum chat ativo
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat principal */}
      <div className="lg:col-span-2">
        {selectedSession ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedSessionData?.lead?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedSessionData?.lead?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedSessionData?.lead?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedSessionData?.subject || 'Chat'}
                  </Badge>
                  <Button
                    onClick={() => handleEndSession(selectedSession)}
                    variant="outline"
                    size="sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Finalizar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {sessionMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender_type === 'attendant' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender_type !== 'attendant' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.sender_type === 'bot' ? '🤖' : selectedSessionData?.lead?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.sender_type === 'attendant'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p>{message.message}</p>
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
                </div>
              </ScrollArea>

              <div className="p-4 border-t space-y-3">
                <Textarea
                  placeholder="Notas da sessão (opcional)"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um chat</h3>
              <p className="text-muted-foreground">
                Escolha um chat da lista para começar o atendimento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttendantDashboard;
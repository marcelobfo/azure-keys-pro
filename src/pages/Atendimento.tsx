import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLiveChat } from '@/hooks/useLiveChat';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Send,
  UserCheck,
  UserX,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

const Atendimento = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const {
    sessions,
    messages,
    availability,
    acceptChatSession,
    endChatSession,
    sendMessage,
    markMessagesAsRead,
    updateAvailability,
    fetchMessages
  } = useLiveChat();

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Verificar se o usuário tem permissão para acessar
  if (!user || !profile || !['admin', 'corretor'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (availability) {
      setIsOnline(availability.is_online);
    }
  }, [availability]);

  const handleToggleOnline = async (online: boolean) => {
    try {
      await updateAvailability(online);
      setIsOnline(online);
      toast({
        title: online ? 'Você está online' : 'Você está offline',
        description: online 
          ? 'Agora você pode receber novos chats' 
          : 'Você não receberá novos chats',
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await acceptChatSession(sessionId);
      setSelectedSession(sessionId);
      await fetchMessages(sessionId);
    } catch (error) {
      console.error('Erro ao aceitar chat:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await endChatSession(sessionId);
      if (selectedSession === sessionId) {
        setSelectedSession(null);
      }
      toast({
        title: 'Chat finalizado',
        description: 'O atendimento foi finalizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao finalizar chat:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedSession) return;

    try {
      await sendMessage(selectedSession, newMessage, 'attendant');
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    await fetchMessages(sessionId);
    await markMessagesAsRead(sessionId);
  };

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active' && s.attendant_id === user?.id);
  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  const sessionMessages = selectedSession ? messages[selectedSession] || [] : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aguardando</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'ended':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Finalizado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Atendimento" userRole={profile.role as "user" | "corretor" | "admin"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar - Lista de Chats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status do Atendente */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Meu Status</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isOnline ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Receber novos chats</span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleOnline}
                />
              </div>
              {availability && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Chats ativos: {availability.current_chats}/{availability.max_concurrent_chats}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chats Aguardando */}
          {waitingSessions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Aguardando Atendimento ({waitingSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {waitingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{session.lead?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(session.started_at).toLocaleString('pt-BR')}
                        </div>
                        {session.subject && (
                          <Badge variant="outline" className="text-xs">
                            {session.subject}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptSession(session.id)}
                        disabled={!isOnline}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Meus Chats Ativos */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                Meus Chats Ativos ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
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
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{session.lead?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(session.started_at).toLocaleString('pt-BR')}
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndSession(session.id);
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área de Chat */}
        <div className="lg:col-span-2">
          {selectedSessionData ? (
            <Card className="h-full flex flex-col">
              {/* Header do Chat */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedSessionData.lead?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedSessionData.lead?.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedSessionData.lead?.email}
                        </div>
                        {selectedSessionData.lead?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedSessionData.lead?.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedSessionData.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEndSession(selectedSessionData.id)}
                    >
                      Finalizar Chat
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-96 p-4">
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
                            <AvatarFallback className="bg-muted text-xs">
                              {message.sender_type === 'bot' ? '🤖' : 'CL'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2 text-sm",
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
                            {message.sender_type === 'attendant' && message.read_status && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Mensagem */}
              <div className="border-t p-4">
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
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">Selecione um chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha um chat da lista ao lado para começar o atendimento
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Atendimento;
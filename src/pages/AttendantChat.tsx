import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, Clock, User, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';

const AttendantChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    sessions, 
    messages, 
    loading, 
    acceptChatSession, 
    sendMessage, 
    fetchMessages, 
    markMessagesAsRead,
    updateAvailability
  } = useLiveChat();
  
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedSession]);

  useEffect(() => {
    if (user) {
      updateAvailability(isOnline);
    }
  }, [isOnline, user]);

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    await fetchMessages(sessionId);
    await markMessagesAsRead(sessionId);
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await acceptChatSession(sessionId);
      setSelectedSession(sessionId);
      await fetchMessages(sessionId);
      toast({
        title: 'Chat aceito',
        description: 'Você está agora atendendo este cliente.',
      });
    } catch (error) {
      console.error('Erro ao aceitar sessão:', error);
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

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active' && s.attendant_id === user?.id);
  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  const sessionMessages = selectedSession ? messages[selectedSession] || [] : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Atendimento ao Cliente
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOnline(!isOnline)}
              >
                {isOnline ? 'Ficar Offline' : 'Ficar Online'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de sessões */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-1 p-4">
                    {/* Sessões aguardando */}
                    {waitingSessions.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Aguardando Atendimento ({waitingSessions.length})
                        </h3>
                        {waitingSessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                              selectedSession === session.id && "bg-muted"
                            )}
                            onClick={() => handleSelectSession(session.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {session.lead?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {session.lead?.name || 'Usuário'}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Aguardando
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {session.subject || 'Sem assunto'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptSession(session.id);
                                }}
                                className="text-xs"
                              >
                                Aceitar
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sessões ativas */}
                    {activeSessions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Seus Atendimentos ({activeSessions.length})
                        </h3>
                        {activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                              selectedSession === session.id && "bg-muted"
                            )}
                            onClick={() => handleSelectSession(session.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {session.lead?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {session.lead?.name || 'Usuário'}
                                </span>
                              </div>
                              <Badge variant="default" className="text-xs">
                                Ativo
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {session.subject || 'Sem assunto'}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {sessions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum chat disponível</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Área de chat */}
          <div className="lg:col-span-2">
            <Card>
              {selectedSessionData ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {selectedSessionData.lead?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedSessionData.lead?.name || 'Usuário'}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {selectedSessionData.lead?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {selectedSessionData.lead.email}
                              </div>
                            )}
                            {selectedSessionData.lead?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {selectedSessionData.lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={selectedSessionData.status === 'active' ? 'default' : 'secondary'}>
                        {selectedSessionData.status === 'active' ? 'Ativo' : 'Aguardando'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col h-96">
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
                                  <AvatarFallback className="text-xs">
                                    {message.sender_type === 'bot' ? '🤖' : 
                                     selectedSessionData.lead?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-lg px-3 py-2",
                                  message.sender_type === 'attendant'
                                    ? "bg-primary text-primary-foreground ml-auto"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                <p className="text-sm">{message.message}</p>
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
                        <div ref={messagesEndRef} />
                      </ScrollArea>

                      {selectedSessionData.status === 'active' && (
                        <div className="p-4 border-t">
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
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um chat para começar</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendantChat;
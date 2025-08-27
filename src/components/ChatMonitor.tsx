
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Eye, 
  MessageSquare, 
  Users, 
  Clock,
  ArrowRight,
  User
} from 'lucide-react';

interface ChatSession {
  id: string;
  status: string;
  started_at: string;
  attendant_id?: string;
  lead: {
    name: string;
    email: string;
    phone?: string;
  };
  subject?: string;
  protocol?: string;
  lastMessage?: {
    message: string;
    timestamp: string;
    sender_type: string;
  };
}

interface ChatMonitorProps {
  onTakeOverChat: (sessionId: string) => void;
  onOpenChat?: (sessionId: string) => void;
}

const ChatMonitor: React.FC<ChatMonitorProps> = ({ onTakeOverChat, onOpenChat }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChatSessions();
      
      // Setup realtime subscription for chat session updates only
      const channelName = `chat-monitor-${user.id}-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_sessions'
          },
          () => {
            console.log('[ChatMonitor] Chat session changed, refetching...');
            fetchChatSessions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchChatSessions = async () => {
    try {
      // Buscar sessões ativas com informações do lead e última mensagem
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          status,
          started_at,
          attendant_id,
          subject,
          lead:leads (
            name,
            email,
            phone
          )
        `)
        .in('status', ['waiting', 'active'])
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return;
      }

      // Buscar última mensagem de cada sessão
      const sessionsWithMessages = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('message, timestamp, sender_type')
            .eq('session_id', session.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

          return {
            ...session,
            lastMessage: lastMessage || null
          };
        })
      );

      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Erro ao buscar sessões de chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeOver = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          attendant_id: user?.id,
          status: 'active'
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Erro ao assumir chat:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível assumir o chat.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Chat assumido',
        description: 'Você assumiu o controle deste chat.',
      });

      onTakeOverChat(sessionId);
      fetchChatSessions();
    } catch (error) {
      console.error('Erro ao assumir chat:', error);
    }
  };

  const getStatusBadge = (status: string, attendantId?: string) => {
    if (status === 'waiting') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em espera</Badge>;
    }
    if (status === 'active' && attendantId) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Em atendimento</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'agora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m atrás`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const activeSessions = sessions.filter(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Chats em Espera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Chats Aguardando Atendimento ({waitingSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {waitingSessions.map((session) => (
                <div key={session.id} className="p-3 border rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{session.lead?.name}</span>
                      <Badge variant="outline" className="text-xs">
                        #{session.id.slice(0, 8)}
                      </Badge>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  {session.subject && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Assunto: {session.subject}
                    </p>
                  )}
                  
                  {session.lastMessage && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-white rounded">
                      <span className="font-medium">
                        {session.lastMessage.sender_type === 'lead' ? 'Cliente' : 'IA'}:
                      </span>
                      <p className="mt-1">{session.lastMessage.message.substring(0, 100)}...</p>
                      <span className="text-xs">{getTimeAgo(session.lastMessage.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Iniciado: {getTimeAgo(session.started_at)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => handleTakeOver(session.id)}
                      className="flex items-center gap-1"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Assumir Chat
                    </Button>
                  </div>
                </div>
              ))}
              
              {waitingSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum chat aguardando atendimento</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chats Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Chats em Atendimento ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{session.lead?.name}</span>
                      <Badge variant="outline" className="text-xs">
                        #{session.id.slice(0, 8)}
                      </Badge>
                    </div>
                    {getStatusBadge(session.status, session.attendant_id)}
                  </div>
                  
                  {session.lastMessage && (
                    <div className="text-xs text-muted-foreground mb-2 p-2 bg-white rounded">
                      <span className="font-medium">
                        {session.lastMessage.sender_type === 'attendant' ? 'Atendente' : 
                         session.lastMessage.sender_type === 'lead' ? 'Cliente' : 'IA'}:
                      </span>
                      <p className="mt-1">{session.lastMessage.message.substring(0, 100)}...</p>
                      <span className="text-xs">{getTimeAgo(session.lastMessage.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Em atendimento há: {getTimeAgo(session.started_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onOpenChat?.(session.id)}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {session.attendant_id === user?.id ? 'Minha conversa' : 'Ver conversa'}
                      </Button>
                      {session.attendant_id !== user?.id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTakeOver(session.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Assumir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {activeSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum chat em atendimento</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatMonitor;

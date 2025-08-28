import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  History, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  Filter,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatHistoryItem {
  id: string;
  started_at: string;
  ended_at?: string;
  status: string;
  subject?: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  attendant?: {
    name: string;
    email: string;
  };
  message_count: number;
  last_message?: {
    message: string;
    timestamp: string;
    sender_type: string;
  };
  protocol_number?: string;
}

interface ChatHistorySearchProps {
  onOpenSession?: (sessionId: string) => void;
}

const ChatHistorySearch: React.FC<ChatHistorySearchProps> = ({ onOpenSession }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [results, setResults] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatHistoryItem | null>(null);

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativo' },
    { value: 'ended', label: 'Finalizado' },
    { value: 'abandoned', label: 'Abandonado' },
    { value: 'waiting', label: 'Aguardando' }
  ];

  const dateOptions = [
    { value: 'all', label: 'Qualquer período' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mês' },
    { value: 'quarter', label: 'Últimos 3 meses' }
  ];

  const searchHistory = async () => {
    if (!searchTerm.trim() && statusFilter === 'all' && dateFilter === 'all') {
      toast({
        title: 'Filtros necessários',
        description: 'Use pelo menos um filtro para buscar o histórico',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('chat_sessions')
        .select(`
          id,
          started_at,
          ended_at,
          status,
          subject,
          lead:leads (
            id,
            name,
            email,
            phone
          ),
          support_tickets (
            protocol_number
          )
        `)
        .order('started_at', { ascending: false });

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('started_at', startDate.toISOString());
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply text search
      if (searchTerm.trim()) {
        // Search in leads table for name, email, or phone
        const { data: leadData } = await supabase
          .from('leads')
          .select('id')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

        if (leadData && leadData.length > 0) {
          const leadIds = leadData.map(lead => lead.id);
          query = query.in('lead_id', leadIds);
        } else {
          // If no leads found, also search by protocol number
          query = query.or(`subject.ilike.%${searchTerm}%`);
        }
      }

      const { data: sessions, error } = await query.limit(50);

      if (error) {
        console.error('Search error:', error);
        toast({
          title: 'Erro na busca',
          description: 'Não foi possível realizar a busca',
          variant: 'destructive'
        });
        return;
      }

      // Get message counts and last messages for each session
      const enrichedSessions = await Promise.all(
        (sessions || []).map(async (session: any) => {
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('message, timestamp, sender_type')
            .eq('session_id', session.id)
            .order('timestamp', { ascending: false })
            .limit(1);

          const { count: messageCount } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('session_id', session.id);

          return {
            ...session,
            message_count: messageCount || 0,
            last_message: messages?.[0] || null,
            protocol_number: session.support_tickets?.[0]?.protocol_number
          };
        })
      );

      setResults(enrichedSessions);
      
      if (enrichedSessions.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: 'Nenhuma conversa encontrada com os filtros aplicados'
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno na busca',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setResults([]);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      ended: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      waiting: 'Aguardando',
      active: 'Ativo',
      ended: 'Finalizado',
      abandoned: 'Abandonado'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Conversas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Histórico de Conversas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar por</label>
                  <Input
                    placeholder="Nome, email, telefone ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={searchHistory} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button variant="outline" onClick={clearSearch}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Resultados da Busca ({results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {results.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {session.lead.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{session.lead.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {session.lead.email}
                                </div>
                                {session.lead.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {session.lead.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(session.status)}
                            {session.protocol_number && (
                              <Badge variant="outline" className="text-xs">
                                #{session.protocol_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.started_at).toLocaleString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duração: {formatDuration(session.started_at, session.ended_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.message_count} mensagens
                          </div>
                          {session.subject && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {session.subject}
                            </div>
                          )}
                        </div>
                        
                        {session.last_message && (
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            <span className="font-medium">
                              {session.last_message.sender_type === 'lead' ? 'Cliente' : 
                               session.last_message.sender_type === 'attendant' ? 'Atendente' : 'IA'}:
                            </span>
                            <p className="mt-1 line-clamp-2">{session.last_message.message}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSession?.(session.id);
                              setIsOpen(false);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir Conversa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistorySearch;
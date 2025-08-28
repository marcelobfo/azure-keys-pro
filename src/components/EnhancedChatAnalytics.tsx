import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Calendar as CalendarIcon,
  Filter,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatAnalytics {
  totalChats: number;
  completedChats: number;
  abandonedChats: number;
  averageResponseTime: number;
  averageSessionDuration: number;
  topSubjects: Array<{ subject: string; count: number; percentage: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyTrend: Array<{ date: string; chats: number; completed: number; abandoned: number }>;
  attendantPerformance: Array<{
    attendantId: string;
    attendantName: string;
    totalChats: number;
    avgResponseTime: number;
    completionRate: number;
  }>;
}

const EnhancedChatAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [customDateRange, setCustomDateRange] = useState<{start?: Date, end?: Date}>({});

  const timeRangeOptions = [
    { value: '24hours', label: 'Últimas 24 horas' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, customDateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (timeRange) {
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customDateRange.start || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = customDateRange.end || now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Basic chat statistics
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          status,
          subject,
          started_at,
          ended_at,
          attendant_id,
          leads (name, email)
        `)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (sessionsError) throw sessionsError;

      // Response time analysis
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          session_id,
          sender_type,
          timestamp,
          chat_sessions!inner (
            started_at,
            status
          )
        `)
        .gte('chat_sessions.started_at', startDate.toISOString())
        .lte('chat_sessions.started_at', endDate.toISOString())
        .order('timestamp');

      if (messagesError) throw messagesError;

      // Process analytics
      const analytics = processAnalyticsData(sessions || [], messages || []);
      setAnalytics(analytics);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as métricas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (sessions: any[], messages: any[]): ChatAnalytics => {
    const totalChats = sessions.length;
    const completedChats = sessions.filter(s => s.status === 'ended').length;
    const abandonedChats = sessions.filter(s => s.status === 'abandoned').length;

    // Calculate response times
    const responseTimes: number[] = [];
    const sessionDurations: number[] = [];

    sessions.forEach(session => {
      const sessionMessages = messages.filter(m => m.session_id === session.id);
      
      // Calculate session duration
      if (session.ended_at) {
        const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
        sessionDurations.push(duration / (1000 * 60)); // in minutes
      }

      // Calculate response time (first attendant response)
      const leadMessages = sessionMessages.filter(m => m.sender_type === 'lead').sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const attendantMessages = sessionMessages.filter(m => m.sender_type === 'attendant').sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (leadMessages.length > 0 && attendantMessages.length > 0) {
        const firstLead = new Date(leadMessages[0].timestamp);
        const firstAttendant = new Date(attendantMessages[0].timestamp);
        
        if (firstAttendant > firstLead) {
          const responseTime = firstAttendant.getTime() - firstLead.getTime();
          responseTimes.push(responseTime / (1000 * 60)); // in minutes
        }
      }
    });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    // Top subjects
    const subjectCounts: Record<string, number> = {};
    sessions.forEach(session => {
      const subject = session.subject || 'Não especificado';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const topSubjects = Object.entries(subjectCounts)
      .map(([subject, count]) => ({
        subject,
        count,
        percentage: (count / totalChats) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hourly distribution
    const hourCounts = new Array(24).fill(0);
    sessions.forEach(session => {
      const hour = new Date(session.started_at).getHours();
      hourCounts[hour]++;
    });

    const hourlyDistribution = hourCounts.map((count, hour) => ({ hour, count }));

    // Daily trend
    const dailyData: Record<string, { chats: number; completed: number; abandoned: number }> = {};
    sessions.forEach(session => {
      const date = format(new Date(session.started_at), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { chats: 0, completed: 0, abandoned: 0 };
      }
      dailyData[date].chats++;
      if (session.status === 'ended') dailyData[date].completed++;
      if (session.status === 'abandoned') dailyData[date].abandoned++;
    });

    const dailyTrend = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Attendant performance (mock data for now)
    const attendantPerformance = [
      {
        attendantId: '1',
        attendantName: 'Ana Silva',
        totalChats: Math.floor(totalChats * 0.4),
        avgResponseTime: averageResponseTime * 0.8,
        completionRate: 95
      },
      {
        attendantId: '2',
        attendantName: 'Carlos Santos',
        totalChats: Math.floor(totalChats * 0.35),
        avgResponseTime: averageResponseTime * 1.2,
        completionRate: 88
      },
      {
        attendantId: '3',
        attendantName: 'Mariana Costa',
        totalChats: Math.floor(totalChats * 0.25),
        avgResponseTime: averageResponseTime * 0.9,
        completionRate: 92
      }
    ];

    return {
      totalChats,
      completedChats,
      abandonedChats,
      averageResponseTime,
      averageSessionDuration,
      topSubjects,
      hourlyDistribution,
      dailyTrend,
      attendantPerformance
    };
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['Métrica', 'Valor'],
      ['Total de Chats', analytics.totalChats.toString()],
      ['Chats Concluídos', analytics.completedChats.toString()],
      ['Chats Abandonados', analytics.abandonedChats.toString()],
      ['Tempo Médio de Resposta (min)', analytics.averageResponseTime.toFixed(2)],
      ['Duração Média da Sessão (min)', analytics.averageSessionDuration.toFixed(2)],
      ['Taxa de Conclusão (%)', ((analytics.completedChats / analytics.totalChats) * 100).toFixed(2)],
      [''],
      ['Assuntos Mais Frequentes', ''],
      ...analytics.topSubjects.map(subject => [subject.subject, subject.count.toString()])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Relatório exportado',
      description: 'O arquivo CSV foi baixado com sucesso'
    });
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

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Não foi possível carregar as métricas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics do Chat
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Chats</p>
                <p className="text-2xl font-bold">{analytics.totalChats}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">
                  {analytics.totalChats > 0 
                    ? ((analytics.completedChats / analytics.totalChats) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</p>
                <p className="text-2xl font-bold">{analytics.averageResponseTime.toFixed(1)}min</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duração Média</p>
                <p className="text-2xl font-bold">{analytics.averageSessionDuration.toFixed(1)}min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subjects">Assuntos</TabsTrigger>
          <TabsTrigger value="timing">Horários</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Chats por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="chats" 
                      stroke="#8884d8" 
                      name="Total de Chats"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#82ca9d" 
                      name="Concluídos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="abandoned" 
                      stroke="#ff8042" 
                      name="Abandonados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Assuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.topSubjects}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.topSubjects.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Assuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {analytics.topSubjects.map((subject, index) => (
                      <div key={subject.subject} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            `bg-[${COLORS[index % COLORS.length]}]`
                          )} />
                          <span className="font-medium">{subject.subject}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{subject.count}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value) => `${value}h`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `${value}:00`}
                      formatter={(value) => [value, 'Chats']}
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance dos Atendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.attendantPerformance.map((attendant) => (
                  <div key={attendant.attendantId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{attendant.attendantName}</h4>
                      <Badge 
                        variant={attendant.completionRate > 90 ? "default" : "secondary"}
                        className={attendant.completionRate > 90 ? "bg-green-100 text-green-800" : ""}
                      >
                        {attendant.completionRate}% conclusão
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total de Chats</p>
                        <p className="font-bold">{attendant.totalChats}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tempo Médio de Resposta</p>
                        <p className="font-bold">{attendant.avgResponseTime.toFixed(1)}min</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taxa de Conclusão</p>
                        <p className="font-bold">{attendant.completionRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedChatAnalytics;
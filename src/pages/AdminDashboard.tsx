
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Home, MessageSquare, TrendingUp, Settings, Webhook, BarChart3, UserCheck, MessageCircle } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  // States for counts
  const [userCounts, setUserCounts] = useState({ total: 0, admin: 0, corretor: 0, user: 0 });
  const [propertyCount, setPropertyCount] = useState(0);
  const [leadsCounts, setLeadsCounts] = useState({ total: 0, new: 0, progressing: 0, converted: 0 });
  const [conversionRate, setConversionRate] = useState(0);
  const [webhookStats, setWebhookStats] = useState({ active: 0, failures: 0 });
  const [corretorActive, setCorretorActive] = useState(0);
  const [salesThisMonth, setSalesThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Fetch Dashboard Data (simplified, no deep analytics)
  useEffect(() => {
    // Users
    supabase.from('profiles')
      .select('role')
      .then(({ data }) => {
        if (!data) return setUserCounts({ total: 0, admin: 0, corretor: 0, user: 0 });
        const total = data.length;
        const admin = data.filter((d: any) => d.role === 'admin').length;
        const corretor = data.filter((d: any) => d.role === 'corretor').length;
        const user = data.filter((d: any) => d.role === 'user').length;
        setUserCounts({ total, admin, corretor, user });
        setCorretorActive(corretor); // use as "ativos"
      });

    // Properties
    supabase
      .from('properties')
      .select('id')
      .eq('status', 'active')
      .then(({ data }) => setPropertyCount(data ? data.length : 0));

    // Leads
    supabase
      .from('leads')
      .select('status')
      .then(({ data }) => {
        if (!data) return setLeadsCounts({ total: 0, new: 0, progressing: 0, converted: 0 });
        const total = data.length;
        const newCount = data.filter((d: any) => d.status === 'new').length;
        const progressing = data.filter((d: any) => d.status === 'in_progress').length;
        const converted = data.filter((d: any) => d.status === 'converted').length;
        setLeadsCounts({ total, new: newCount, progressing, converted });
        // Conversion rate = converted / total
        setConversionRate(total ? ((converted / total) * 100) : 0);
      });

    // Webhooks (simulado, só demo, pode conectar a configs reais depois)
    setWebhookStats({ active: 0, failures: 0 });

    // Sales/Revenue (mocks, await real integration!)
    setSalesThisMonth(0); // Para quando tiver integração
    setTotalRevenue(0);   // Idem
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Administrativo" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Dashboard Administrativo" userRole="admin">
      <div className="space-y-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Painel Administrativo
          </h2>
          <p className="text-red-100">
            Gerencie usuários, métricas e configurações do sistema.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCounts.total}</div>
              <p className="text-xs text-muted-foreground">+0% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertyCount}</div>
              <p className="text-xs text-muted-foreground">+0% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card className="cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsCounts.total}</div>
              <p className="text-xs text-muted-foreground">+0% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card className="cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">+0% em relação ao mês passado</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gerenciamento de Usuários
                <Users className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Gerencie roles, permissões e dados dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Administradores</span>
                  <Badge variant="destructive">{userCounts.admin}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Corretores</span>
                  <Badge variant="default">{userCounts.corretor}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Usuários</span>
                  <Badge variant="secondary">{userCounts.user}</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Gerenciar Usuários
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-not-allowed">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gerenciamento de Leads
                <MessageSquare className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os leads da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Novos Leads</span>
                  <Badge variant="default">{leadsCounts.new}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Em Andamento</span>
                  <Badge variant="secondary">{leadsCounts.progressing}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Convertidos</span>
                  <Badge>{leadsCounts.converted}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/chat-settings')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações do Chat
                <MessageCircle className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Configure chat com IA e integração WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Chat com IA</span>
                  <Badge variant="default">Configurar</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Integração WhatsApp</span>
                  <Badge variant="secondary">Configurar</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Mensagens Automáticas</span>
                  <Badge>Personalizar</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Configurar Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações Gerais
                <Settings className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Configure webhooks e parâmetros globais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Webhooks Ativos</span>
                  <Badge variant="default">{webhookStats.active}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Falhas nas últimas 24h</span>
                  <Badge variant="destructive">{webhookStats.failures}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Configurações do Site</span>
                  <Badge>Editar</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Acessar Configurações
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Análise de Performance
                <BarChart3 className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Métricas detalhadas e relatórios de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Corretores Ativos</span>
                  <Badge variant="default">{corretorActive}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas Este Mês</span>
                  <Badge>{salesThisMonth}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Receita Total</span>
                  <Badge variant="secondary">{totalRevenue > 0 ? `R$ ${totalRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}` : "R$ 0"}</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" disabled>
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/broker-management')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gestão de Corretores
                <UserCheck className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Acompanhe a produtividade de cada corretor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Top Performer</span>
                  <Badge>-</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas Este Mês</span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" disabled>
                Ver Produtividade
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

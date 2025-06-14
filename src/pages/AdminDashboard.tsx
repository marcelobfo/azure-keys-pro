import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Home, MessageSquare, TrendingUp, Settings, Webhook, BarChart3, UserCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

const AdminDashboard = () => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

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
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">856</div>
              <p className="text-xs text-muted-foreground">+8% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card className="cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">+23% em relação ao mês passado</p>
            </CardContent>
          </Card>
          <Card className="cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5%</div>
              <p className="text-xs text-muted-foreground">+2.1% em relação ao mês passado</p>
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
                  <Badge variant="destructive">3</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Corretores</span>
                  <Badge variant="default">25</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Usuários</span>
                  <Badge variant="secondary">1,206</Badge>
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
                  <Badge variant="default">48</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Em Andamento</span>
                  <Badge variant="secondary">124</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Convertidos</span>
                  <Badge>67</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/webhooks')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações de Webhooks
                <Webhook className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Configure webhooks para formulários e notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Webhooks Ativos</span>
                  <Badge variant="default">5</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Falhas nas últimas 24h</span>
                  <Badge variant="destructive">2</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Configurar Webhooks
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/analytics')}>
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
                  <Badge variant="default">25</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas Este Mês</span>
                  <Badge>89</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Receita Total</span>
                  <Badge variant="secondary">R$ 2.5M</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
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
                  <Badge>João Silva</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas Este Mês</span>
                  <Badge variant="secondary">234</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Ver Produtividade
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações do Sistema
                <Settings className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Configure parâmetros globais da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Editar Home</span>
                  <Badge variant="default">Banner / Primeira Dobra</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Modelos de Layout Extras</span>
                  <Badge>Novos Layouts</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Configuração do Chat</span>
                  <Badge>Chat</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Acessar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

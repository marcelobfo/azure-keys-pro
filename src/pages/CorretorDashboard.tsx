
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, Users, Plus, Calendar, Eye, TrendingUp, Clock } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

const CorretorDashboard = () => {
  const { profile, loading, hasRole } = useProfile();
  const navigate = useNavigate();

  // Mock data for quick access
  const upcomingVisits = [
    {
      id: '1',
      property: 'Casa Moderna no Centro',
      client: 'João Silva',
      date: 'Hoje',
      time: '14:30'
    },
    {
      id: '2',
      property: 'Apartamento Vista Mar',
      client: 'Maria Santos',
      date: 'Amanhã',
      time: '10:00'
    }
  ];

  const recentLeads = [
    {
      id: '1',
      name: 'Pedro Oliveira',
      property: 'Casa Moderna no Centro',
      status: 'new'
    },
    {
      id: '2',
      name: 'Ana Costa',
      property: 'Apartamento Vista Mar',
      status: 'qualified'
    }
  ];

  const myProperties = [
    {
      id: '1',
      title: 'Casa Moderna no Centro',
      price: 450000,
      views: 245,
      leads: 12
    },
    {
      id: '2',
      title: 'Apartamento Vista Mar',
      price: 650000,
      views: 189,
      leads: 8
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard do Corretor" userRole="corretor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !hasRole('corretor')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Dashboard do Corretor" userRole={profile.role}>
      <div className="space-y-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Bem-vindo, {profile?.full_name || 'Corretor'}!
          </h2>
          <p className="text-blue-100">
            Gerencie seus imóveis, leads e visitas de forma eficiente.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Imóveis</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">3 novos esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">5 novos hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Agendadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 15.2k</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manage Properties */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/properties/manage')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gerenciar Imóveis
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate('/properties/create');
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imóvel
                </Button>
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os seus imóveis cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                    <div>
                      <h4 className="font-medium">{property.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        R$ {property.price.toLocaleString()} • {property.views} visualizações • {property.leads} leads
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/property/${property.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leads')}>
            <CardHeader>
              <CardTitle>Leads Recentes</CardTitle>
              <CardDescription>
                Acompanhe seus leads mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                    <div>
                      <h4 className="font-medium">{lead.name}</h4>
                      <p className="text-sm text-muted-foreground">Interessado em {lead.property}</p>
                    </div>
                    <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                      {lead.status === 'new' ? 'Novo' : 'Qualificado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Visits */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/visits')}>
            <CardHeader>
              <CardTitle>Próximas Visitas</CardTitle>
              <CardDescription>
                Suas visitas agendadas para os próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} 
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                    <div>
                      <h4 className="font-medium">Visita - {visit.property}</h4>
                      <p className="text-sm text-muted-foreground">{visit.date}, {visit.time} • {visit.client}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={visit.date === 'Hoje' ? 'destructive' : 'default'}>
                        {visit.date}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
              <CardDescription>
                Acompanhe seu desempenho e métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Conversão</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">15.2%</span>
                    <Badge variant="default">+2.1%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tempo Médio de Resposta</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">2.5h</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Vendas este Mês</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Meta Mensal</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">60%</span>
                    <Badge variant="secondary">3/5</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CorretorDashboard;

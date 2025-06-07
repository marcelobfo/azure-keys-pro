
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, Users, Plus, Calendar } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const CorretorDashboard = () => {
  const { profile, loading, hasRole } = useProfile();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!profile || !hasRole('corretor')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Corretor</h1>
          <p className="text-muted-foreground">Gerencie seus imóveis e leads</p>
        </div>
        <Badge variant="default">
          {profile.role === 'admin' ? 'Administrador' : 'Corretor'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 15.2k</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Gerenciar Imóveis
              <Button size="sm">
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
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Casa Moderna no Centro</h4>
                  <p className="text-sm text-muted-foreground">R$ 450.000 • São Paulo, SP</p>
                </div>
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Apartamento Vista Mar</h4>
                  <p className="text-sm text-muted-foreground">R$ 650.000 • Rio de Janeiro, RJ</p>
                </div>
                <Badge variant="secondary">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>
              Acompanhe seus leads mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">João Silva</h4>
                  <p className="text-sm text-muted-foreground">Interessado em Casa Moderna</p>
                </div>
                <Badge variant="default">Novo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Maria Santos</h4>
                  <p className="text-sm text-muted-foreground">Pergunta sobre Apartamento</p>
                </div>
                <Badge variant="outline">Em andamento</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Visitas</CardTitle>
            <CardDescription>
              Suas visitas agendadas para os próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Visita - Casa Moderna</h4>
                  <p className="text-sm text-muted-foreground">Hoje, 14:30 • João Silva</p>
                </div>
                <Badge variant="destructive">Hoje</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Visita - Apartamento Vista Mar</h4>
                  <p className="text-sm text-muted-foreground">Amanhã, 10:00 • Maria Santos</p>
                </div>
                <Badge variant="default">Amanhã</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Performance</CardTitle>
            <CardDescription>
              Acompanhe seu desempenho e métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Conversão</span>
                <span className="text-sm font-medium">15.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tempo Médio de Resposta</span>
                <span className="text-sm font-medium">2.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Vendas este Mês</span>
                <span className="text-sm font-medium">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorretorDashboard;

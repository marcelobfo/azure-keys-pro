
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, Plus, Calendar, Eye, TrendingUp, Clock } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CorretorDashboard = () => {
  const { profile, loading, hasRole } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [stats, setStats] = useState({
    propertyCount: 0,
    leadCount: 0,
    visitCount: 0,
    newProperties: 0,
    newLeads: 0,
    commissions: 0,
  });

  // Fetch dynamic data
  useEffect(() => {
    if (!user) return;
    // Fetch properties
    supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setProperties(data || []);
        setStats(prev => ({ ...prev, propertyCount: (data || []).length }));
      });
    // Fetch leads
    supabase
      .from('leads')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads(data || []);
        setStats(prev => ({
          ...prev,
          leadCount: (data || []).length,
          newLeads: (data || []).filter(l => {
            const today = new Date();
            const created = new Date(l.created_at);
            return (
              created.getFullYear() === today.getFullYear() &&
              created.getMonth() === today.getMonth() &&
              created.getDate() === today.getDate()
            );
          }).length,
        }));
      });
    // Fetch visits agendadas
    supabase
      .from('visits')
      .select('*, property_id, client_name, visit_date, visit_time, notes') // pode customizar os campos
      .order('visit_date', { ascending: false })
      .then(({ data }) => {
        setVisits((data || []).filter(v => v.property_id && properties.find(p => p.id === v.property_id)));
        setStats(prev => ({
          ...prev,
          visitCount: (data || []).length,
        }));
      });
    // Comissões e imóveis novos (mock simples)
    setStats(prev => ({
      ...prev,
      newProperties: properties.filter((p) => {
        const created = new Date(p.created_at);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created >= sevenDaysAgo;
      }).length,
      commissions: 15200, // Mock valor
    }));
  }, [user, properties.length]);

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
  const dashboardRole = profile.role === 'master' ? 'admin' : profile.role;

  return (
    <DashboardLayout title="Dashboard do Corretor" userRole={dashboardRole}>
      <div className="space-y-8">
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
              <div className="text-2xl font-bold">{stats.propertyCount}</div>
              <p className="text-xs text-muted-foreground">{stats.newProperties} novos esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leadCount}</div>
              <p className="text-xs text-muted-foreground">{stats.newLeads} novos hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Agendadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.visitCount}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.commissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/manage-properties')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gerenciar Imóveis
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate('/create-property');
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
              {properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-3">Você não possui imóveis cadastrados ainda.</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          R$ {Number(property.price).toLocaleString()} • {property.views || 0} visualizações • {property.leads || 0} leads
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
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leads-management')}>
            <CardHeader>
              <CardTitle>Leads Recentes</CardTitle>
              <CardDescription>
                Acompanhe seus leads mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">Nenhum lead atribuído ainda.</div>
              ) : (
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                      <div>
                        <h4 className="font-medium">{lead.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Interessado em {lead.property_id}
                        </p>
                      </div>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                        {lead.status === 'new' ? 'Novo' : 'Qualificado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Visits */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/visits-management')}>
            <CardHeader>
              <CardTitle>Próximas Visitas</CardTitle>
              <CardDescription>
                Suas visitas agendadas para os próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">Nenhuma visita agendada.</div>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 5).map((visit) => (
                    <div key={visit.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                      <div>
                        <h4 className="font-medium">
                          {visit.property_id ? `Visita - ${properties.find(p => p.id === visit.property_id)?.title ?? 'Imóvel'}` : 'Visita'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {visit.visit_date}, {visit.visit_time} • {visit.client_name}
                          <br />
                          Responsável: {profile.full_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">
                          {visit.status ?? 'agendada'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

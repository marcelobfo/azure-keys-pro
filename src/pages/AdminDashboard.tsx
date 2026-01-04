import React, { useEffect, useState, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Home, MessageSquare, TrendingUp, Settings, BarChart3, MessageCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useRoles } from '@/hooks/useRoles';

const AdminDashboard = () => {
  const { profile, loading, hasRole } = useProfile();
  const { selectedTenantId, isGlobalView } = useTenant();
  const { isSuperAdmin } = useRoles();
  const navigate = useNavigate();

  const [userCounts, setUserCounts] = useState({ total: 0, admin: 0, corretor: 0, user: 0 });
  const [propertyCount, setPropertyCount] = useState(0);
  const [leadsCounts, setLeadsCounts] = useState({ total: 0, new: 0, progressing: 0, converted: 0 });
  const [chatStats, setChatStats] = useState({ active: 0, waiting: 0, total: 0 });
  const [conversionRate, setConversionRate] = useState(0);
  const [webhookStats, setWebhookStats] = useState({ active: 0, failures: 0 });
  const [corretorActive, setCorretorActive] = useState(0);
  const [salesThisMonth, setSalesThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    let usersQuery = supabase.from('profiles').select('role, tenant_id');
    if (!isSuperAdmin) {
    } else if (!isGlobalView && selectedTenantId) {
      usersQuery = usersQuery.eq('tenant_id', selectedTenantId);
    }
    
    const { data: usersData } = await usersQuery;
    if (usersData) {
      const total = usersData.length;
      const admin = usersData.filter((d: any) => d.role === 'admin').length;
      const corretor = usersData.filter((d: any) => d.role === 'corretor').length;
      const user = usersData.filter((d: any) => d.role === 'user').length;
      setUserCounts({ total, admin, corretor, user });
      setCorretorActive(corretor);
    } else {
      setUserCounts({ total: 0, admin: 0, corretor: 0, user: 0 });
      setCorretorActive(0);
    }

    let propertiesQuery = supabase.from('properties').select('id, tenant_id').eq('status', 'active');
    if (!isSuperAdmin) {
    } else if (!isGlobalView && selectedTenantId) {
      propertiesQuery = propertiesQuery.eq('tenant_id', selectedTenantId);
    }
    
    const { data: propertiesData } = await propertiesQuery;
    setPropertyCount(propertiesData ? propertiesData.length : 0);

    let leadsQuery = supabase.from('leads').select('status, tenant_id');
    if (!isSuperAdmin) {
    } else if (!isGlobalView && selectedTenantId) {
      leadsQuery = leadsQuery.eq('tenant_id', selectedTenantId);
    }
    
    const { data: leadsData } = await leadsQuery;
    if (leadsData) {
      const total = leadsData.length;
      const newCount = leadsData.filter((d: any) => d.status === 'new').length;
      const progressing = leadsData.filter((d: any) => d.status === 'in_progress').length;
      const converted = leadsData.filter((d: any) => d.status === 'converted').length;
      setLeadsCounts({ total, new: newCount, progressing, converted });
      setConversionRate(total ? ((converted / total) * 100) : 0);
    } else {
      setLeadsCounts({ total: 0, new: 0, progressing: 0, converted: 0 });
      setConversionRate(0);
    }

    const { data: chatData } = await supabase.from('chat_sessions').select('status');
    if (chatData) {
      const total = chatData.length;
      const active = chatData.filter((d: any) => d.status === 'active').length;
      const waiting = chatData.filter((d: any) => d.status === 'waiting').length;
      setChatStats({ active, waiting, total });
    } else {
      setChatStats({ active: 0, waiting: 0, total: 0 });
    }

    setWebhookStats({ active: 0, failures: 0 });
    setSalesThisMonth(0);
    setTotalRevenue(0);
  }, [isSuperAdmin, isGlobalView, selectedTenantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Administrativo" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Dashboard Administrativo" userRole="admin">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-2">Painel Administrativo</h2>
            <p className="text-blue-100 text-lg">Gerencie usuários, métricas e configurações do sistema.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{userCounts.total}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+0% este mês</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Imóveis Ativos</CardTitle>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:scale-110 transition-transform duration-300">
                <Home className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{propertyCount}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+0% este mês</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chats Ativos</CardTitle>
              <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{chatStats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">{chatStats.waiting} aguardando</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{conversionRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+0% este mês</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card 
            className="group cursor-pointer border-0 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1" 
            onClick={() => navigate('/chat-attendant')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Central de Atendimento</span>
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                  <MessageCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </CardTitle>
              <CardDescription>Gerencie chats ao vivo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Chats Ativos</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{chatStats.active}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Aguardando</span>
                  <Badge variant="secondary">{chatStats.waiting}</Badge>
                </div>
              </div>
              <Button className="w-full mt-4">
                Acessar Central
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer border-0 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1" 
            onClick={() => navigate('/admin/users')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciamento de Usuários</span>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardTitle>
              <CardDescription>Gerencie roles e permissões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Admins</span>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">{userCounts.admin}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Corretores</span>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">{userCounts.corretor}</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Gerenciar
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Leads</span>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardTitle>
              <CardDescription>Visualize todos os leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Novos</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{leadsCounts.new}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Convertidos</span>
                  <Badge variant="outline">{leadsCounts.converted}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer border-0 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1" 
            onClick={() => navigate('/admin/site-settings')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configurações</span>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 group-hover:bg-slate-200 dark:group-hover:bg-slate-900/50 transition-colors">
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </CardTitle>
              <CardDescription>Configure o sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Webhooks</span>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">{webhookStats.active}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Site</span>
                  <Badge variant="outline">Editar</Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Acessar
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

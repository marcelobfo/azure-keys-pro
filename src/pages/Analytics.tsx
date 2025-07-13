import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Eye, Users, Heart, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { profile, loading } = useProfile();
  const { summary, loading: analyticsLoading, fetchAnalytics, fetchTopProperties } = useAnalyticsDashboard();
  const [timeRange, setTimeRange] = useState('30');
  const [topProperties, setTopProperties] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics(parseInt(timeRange));
  }, [timeRange, fetchAnalytics]);

  useEffect(() => {
    fetchTopProperties().then(setTopProperties);
  }, [fetchTopProperties]);

  if (loading || analyticsLoading) {
    return (
      <DashboardLayout title="Analytics" userRole="admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate totals
  const totals = summary.reduce((acc, day) => ({
    page_views: acc.page_views + day.page_views,
    unique_visitors: acc.unique_visitors + day.unique_visitors,
    property_views: acc.property_views + day.property_views,
    leads_generated: acc.leads_generated + day.leads_generated,
    favorites_added: acc.favorites_added + day.favorites_added,
    visits_scheduled: acc.visits_scheduled + day.visits_scheduled,
    chat_messages: acc.chat_messages + day.chat_messages,
  }), {
    page_views: 0,
    unique_visitors: 0,
    property_views: 0,
    leads_generated: 0,
    favorites_added: 0,
    visits_scheduled: 0,
    chat_messages: 0,
  });

  // Prepare chart data
  const chartData = summary.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR'),
    ...day
  }));

  // Pie chart data for conversion funnel
  const funnelData = [
    { name: 'Visualizações', value: totals.page_views, fill: '#8884d8' },
    { name: 'Propriedades Vistas', value: totals.property_views, fill: '#82ca9d' },
    { name: 'Favoritos', value: totals.favorites_added, fill: '#ffc658' },
    { name: 'Leads', value: totals.leads_generated, fill: '#ff7300' },
    { name: 'Visitas', value: totals.visits_scheduled, fill: '#00ff00' },
  ];

  return (
    <DashboardLayout title="Analytics" userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.page_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Páginas visualizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.unique_visitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Visitantes únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Props. Visualizadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.property_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Propriedades vistas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.leads_generated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Leads convertidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Views Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Visualizações ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="page_views" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="property_views" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Visualizações', value: totals.page_views, rate: '100%' },
                      { name: 'Props. Vistas', value: totals.property_views, rate: `${(totals.property_views / totals.page_views * 100).toFixed(1)}%` },
                      { name: 'Favoritos', value: totals.favorites_added, rate: `${(totals.favorites_added / totals.property_views * 100).toFixed(1)}%` },
                      { name: 'Leads', value: totals.leads_generated, rate: `${(totals.leads_generated / totals.property_views * 100).toFixed(1)}%` },
                      { name: 'Visitas', value: totals.visits_scheduled, rate: `${(totals.visits_scheduled / totals.leads_generated * 100).toFixed(1)}%` },
                    ]}
                    margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value.toLocaleString()} (${props.payload.rate})`,
                        'Quantidade'
                      ]}
                    />
                    <Bar dataKey="value" fill="#8884d8">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">Taxa de conversão:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Visualização → Props: <span className="font-semibold">{(totals.property_views / totals.page_views * 100).toFixed(1)}%</span></div>
                  <div>Props → Favoritos: <span className="font-semibold">{(totals.favorites_added / totals.property_views * 100).toFixed(1)}%</span></div>
                  <div>Props → Leads: <span className="font-semibold">{(totals.leads_generated / totals.property_views * 100).toFixed(1)}%</span></div>
                  <div>Leads → Visitas: <span className="font-semibold">{(totals.visits_scheduled / totals.leads_generated * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="favorites_added" stackId="a" fill="#ffc658" name="Favoritos" />
                  <Bar dataKey="leads_generated" stackId="a" fill="#ff7300" name="Leads" />
                  <Bar dataKey="visits_scheduled" stackId="a" fill="#00ff00" name="Visitas" />
                  <Bar dataKey="chat_messages" stackId="a" fill="#8884d8" name="Mensagens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Propriedades Mais Visualizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProperties.slice(0, 10).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-gray-500">ID: {property.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{property.view_count || 0}</p>
                    <p className="text-sm text-gray-500">visualizações</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Bell, Search, Plus, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { favorites } = useFavorites();
  const { alerts } = usePropertyAlerts();
  const navigate = useNavigate();

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" userRole="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateAlert = () => {
    navigate('/alerts/create');
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <DashboardLayout title="Meu Dashboard" userRole="user">
      <div className="space-y-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Bem-vindo, {profile?.full_name || 'Usuário'}!
          </h2>
          <p className="text-blue-100">
            Encontre o imóvel dos seus sonhos com nossas ferramentas personalizadas.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imóveis Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.size}</div>
              <p className="text-xs text-muted-foreground">Imóveis salvos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.filter(a => a.active).length}</div>
              <p className="text-xs text-muted-foreground">Notificações configuradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buscas Salvas</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Filtros salvos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Imóveis Favoritos
                <Button variant="outline" size="sm" onClick={() => navigate('/favorites')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              </CardTitle>
              <CardDescription>
                Seus imóveis favoritos mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favorites.size === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Você ainda não tem imóveis favoritos. 
                  <br />
                  Explore nossa galeria e salve os que mais gosta!
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Renderize imóveis favoritos reais se disponíveis */}
                  {[...favorites.values()].slice(0, 2).map((favId) => (
                    <div key={favId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                      onClick={() => handleViewProperty(favId)}>
                      <div>
                        <h4 className="font-medium">Imóvel Favorito</h4>
                        <p className="text-sm text-muted-foreground">Veja detalhes completos</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Favorito</Badge>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Alertas de Imóveis
                <Button size="sm" onClick={handleCreateAlert}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Alerta
                </Button>
              </CardTitle>
              <CardDescription>
                Receba notificações sobre novos imóveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum alerta configurado.
                  <br />
                  Crie alertas para ser notificado sobre novos imóveis!
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {alert.property_type || 'Qualquer tipo'} em {alert.city || 'Qualquer cidade'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.min_price && `A partir de R$ ${alert.min_price.toLocaleString()}`}
                          {alert.max_price && ` até R$ ${alert.max_price.toLocaleString()}`}
                        </p>
                      </div>
                      <Badge variant={alert.active ? "default" : "outline"}>
                        {alert.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities (removidas, sem dados fictícios) */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Suas ações mais recentes na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground py-8">
                Nenhuma atividade recente cadastrada.
              </p>
            </CardContent>
          </Card>

          {/* Recommendations (removidas demos) */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
              <CardDescription>
                Veja novos imóveis recomendados para você.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground py-8">
                Ainda não há recomendações disponíveis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;

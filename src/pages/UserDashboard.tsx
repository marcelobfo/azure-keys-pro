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

  // Atividade & recomendações podem seguir mock, feeds principais são dinâmicos
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
              <div className="text-2xl font-bold">5</div>
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
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                       onClick={() => handleViewProperty('1')}>
                    <div>
                      <h4 className="font-medium">Casa Moderna no Centro</h4>
                      <p className="text-sm text-muted-foreground">R$ 450.000 • São Paulo, SP</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Casa</Badge>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                       onClick={() => handleViewProperty('2')}>
                    <div>
                      <h4 className="font-medium">Apartamento Vista Mar</h4>
                      <p className="text-sm text-muted-foreground">R$ 650.000 • Rio de Janeiro, RJ</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Apartamento</Badge>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
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

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Suas ações mais recentes na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} 
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                       onClick={() => activity.propertyId && handleViewProperty(activity.propertyId)}>
                    <div className="flex items-center space-x-3">
                      {activity.type === 'favorite' && <Heart className="w-4 h-4 text-red-500" />}
                      {activity.type === 'alert' && <Bell className="w-4 h-4 text-blue-500" />}
                      {activity.type === 'view' && <Eye className="w-4 h-4 text-green-500" />}
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
              <CardDescription>
                Imóveis que podem te interessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((property) => (
                  <div key={property.id} 
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                       onClick={() => handleViewProperty(property.id)}>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={property.image} 
                        alt={property.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          R$ {property.price.toLocaleString()} • {property.location}
                        </p>
                        <p className="text-xs text-blue-600">{property.reason}</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;

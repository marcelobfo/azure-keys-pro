
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Bell, Search, Plus } from 'lucide-react';

const UserDashboard = () => {
  const { profile, loading } = useProfile();
  const { favorites } = useFavorites();
  const { alerts } = usePropertyAlerts();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {profile?.full_name || 'Usuário'}!
          </p>
        </div>
        <Badge variant="secondary">Usuário</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Imóveis Favoritos
              <Button variant="outline" size="sm">
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Casa Moderna no Centro</h4>
                    <p className="text-sm text-muted-foreground">R$ 450.000 • São Paulo, SP</p>
                  </div>
                  <Badge variant="secondary">Casa</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Apartamento Vista Mar</h4>
                    <p className="text-sm text-muted-foreground">R$ 650.000 • Rio de Janeiro, RJ</p>
                  </div>
                  <Badge variant="secondary">Apartamento</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Alertas de Imóveis
              <Button size="sm">
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

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Suas ações mais recentes na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Favoritou um imóvel</h4>
                  <p className="text-sm text-muted-foreground">Casa Moderna no Centro</p>
                </div>
                <span className="text-xs text-muted-foreground">2h atrás</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Criou um alerta</h4>
                  <p className="text-sm text-muted-foreground">Apartamentos em São Paulo</p>
                </div>
                <span className="text-xs text-muted-foreground">1 dia atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
            <CardDescription>
              Imóveis que podem te interessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Cobertura Duplex Luxo</h4>
                  <p className="text-sm text-muted-foreground">R$ 1.200.000 • Rio de Janeiro, RJ</p>
                </div>
                <Badge variant="default">Novo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Apartamento Moderno</h4>
                  <p className="text-sm text-muted-foreground">R$ 380.000 • São Paulo, SP</p>
                </div>
                <Badge variant="outline">Recomendado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;

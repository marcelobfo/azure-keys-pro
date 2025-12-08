import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { usePropertyAlerts } from '@/hooks/usePropertyAlerts';

const Alerts = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  // Hook de alertas dinâmicos
  const {
    alerts,
    createAlert,
    deleteAlert: deletePropAlert,
    loading: alertsLoading
  } = usePropertyAlerts();
  
  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  const [newAlert, setNewAlert] = useState({
    property_type: '',
    city: '',
    min_price: '',
    max_price: '',
    min_bedrooms: '',
    max_bedrooms: ''
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Corrige para criar alerta real no banco
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const alertData = {
      property_type: newAlert.property_type || null,
      city: newAlert.city || null,
      min_price: newAlert.min_price ? parseFloat(newAlert.min_price) : null,
      max_price: newAlert.max_price ? parseFloat(newAlert.max_price) : null,
      min_bedrooms: newAlert.min_bedrooms ? parseInt(newAlert.min_bedrooms) : null,
      max_bedrooms: newAlert.max_bedrooms ? parseInt(newAlert.max_bedrooms) : null,
      min_area: null,
      max_area: null,
      active: true,
    };
    await createAlert(alertData);
    setNewAlert({
      property_type: '',
      city: '',
      min_price: '',
      max_price: '',
      min_bedrooms: '',
      max_bedrooms: ''
    });
  };

  // Corrige para deletar alerta real do banco:
  const handleDeleteAlert = async (id: string) => {
    await deletePropAlert(id);
  };

  return (
    <DashboardLayout title="Alertas de Imóveis" userRole={dashboardRole}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alertas de Imóveis
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Receba notificações quando novos imóveis corresponderem aos seus critérios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Criar Novo Alerta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar Novo Alerta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <Label htmlFor="property_type">Tipo de Imóvel</Label>
                  <Select value={newAlert.property_type} onValueChange={(value) => setNewAlert({...newAlert, property_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="apartamento_diferenciado">Apartamento Diferenciado</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="lote">Lote</SelectItem>
                      <SelectItem value="loft">Loft</SelectItem>
                      <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newAlert.city}
                    onChange={(e) => setNewAlert({...newAlert, city: e.target.value})}
                    placeholder="Ex: Balneário Camboriú"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_price">Preço Mínimo</Label>
                    <Input
                      id="min_price"
                      type="number"
                      value={newAlert.min_price}
                      onChange={(e) => setNewAlert({...newAlert, min_price: e.target.value})}
                      placeholder="400000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_price">Preço Máximo</Label>
                    <Input
                      id="max_price"
                      type="number"
                      value={newAlert.max_price}
                      onChange={(e) => setNewAlert({...newAlert, max_price: e.target.value})}
                      placeholder="800000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_bedrooms">Quartos Mín.</Label>
                    <Input
                      id="min_bedrooms"
                      type="number"
                      value={newAlert.min_bedrooms}
                      onChange={(e) => setNewAlert({...newAlert, min_bedrooms: e.target.value})}
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_bedrooms">Quartos Máx.</Label>
                    <Input
                      id="max_bedrooms"
                      type="number"
                      value={newAlert.max_bedrooms}
                      onChange={(e) => setNewAlert({...newAlert, max_bedrooms: e.target.value})}
                      placeholder="4"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Criar Alerta
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alertas Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Meus Alertas ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Nenhum alerta criado ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {alert.property_type || 'Qualquer tipo'} em {alert.city || 'Qualquer cidade'}
                          </p>
                          {(alert.min_price || alert.max_price) && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {alert.min_price && `R$ ${Number(alert.min_price).toLocaleString()}`}
                              {alert.max_price && ` - R$ ${Number(alert.max_price).toLocaleString()}`}
                            </p>
                          )}
                          {alert.min_bedrooms && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {alert.min_bedrooms}+ quartos
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;

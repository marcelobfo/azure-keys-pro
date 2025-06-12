
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, Trash2 } from 'lucide-react';

const Alerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      property_type: 'casa',
      city: 'Balneário Camboriú',
      min_price: 400000,
      max_price: 800000,
      min_bedrooms: 2,
      active: true
    }
  ]);

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

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    
    const alert = {
      id: Date.now().toString(),
      property_type: newAlert.property_type,
      city: newAlert.city,
      min_price: newAlert.min_price ? parseFloat(newAlert.min_price) : undefined,
      max_price: newAlert.max_price ? parseFloat(newAlert.max_price) : undefined,
      min_bedrooms: newAlert.min_bedrooms ? parseInt(newAlert.min_bedrooms) : undefined,
      max_bedrooms: newAlert.max_bedrooms ? parseInt(newAlert.max_bedrooms) : undefined,
      active: true
    };

    setAlerts([...alerts, alert]);
    setNewAlert({
      property_type: '',
      city: '',
      min_price: '',
      max_price: '',
      min_bedrooms: '',
      max_bedrooms: ''
    });

    toast({
      title: "Alerta criado",
      description: "Você será notificado quando novos imóveis corresponderem aos seus critérios.",
    });
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast({
      title: "Alerta removido",
      description: "O alerta foi removido com sucesso.",
    });
  };

  return (
    <Layout>
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
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
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
              {alerts.length === 0 ? (
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
                            {alert.property_type} em {alert.city}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            R$ {alert.min_price?.toLocaleString()} - R$ {alert.max_price?.toLocaleString()}
                          </p>
                          {alert.min_bedrooms && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {alert.min_bedrooms}+ quartos
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
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
    </Layout>
  );
};

export default Alerts;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, MapPin, Bed, Bath, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string;
  status: string;
  images: string[] | null;
  created_at: string;
}

const ManageProperties = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar propriedades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar propriedades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      setProperties(prev => prev.filter(p => p.id !== propertyId));
      toast({
        title: "Sucesso",
        description: "Propriedade excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir propriedade:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir propriedade",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Disponível</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Indisponível</Badge>;
      case 'sold':
        return <Badge variant="outline">Vendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Meus Imóveis</h2>
            <p className="text-muted-foreground">Gerencie todos os seus imóveis cadastrados</p>
          </div>
          <Button onClick={() => navigate('/create-property')}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Imóvel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-sm text-muted-foreground">Total de Imóveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.filter(p => p.status === 'available').length}</div>
              <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Total de Visualizações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum imóvel cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Comece adicionando seu primeiro imóvel
              </p>
              <Button onClick={() => navigate('/create-property')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Imóvel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={property.images?.[0] || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(property.status)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {property.price.toLocaleString()}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms || 0}
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {property.bathrooms || 0}
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {property.area || 0}m²
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/property/${property.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/edit-property/${property.id}`)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteProperty(property.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageProperties;

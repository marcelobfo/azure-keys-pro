
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, MapPin, Bed, Bath, Square, LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import Layout from '@/components/Layout';
import PropertiesBulkActions from '@/components/PropertiesBulkActions';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string;
  status: string;
  images: string[] | null;
  created_at: string;
  is_featured: boolean;
  is_beachfront: boolean;
  is_near_beach: boolean;
  is_development: boolean;
  accepts_exchange: boolean;
}

const ManageProperties = () => {
  const { user } = useAuth();
  const { hasRole } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      // Admin e Master veem todos os imóveis, outros usuários veem apenas os seus
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!hasRole('admin')) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Tratamento: garantir que preços negativos não sejam exibidos,
      // e converter tipos corretamente (evita bugs de -1 vindo como valor default)
      setProperties((data || []).map(item => ({
        ...item,
        price: (item.price != null && Number(item.price) > 0) ? Number(item.price) : 0,
        is_featured: Boolean(item.is_featured),
        is_beachfront: Boolean(item.is_beachfront),
        is_near_beach: Boolean(item.is_near_beach),
        is_development: Boolean(item.is_development),
        accepts_exchange: Boolean(item.accepts_exchange)
      })));
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
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'available':
      case 'active':
      case 'ativo':
        return <Badge variant="default">Disponível</Badge>;
      case 'unavailable':
      case 'indisponivel':
        return <Badge variant="secondary">Indisponível</Badge>;
      case 'sold':
      case 'vendido':
        return <Badge variant="outline">Vendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSpecialBadges = (property: Property) => {
    const badges = [];
    if (property.is_featured) badges.push(<Badge key="featured" className="bg-yellow-500">Destaque</Badge>);
    if (property.is_beachfront) badges.push(<Badge key="beachfront" className="bg-blue-500">Frente Mar</Badge>);
    if (property.is_near_beach) badges.push(<Badge key="near-beach" className="bg-cyan-500">Quadra Mar</Badge>);
    if (property.is_development) badges.push(<Badge key="development" className="bg-purple-500">Empreendimento</Badge>);
    if (property.accepts_exchange) badges.push(<Badge key="exchange" className="bg-green-500">Aceita Permuta</Badge>);
    return badges;
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

  const activeProperties = properties.filter(p => ['available', 'active', 'ativo'].includes(p.status?.toLowerCase()));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Meus Imóveis</h2>
            <p className="text-muted-foreground">Gerencie todos os seus imóveis cadastrados</p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
              <ToggleGroupItem value="grid" aria-label="Visualização em grade">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Visualização em lista">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => navigate('/create-property')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imóvel
            </Button>
          </div>
        </div>

        <PropertiesBulkActions
          properties={properties}
          onImportComplete={fetchProperties}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-sm text-muted-foreground">Total de Imóveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{activeProperties.length}</div>
              <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.filter(p => p.is_featured).length}</div>
              <p className="text-sm text-muted-foreground">Em Destaque</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.filter(p => p.is_beachfront || p.is_near_beach).length}</div>
              <p className="text-sm text-muted-foreground">Frente/Quadra Mar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.filter(p => p.accepts_exchange).length}</div>
              <p className="text-sm text-muted-foreground">Aceita Permuta</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties */}
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={property.images?.[0] || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {getStatusBadge(property.status)}
                  </div>
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {getSpecialBadges(property)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {property.price > 0
                      ? `R$ ${property.price.toLocaleString('pt-BR')}`
                      : 'Preço não informado'}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/property/${property.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/edit-property/${property.id}`)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProperty(property.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="hidden md:table-cell">Localização</TableHead>
                  <TableHead className="hidden lg:table-cell">Quartos</TableHead>
                  <TableHead className="hidden lg:table-cell">Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <img
                        src={property.images?.[0] || '/placeholder.svg'}
                        alt={property.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{property.title}</TableCell>
                    <TableCell className="font-bold text-blue-600">
                      {property.price > 0
                        ? `R$ ${property.price.toLocaleString('pt-BR')}`
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{property.location}</TableCell>
                    <TableCell className="hidden lg:table-cell">{property.bedrooms || 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{property.area || 0}m²</TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/property/${property.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/edit-property/${property.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProperty(property.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ManageProperties;

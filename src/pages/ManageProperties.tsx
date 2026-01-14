
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, MapPin, Bed, Toilet, Square, LayoutGrid, List, Search, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTenantContext } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import DashboardLayout from '@/components/DashboardLayout';
import PropertiesBulkActions from '@/components/PropertiesBulkActions';

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price: number | null;
  purpose: string | null;
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
  property_code: string | null;
}

const ManageProperties = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { selectedTenantId, isGlobalView } = useTenantContext();
  const { isSuperAdmin } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && profile) {
      fetchProperties();
    }
  }, [user, profile, selectedTenantId, isGlobalView]);

  const fetchProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      // Super admin com tenant selecionado filtra por tenant
      if (isSuperAdmin && selectedTenantId && !isGlobalView) {
        query = query.eq('tenant_id', selectedTenantId);
      } else if (isSuperAdmin && isGlobalView) {
        // Super admin em modo global - não filtra
      } else if (profile?.role === 'corretor') {
        // Corretor só vê seus próprios imóveis
        query = query.eq('user_id', user?.id);
      } else if (profile?.tenant_id) {
        // Usuário normal do tenant - filtra pelo tenant_id do perfil
        query = query.eq('tenant_id', profile.tenant_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Tratamento: garantir que preços negativos não sejam exibidos,
      // e converter tipos corretamente (evita bugs de -1 vindo como valor default)
      setProperties((data || []).map(item => ({
        ...item,
        price: (item.price != null && Number(item.price) > 0) ? Number(item.price) : 0,
        rental_price: (item.rental_price != null && Number(item.rental_price) > 0) ? Number(item.rental_price) : null,
        purpose: item.purpose || null,
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

  const generatePropertyQR = async (propertyId: string, propertyTitle: string) => {
    try {
      const propertyUrl = `${window.location.origin}/property/${propertyId}`;
      const qrDataUrl = await QRCode.toDataURL(propertyUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      const link = document.createElement('a');
      link.download = `qr-${propertyTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = qrDataUrl;
      link.click();
      
      toast({
        title: "QR Code gerado!",
        description: "O download do QR Code foi iniciado.",
      });
    } catch (error) {
      console.error('Erro ao gerar QR:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code.",
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

  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  if (loading) {
    return (
      <DashboardLayout title="Meus Imóveis" userRole={dashboardRole}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activeProperties = properties.filter(p => ['available', 'active', 'ativo'].includes(p.status?.toLowerCase()));

  // Filtrar propriedades pela busca
  const filteredProperties = properties.filter(p => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.property_type?.toLowerCase().includes(query) ||
      p.property_code?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout title="Meus Imóveis" userRole={dashboardRole}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, código, localização, tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
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
        {filteredProperties.length === 0 && searchQuery ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground">
                Não encontramos imóveis para "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        ) : properties.length === 0 ? (
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
            {filteredProperties.map((property) => (
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
                  {['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      R$ {property.rental_price.toLocaleString('pt-BR')}/mês
                    </p>
                  ) : property.purpose === 'both' ? (
                    <div className="mb-2">
                      {property.price > 0 && (
                        <p className="text-lg font-bold text-blue-600">
                          Venda: R$ {property.price.toLocaleString('pt-BR')}
                        </p>
                      )}
                      {property.rental_price && (
                        <p className="text-sm font-semibold text-green-600">
                          Aluguel: R$ {property.rental_price.toLocaleString('pt-BR')}/mês
                        </p>
                      )}
                    </div>
                  ) : property.price > 0 ? (
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      R$ {property.price.toLocaleString('pt-BR')}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground mb-2">
                      Preço não informado
                    </p>
                  )}
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
                      <Toilet className="h-4 w-4 mr-1" />
                      {property.bathrooms || 0}
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      {property.area || 0}m²
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
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
                      onClick={() => generatePropertyQR(property.id, property.title)}
                      title="Gerar QR Code">
                      <QrCode className="h-4 w-4 mr-1" />
                      QR
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
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <img
                        src={property.images?.[0] || '/placeholder.svg'}
                        alt={property.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{property.title}</TableCell>
                    <TableCell className="font-bold">
                      {['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
                        <span className="text-green-600">R$ {property.rental_price.toLocaleString('pt-BR')}/mês</span>
                      ) : property.purpose === 'both' ? (
                        <div className="flex flex-col">
                          {property.price > 0 && <span className="text-blue-600">R$ {property.price.toLocaleString('pt-BR')}</span>}
                          {property.rental_price && (
                            <span className="text-green-600 text-xs">+ R$ {property.rental_price.toLocaleString('pt-BR')}/mês</span>
                          )}
                        </div>
                      ) : property.price > 0 ? (
                        <span className="text-blue-600">R$ {property.price.toLocaleString('pt-BR')}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                          onClick={() => generatePropertyQR(property.id, property.title)}
                          title="Gerar QR Code">
                          <QrCode className="h-4 w-4" />
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
    </DashboardLayout>
  );
};

export default ManageProperties;

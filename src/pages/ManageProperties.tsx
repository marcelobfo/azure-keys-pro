
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, MapPin, Bed, Bath, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';

const ManageProperties = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [properties] = useState([
    {
      id: '1',
      title: 'Casa Moderna no Centro',
      price: 850000,
      location: 'São Paulo, SP',
      area: 180,
      bedrooms: 3,
      bathrooms: 2,
      type: 'Casa',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop',
      views: 245,
      leads: 12
    },
    {
      id: '2',
      title: 'Apartamento Luxo Vista Mar',
      price: 1200000,
      location: 'Rio de Janeiro, RJ',
      area: 120,
      bedrooms: 2,
      bathrooms: 2,
      type: 'Apartamento',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop',
      views: 189,
      leads: 8
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'sold':
        return <Badge variant="outline">Vendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Gerenciar Imóveis" userRole={profile?.role || 'user'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Meus Imóveis</h2>
            <p className="text-muted-foreground">Gerencie todos os seus imóveis cadastrados</p>
          </div>
          <Button onClick={() => navigate('/properties/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Imóvel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-sm text-muted-foreground">Total de Imóveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.filter(p => p.status === 'active').length}</div>
              <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.reduce((sum, p) => sum + p.views, 0)}</div>
              <p className="text-sm text-muted-foreground">Total de Visualizações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{properties.reduce((sum, p) => sum + p.leads, 0)}</div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={property.image}
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
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {property.area}m²
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span>{property.views} visualizações</span>
                  <span>{property.leads} leads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/property/${property.id}`)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/properties/edit/${property.id}`)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageProperties;

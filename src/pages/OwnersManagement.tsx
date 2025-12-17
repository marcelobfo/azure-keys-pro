import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Phone, Mail, Building, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/contexts/TenantContext';
import { formatCurrency } from '@/utils/priceUtils';

interface OwnerProperty {
  id: string;
  title: string;
  price: number;
  city: string;
  status: string;
  slug: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_notes: string;
}

interface Owner {
  name: string;
  phone: string;
  email: string;
  properties: OwnerProperty[];
}

const OwnersManagement = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { currentTenant, selectedTenantId } = useTenantContext();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;
  
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  useEffect(() => {
    fetchOwners();
  }, [effectiveTenantId]);

  const fetchOwners = async () => {
    if (!effectiveTenantId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, price, city, status, slug, owner_name, owner_phone, owner_email, owner_notes')
        .eq('tenant_id', effectiveTenantId)
        .not('owner_name', 'is', null)
        .order('owner_name');

      if (error) throw error;

      // Agrupar por proprietário
      const ownersMap = new Map<string, Owner>();
      
      data?.forEach((property) => {
        const key = property.owner_email || property.owner_phone || property.owner_name || '';
        if (!key) return;

        if (!ownersMap.has(key)) {
          ownersMap.set(key, {
            name: property.owner_name || '',
            phone: property.owner_phone || '',
            email: property.owner_email || '',
            properties: []
          });
        }

        ownersMap.get(key)?.properties.push(property as OwnerProperty);
      });

      setOwners(Array.from(ownersMap.values()));
    } catch (error) {
      console.error('Erro ao buscar proprietários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOwners = owners.filter(owner => 
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <DashboardLayout title="Proprietários" userRole={dashboardRole}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Proprietários" userRole={dashboardRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Proprietários</h1>
            <p className="text-muted-foreground">Visualize os proprietários e seus imóveis</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proprietário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Proprietários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{owners.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Imóveis com Proprietário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {owners.reduce((acc, owner) => acc + owner.properties.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Média de Imóveis por Proprietário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {owners.length > 0 ? (owners.reduce((acc, owner) => acc + owner.properties.length, 0) / owners.length).toFixed(1) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Owners List */}
        {filteredOwners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {searchTerm ? 'Nenhum proprietário encontrado para esta busca.' : 'Nenhum proprietário cadastrado.'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Para adicionar proprietários, edite os imóveis e preencha os dados do proprietário.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOwners.map((owner, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{owner.name || 'Nome não informado'}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                          {owner.phone && (
                            <a href={`tel:${owner.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                              <Phone className="w-4 h-4" /> {owner.phone}
                            </a>
                          )}
                          {owner.email && (
                            <a href={`mailto:${owner.email}`} className="flex items-center gap-1 hover:text-blue-600">
                              <Mail className="w-4 h-4" /> {owner.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {owner.properties.length} imóvel(is)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imóvel</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owner.properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">{property.title}</TableCell>
                          <TableCell>{property.city}</TableCell>
                          <TableCell>{formatCurrency(property.price)}</TableCell>
                          <TableCell>
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                              {property.status === 'active' ? 'Ativo' : property.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/imovel/${property.slug || property.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/edit-property/${property.id}`)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnersManagement;
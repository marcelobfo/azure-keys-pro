import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Plus, Edit, Trash2, Users, Settings, 
  MessageSquare, Store, DollarSign, Phone, Loader2, UserMinus 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AddTenantUserDialog from '@/components/AddTenantUserDialog';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface TenantFeatures {
  id: string;
  tenant_id: string;
  chat_enabled: boolean;
  olx_enabled: boolean;
  leads_enabled: boolean;
  commissions_enabled: boolean;
  evolution_enabled: boolean;
  whatsapp_enabled: boolean;
  max_users: number;
  max_properties: number;
}

interface TenantUser {
  id: string;
  user_id: string;
  role: string;
  tenant_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminTenants: React.FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeatures | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
  });

  useEffect(() => {
    if (!rolesLoading && !isSuperAdmin) {
      navigate('/dashboard');
    }
  }, [isSuperAdmin, rolesLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar tenants',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantFeatures = async (tenantId: string) => {
    const { data, error } = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({ title: 'Erro ao carregar recursos', variant: 'destructive' });
    } else {
      setTenantFeatures(data || {
        id: '',
        tenant_id: tenantId,
        chat_enabled: true,
        olx_enabled: false,
        leads_enabled: true,
        commissions_enabled: true,
        evolution_enabled: false,
        whatsapp_enabled: false,
        max_users: 10,
        max_properties: 100,
      });
    }
  };

  const fetchTenantUsers = async (tenantId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        tenant_id,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId);

    if (error) {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } else {
      setTenantUsers(data as any || []);
    }
  };

  const handleCreateTenant = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: 'Preencha nome e slug', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default features for the tenant
      await supabase.from('tenant_features').insert({
        tenant_id: data.id,
      });

      // Create clean chat configuration for the tenant
      await supabase.from('chat_configurations').insert({
        tenant_id: data.id,
        company: formData.name,
        active: true,
        ai_chat_enabled: false,
        whatsapp_enabled: false,
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
        system_instruction: '',
        api_provider: 'gemini',
      });

      // Create clean site settings for the tenant
      // Configurações padrão limpas para novo tenant - SEM dados de outras imobiliárias
      const defaultSettings = [
        { key: 'company_name', value: 'Minha Imobiliária', tenant_id: data.id },
        { key: 'company_description', value: 'Sua imobiliária de confiança', tenant_id: data.id },
        { key: 'phone', value: '', tenant_id: data.id },
        { key: 'email', value: '', tenant_id: data.id },
        { key: 'address', value: '', tenant_id: data.id },
        { key: 'logo_url', value: '', tenant_id: data.id },
        { key: 'hero_title', value: 'Encontre seu imóvel ideal', tenant_id: data.id },
        { key: 'hero_subtitle', value: 'Os melhores imóveis da região', tenant_id: data.id },
      ];

      await supabase.from('site_settings').insert(defaultSettings);

      toast({ title: 'Imobiliária criada com sucesso!' });
      setIsFormOpen(false);
      setFormData({ name: '', slug: '', domain: '' });
      fetchTenants();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar imobiliária',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || null,
        })
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast({ title: 'Imobiliária atualizada!' });
      setIsFormOpen(false);
      setSelectedTenant(null);
      setFormData({ name: '', slug: '', domain: '' });
      fetchTenants();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imobiliária? Todos os dados serão perdidos.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      toast({ title: 'Imobiliária excluída!' });
      fetchTenants();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFeatures = async () => {
    if (!tenantFeatures || !selectedTenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenant_features')
        .upsert({
          tenant_id: selectedTenant.id,
          chat_enabled: tenantFeatures.chat_enabled,
          olx_enabled: tenantFeatures.olx_enabled,
          leads_enabled: tenantFeatures.leads_enabled,
          commissions_enabled: tenantFeatures.commissions_enabled,
          evolution_enabled: tenantFeatures.evolution_enabled,
          whatsapp_enabled: tenantFeatures.whatsapp_enabled,
          max_users: tenantFeatures.max_users,
          max_properties: tenantFeatures.max_properties,
        });

      if (error) throw error;

      toast({ title: 'Recursos atualizados!' });
      setIsFeaturesOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar recursos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditForm = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || '',
    });
    setIsFormOpen(true);
  };

  const openFeaturesDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    fetchTenantFeatures(tenant.id);
    setIsFeaturesOpen(true);
  };

  const openUsersDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    fetchTenantUsers(tenant.id);
    setIsUsersOpen(true);
  };

  const handleRemoveUserFromTenant = async (userRoleId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userName} deste tenant?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (error) throw error;

      toast({ title: 'Usuário removido do tenant!' });
      if (selectedTenant) {
        fetchTenantUsers(selectedTenant.id);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleChangeUserRole = async (userRoleId: string, newRole: 'user' | 'corretor' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', userRoleId);

      if (error) throw error;

      toast({ title: 'Função atualizada!' });
      if (selectedTenant) {
        fetchTenantUsers(selectedTenant.id);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar função',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (rolesLoading || loading) {
    return (
      <DashboardLayout title="Administração de Tenants" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const featuresList = [
    { key: 'chat_enabled', label: 'Chat com IA', icon: MessageSquare },
    { key: 'olx_enabled', label: 'Integração OLX', icon: Store },
    { key: 'leads_enabled', label: 'Gestão de Leads', icon: Users },
    { key: 'commissions_enabled', label: 'Comissões', icon: DollarSign },
    { key: 'evolution_enabled', label: 'Evolution API', icon: Phone },
    { key: 'whatsapp_enabled', label: 'WhatsApp', icon: Phone },
  ];

  return (
    <DashboardLayout title="Administração de Tenants" userRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Imobiliárias</h2>
            <p className="text-muted-foreground">Gerencie todas as imobiliárias do sistema</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedTenant(null);
                setFormData({ name: '', slug: '', domain: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Imobiliária
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedTenant ? 'Editar Imobiliária' : 'Nova Imobiliária'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da imobiliária"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (identificador único)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="minha-imobiliaria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domínio (opcional)</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="www.minhaimobiliaria.com.br"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={selectedTenant ? handleUpdateTenant : handleCreateTenant}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {selectedTenant ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Lista de Imobiliárias
            </CardTitle>
            <CardDescription>
              {tenants.length} imobiliária(s) cadastrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.slug}</Badge>
                    </TableCell>
                    <TableCell>{tenant.domain || '-'}</TableCell>
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUsersDialog(tenant)}
                          title="Usuários"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openFeaturesDialog(tenant)}
                          title="Recursos"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(tenant)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma imobiliária cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Features Dialog */}
        <Dialog open={isFeaturesOpen} onOpenChange={setIsFeaturesOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Recursos - {selectedTenant?.name}</DialogTitle>
            </DialogHeader>
            {tenantFeatures && (
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  {featuresList.map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                        <span>{feature.label}</span>
                      </div>
                      <Switch
                        checked={tenantFeatures[feature.key as keyof TenantFeatures] as boolean}
                        onCheckedChange={(checked) =>
                          setTenantFeatures({ ...tenantFeatures, [feature.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Máximo de Usuários</Label>
                    <Input
                      type="number"
                      value={tenantFeatures.max_users}
                      onChange={(e) =>
                        setTenantFeatures({ ...tenantFeatures, max_users: parseInt(e.target.value) || 10 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de Imóveis</Label>
                    <Input
                      type="number"
                      value={tenantFeatures.max_properties}
                      onChange={(e) =>
                        setTenantFeatures({ ...tenantFeatures, max_properties: parseInt(e.target.value) || 100 })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsFeaturesOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateFeatures} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Users Dialog */}
        <Dialog open={isUsersOpen} onOpenChange={setIsUsersOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Usuários - {selectedTenant?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-end mb-4">
                {selectedTenant && (
                  <AddTenantUserDialog
                    tenantId={selectedTenant.id}
                    tenantName={selectedTenant.name}
                    onUserAdded={() => fetchTenantUsers(selectedTenant.id)}
                  />
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantUsers.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell>{userRole.profiles?.full_name || '-'}</TableCell>
                      <TableCell>{userRole.profiles?.email || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={userRole.role}
                          onValueChange={(value) => handleChangeUserRole(userRole.id, value as 'user' | 'corretor' | 'admin')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="corretor">Corretor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUserFromTenant(
                            userRole.id,
                            userRole.profiles?.full_name || 'este usuário'
                          )}
                          title="Remover do tenant"
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tenantUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário neste tenant
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminTenants;

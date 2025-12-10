import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Save, ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle, MessageSquare, Copy, Trash, Plus } from 'lucide-react';

interface OLXSettings {
  id?: number;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  default_phone: string;
  auto_publish: boolean;
  tenant_id?: string;
  lead_webhook_token?: string;
  lead_config_id?: string;
  lead_webhook_url?: string;
}

interface OLXIntegration {
  id: string;
  access_token: string;
  is_active: boolean;
  updated_at: string;
  tenant_id?: string;
}

const AdminOLXSettings = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');
  
  // Get tenant_id from profile
  const tenantId = profile?.tenant_id;

  const [settings, setSettings] = useState<OLXSettings>({
    client_id: '',
    client_secret: '',
    redirect_uri: window.location.origin + '/olx-callback',
    default_phone: '',
    auto_publish: false,
  });
  const [integration, setIntegration] = useState<OLXIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [configuringLeads, setConfiguringLeads] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchIntegration();
    }
  }, [user, tenantId]);

  const fetchSettings = async () => {
    try {
      let query = supabase.from('olx_settings').select('*');
      
      // Filter by tenant_id if available
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();

      if (data) {
        setSettings({
          id: data.id,
          client_id: data.client_id || '',
          client_secret: data.client_secret || '',
          redirect_uri: data.redirect_uri || window.location.origin + '/olx-callback',
          default_phone: data.default_phone || '',
          auto_publish: data.auto_publish || false,
          tenant_id: data.tenant_id,
          lead_webhook_token: data.lead_webhook_token,
          lead_config_id: data.lead_config_id,
          lead_webhook_url: data.lead_webhook_url,
        });
      }
    } catch (error) {
      console.error('Error fetching OLX settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegration = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('olx_integration')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      // Also filter by tenant if available
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query.maybeSingle();

      if (data) {
        setIntegration(data);
      }
    } catch (error) {
      console.error('Error fetching OLX integration:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings.client_id || !settings.client_secret || !settings.redirect_uri) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        client_id: settings.client_id,
        client_secret: settings.client_secret,
        redirect_uri: settings.redirect_uri,
        default_phone: settings.default_phone,
        auto_publish: settings.auto_publish,
        tenant_id: tenantId || null,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('olx_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('olx_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectOLX = async () => {
    if (!settings.client_id) {
      toast({
        title: 'Erro',
        description: 'Configure o Client ID primeiro',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);
    try {
      // Pass tenant_id to the OAuth start function
      const { data, error } = await supabase.functions.invoke('olx-oauth-start', {
        body: { tenant_id: tenantId }
      });

      if (error) throw error;

      if (data?.auth_url) {
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        toast({
          title: 'Autorização OLX',
          description: 'Uma nova janela foi aberta. Complete a autorização na OLX.',
        });
      }
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar conexão com OLX',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !integration) return;

    try {
      const { error } = await supabase
        .from('olx_integration')
        .update({ is_active: false })
        .eq('id', integration.id);

      if (error) throw error;

      setIntegration(null);
      toast({
        title: 'Desconectado',
        description: 'Integração com OLX desconectada',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRegisterLeadConfig = async () => {
    if (!user || !tenantId || !integration) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar conectado à OLX primeiro',
        variant: 'destructive',
      });
      return;
    }

    setConfiguringLeads(true);
    try {
      const { data, error } = await supabase.functions.invoke('olx-lead-config', {
        body: { 
          action: 'register',
          tenant_id: tenantId,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSettings(prev => ({
          ...prev,
          lead_config_id: data.config_id,
          lead_webhook_url: data.webhook_url
        }));
        toast({
          title: 'Sucesso',
          description: 'Recebimento de leads configurado! A OLX agora enviará leads automaticamente.',
        });
        fetchSettings();
      } else {
        throw new Error(data?.error || 'Erro ao configurar leads');
      }
    } catch (error: any) {
      console.error('Error registering lead config:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao configurar recebimento de leads',
        variant: 'destructive',
      });
    } finally {
      setConfiguringLeads(false);
    }
  };

  const handleUpdateLeadConfig = async () => {
    if (!user || !tenantId) return;

    setConfiguringLeads(true);
    try {
      const { data, error } = await supabase.functions.invoke('olx-lead-config', {
        body: { 
          action: 'update',
          tenant_id: tenantId,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSettings(prev => ({
          ...prev,
          lead_webhook_url: data.webhook_url
        }));
        toast({
          title: 'Sucesso',
          description: 'Configuração de leads atualizada!',
        });
        fetchSettings();
      } else {
        throw new Error(data?.error || 'Erro ao atualizar configuração');
      }
    } catch (error: any) {
      console.error('Error updating lead config:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar configuração',
        variant: 'destructive',
      });
    } finally {
      setConfiguringLeads(false);
    }
  };

  const handleDeleteLeadConfig = async () => {
    if (!user || !tenantId) return;

    setConfiguringLeads(true);
    try {
      const { data, error } = await supabase.functions.invoke('olx-lead-config', {
        body: { 
          action: 'delete',
          tenant_id: tenantId,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSettings(prev => ({
          ...prev,
          lead_config_id: undefined,
          lead_webhook_url: undefined,
          lead_webhook_token: undefined
        }));
        toast({
          title: 'Removido',
          description: 'Configuração de leads removida da OLX',
        });
        fetchSettings();
      } else {
        throw new Error(data?.error || 'Erro ao remover configuração');
      }
    } catch (error: any) {
      console.error('Error deleting lead config:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover configuração',
        variant: 'destructive',
      });
    } finally {
      setConfiguringLeads(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'URL copiada para a área de transferência',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Integração OLX" userRole={dashboardRole}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Integração OLX" userRole={dashboardRole}>
      <div className="space-y-6">
        {/* Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status da Conexão
              {integration ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" /> Desconectado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {integration 
                ? `Última atualização: ${new Date(integration.updated_at).toLocaleString('pt-BR')}`
                : 'Conecte sua conta OLX para publicar anúncios automaticamente'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {integration ? (
                <Button variant="destructive" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              ) : (
                <Button onClick={handleConnectOLX} disabled={connecting || !settings.client_id}>
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Conectar com OLX
                </Button>
              )}
              <Button variant="outline" onClick={fetchIntegration}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recebimento de Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recebimento de Leads
              {settings.lead_config_id ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" /> Não configurado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure o recebimento automático de leads da OLX. Quando um cliente entra em contato pelo seu anúncio, 
              o lead será cadastrado automaticamente no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.lead_webhook_url && (
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input value={settings.lead_webhook_url} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(settings.lead_webhook_url!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta URL está registrada na OLX para envio automático de leads.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              {settings.lead_config_id ? (
                <>
                  <Button variant="outline" onClick={handleUpdateLeadConfig} disabled={configuringLeads}>
                    {configuringLeads ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar URL
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteLeadConfig} disabled={configuringLeads}>
                    <Trash className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </>
              ) : (
                <Button onClick={handleRegisterLeadConfig} disabled={!integration || configuringLeads}>
                  {configuringLeads ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Configurar Recebimento de Leads
                </Button>
              )}
            </div>

            {!integration && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <strong>Atenção:</strong> Você precisa estar conectado à OLX para configurar o recebimento de leads.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações da API */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciais da API OLX</CardTitle>
            <CardDescription>
              Insira as credenciais fornecidas pela OLX após o registro da sua aplicação.
              Entre em contato com suporteintegrador@olxbr.com para obter suas credenciais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={settings.client_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="Ex: 1055d3e698d289f2af8663725127bd4b"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={settings.client_secret}
                  onChange={(e) => setSettings(prev => ({ ...prev, client_secret: e.target.value }))}
                  placeholder="Chave secreta fornecida pela OLX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect_uri">URI de Redirecionamento *</Label>
              <Input
                id="redirect_uri"
                value={settings.redirect_uri}
                onChange={(e) => setSettings(prev => ({ ...prev, redirect_uri: e.target.value }))}
                placeholder="https://seusite.com/olx-callback"
              />
              <p className="text-xs text-muted-foreground">
                Esta URL deve estar cadastrada na OLX como URI de redirecionamento.
                Para multi-tenant, use a URL centralizada do Supabase.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_phone">Telefone Padrão</Label>
              <Input
                id="default_phone"
                value={settings.default_phone}
                onChange={(e) => setSettings(prev => ({ ...prev, default_phone: e.target.value }))}
                placeholder="21999999999"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                DDD + número sem espaços (será usado nos anúncios)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_publish"
                checked={settings.auto_publish}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_publish: checked }))}
              />
              <Label htmlFor="auto_publish">Publicar automaticamente novos imóveis</Label>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Como configurar a integração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>Entre em contato com <strong>suporteintegrador@olxbr.com</strong> para registrar sua aplicação</li>
              <li>Forneça os dados solicitados: nome, descrição, website, telefone, e-mail e URIs de redirecionamento</li>
              <li>Após aprovação, você receberá o <strong>Client ID</strong> e <strong>Client Secret</strong></li>
              <li>Insira as credenciais nos campos acima e salve</li>
              <li>Clique em "Conectar com OLX" para autorizar a aplicação</li>
              <li>Configure o "Recebimento de Leads" para receber leads automaticamente</li>
              <li>Após autorização, seus imóveis poderão ser publicados na OLX</li>
            </ol>
            <div className="bg-muted p-3 rounded-md">
              <strong>Importante:</strong> A OLX exige um plano profissional para empresas para usar a API de integração de anúncios.
            </div>
            <div className="bg-muted p-3 rounded-md">
              <strong>Multi-tenant:</strong> Cada imobiliária pode configurar suas próprias credenciais OLX. 
              As configurações são isoladas por tenant.
            </div>
            <div className="bg-muted p-3 rounded-md">
              <strong>Leads:</strong> Leads recebidos da OLX aparecerão com a origem "olx" ou "olx_whatsapp" 
              na lista de leads do sistema.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOLXSettings;

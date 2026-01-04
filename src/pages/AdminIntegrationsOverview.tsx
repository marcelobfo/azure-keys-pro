import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { Navigate } from 'react-router-dom';
import { 
  Brain, MessageSquare, Store, BookOpen, 
  CheckCircle2, XCircle, PlugZap, Building2,
  Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantIntegration {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  chat_configured: boolean;
  ai_enabled: boolean;
  ai_provider: string | null;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  evolution_configured: boolean;
  whatsapp_enabled: boolean;
  olx_settings: boolean;
  olx_authenticated: boolean;
  kb_articles_count: number;
}

const AdminIntegrationsOverview = () => {
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const [integrations, setIntegrations] = useState<TenantIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrationsData = async () => {
    setLoading(true);
    try {
      // Fetch all tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');

      if (!tenants) {
        setIntegrations([]);
        return;
      }

      // Fetch chat configurations
      const { data: chatConfigs } = await supabase
        .from('chat_configurations')
        .select('tenant_id, ai_chat_enabled, api_provider, gemini_api_key, openai_api_key, evolution_api_url, evolution_api_key, whatsapp_enabled');

      // Fetch OLX settings
      const { data: olxSettings } = await supabase
        .from('olx_settings')
        .select('tenant_id, client_id');

      // Fetch OLX integrations (authenticated)
      const { data: olxIntegrations } = await supabase
        .from('olx_integration')
        .select('tenant_id, is_active');

      // Fetch knowledge base articles count per tenant
      const { data: kbArticles } = await supabase
        .from('knowledge_base_articles')
        .select('tenant_id');

      // Map data
      const integrationsData: TenantIntegration[] = tenants.map(tenant => {
        const chatConfig = chatConfigs?.find(c => c.tenant_id === tenant.id);
        const olxSetting = olxSettings?.find(o => o.tenant_id === tenant.id);
        const olxIntegration = olxIntegrations?.find(o => o.tenant_id === tenant.id && o.is_active);
        const articlesCount = kbArticles?.filter(a => a.tenant_id === tenant.id).length || 0;

        return {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          chat_configured: !!chatConfig,
          ai_enabled: chatConfig?.ai_chat_enabled || false,
          ai_provider: chatConfig?.api_provider || null,
          has_gemini_key: !!chatConfig?.gemini_api_key,
          has_openai_key: !!chatConfig?.openai_api_key,
          evolution_configured: !!(chatConfig?.evolution_api_url && chatConfig?.evolution_api_key),
          whatsapp_enabled: chatConfig?.whatsapp_enabled || false,
          olx_settings: !!olxSetting?.client_id,
          olx_authenticated: !!olxIntegration,
          kb_articles_count: articlesCount,
        };
      });

      setIntegrations(integrationsData);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchIntegrationsData();
    }
  }, [isSuperAdmin]);

  // Summary calculations
  const summaries = {
    chatConfigured: integrations.filter(i => i.chat_configured).length,
    aiEnabled: integrations.filter(i => i.ai_enabled).length,
    evolutionConfigured: integrations.filter(i => i.evolution_configured).length,
    olxAuthenticated: integrations.filter(i => i.olx_authenticated).length,
    withKnowledgeBase: integrations.filter(i => i.kb_articles_count > 0).length,
    total: integrations.length,
  };

  if (rolesLoading) {
    return (
      <DashboardLayout title="Visão Geral de Integrações" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Visão Geral de Integrações" userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <PlugZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Integrações por Tenant</h2>
              <p className="text-muted-foreground">Status consolidado de todas as APIs e configurações</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIntegrationsData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chat/IA</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summaries.aiEnabled}/{summaries.total}</div>
              <p className="text-xs text-muted-foreground">Tenants com IA ativa</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Evolution API</CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summaries.evolutionConfigured}/{summaries.total}</div>
              <p className="text-xs text-muted-foreground">Tenants configurados</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">OLX</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summaries.olxAuthenticated}/{summaries.total}</div>
              <p className="text-xs text-muted-foreground">Tenants autenticados</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Knowledge Base</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summaries.withKnowledgeBase}/{summaries.total}</div>
              <p className="text-xs text-muted-foreground">Tenants com artigos</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30">
                <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summaries.total}</div>
              <p className="text-xs text-muted-foreground">Tenants cadastrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Status por Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-center">Chat IA</TableHead>
                      <TableHead className="text-center">Provider</TableHead>
                      <TableHead className="text-center">Evolution</TableHead>
                      <TableHead className="text-center">WhatsApp</TableHead>
                      <TableHead className="text-center">OLX</TableHead>
                      <TableHead className="text-center">KB Artigos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.map((integration) => (
                      <TableRow key={integration.tenant_id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{integration.tenant_name}</p>
                              <p className="text-xs text-muted-foreground">{integration.tenant_slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.ai_enabled ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-0">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.ai_provider ? (
                            <Badge variant="outline" className="capitalize">
                              {integration.ai_provider}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.evolution_configured ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Config
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-0">
                              <XCircle className="w-3 h-3 mr-1" />
                              Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.whatsapp_enabled ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-0">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.olx_authenticated ? (
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                              Auth OK
                            </Badge>
                          ) : integration.olx_settings ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                              Parcial
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-0">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {integration.kb_articles_count > 0 ? (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                              {integration.kb_articles_count} artigos
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-0">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminIntegrationsOverview;

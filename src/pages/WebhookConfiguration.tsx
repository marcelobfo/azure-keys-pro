import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Webhook, AlertCircle, CheckCircle, Send, Plus, Trash2, Edit } from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret_key?: string;
  headers?: any; // Json type from Supabase
  created_at: string;
  updated_at: string;
}

const AVAILABLE_EVENTS = [
  'user_registered',
  'favorite_added', 
  'favorite_removed',
  'property_viewed',
  'lead_created',
  'visit_scheduled',
  'chat_message',
  'page_view',
  'unique_visitor'
];

const WebhookConfiguration = () => {
  const { profile, loading, hasRole } = useProfile();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true,
    secret_key: '',
    headers: {} as Record<string, string>
  });

  useEffect(() => {
    if (hasRole('admin')) {
      fetchWebhooks();
    }
  }, [profile, hasRole]);

  const fetchWebhooks = async () => {
    try {
      console.log('Fetching webhooks...');
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Webhook fetch result:', { data, error });

      if (error) {
        console.error('Webhook fetch error:', error);
        throw error;
      }
      
      console.log('Setting webhooks:', data);
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar webhooks: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      active: true,
      secret_key: '',
      headers: {}
    });
    setShowAddForm(false);
    setEditingWebhook(null);
  };

  const saveWebhook = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const webhookData = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        events: formData.events,
        active: formData.active,
        secret_key: formData.secret_key.trim() || null,
        headers: formData.headers || {}
      };

      if (editingWebhook) {
        const { error } = await supabase
          .from('webhook_configurations')
          .update(webhookData)
          .eq('id', editingWebhook.id);
        
        if (error) throw error;
        toast({ title: "Webhook atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('webhook_configurations')
          .insert([webhookData]);
        
        if (error) throw error;
        toast({ title: "Webhook criado com sucesso!" });
      }

      resetForm();
      fetchWebhooks();
    } catch (error: any) {
      console.error('Error saving webhook:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar webhook: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Webhook excluído com sucesso!" });
      fetchWebhooks();
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir webhook: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      fetchWebhooks();
    } catch (error: any) {
      console.error('Error toggling webhook:', error);
      toast({
        title: "Erro",
        description: `Erro ao alterar status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTestLoading(webhook.id);
    setTestResults(prev => ({ ...prev, [webhook.id]: null }));

    try {
      const testPayload = {
        event: 'webhook_test',
        user_id: profile?.id,
        data: {
          message: `Teste do webhook: ${webhook.name}`,
          webhook_id: webhook.id,
          timestamp: new Date().toISOString(),
          test: true
        },
        timestamp: new Date().toISOString(),
        source: 'webhook_configuration'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.headers
      };

      if (webhook.secret_key) {
        headers['X-Webhook-Secret'] = webhook.secret_key;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, [webhook.id]: 'success' }));
        toast({
          title: "Teste bem-sucedido!",
          description: `Webhook "${webhook.name}" funcionou corretamente.`,
        });
      } else {
        setTestResults(prev => ({ ...prev, [webhook.id]: 'error' }));
        toast({
          title: "Teste falhou",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [webhook.id]: 'error' }));
      console.error('Error testing webhook:', error);
      toast({
        title: "Erro no teste",
        description: `Erro ao testar webhook: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTestLoading(null);
    }
  };

  const startEdit = (webhook: WebhookConfig) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      secret_key: webhook.secret_key || '',
      headers: webhook.headers || {}
    });
    setEditingWebhook(webhook);
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Configuração de Webhook" userRole="admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Configuração de Webhooks" userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configuração de Webhooks</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie webhooks para receber eventos do sistema
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Webhook
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <div>
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={formData.events.includes(event)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              events: [...formData.events, event]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              events: formData.events.filter(e => e !== event)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={event} className="text-sm">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secret">Chave Secreta (Opcional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                    placeholder="Chave secreta para autenticação"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(active) => setFormData({ ...formData, active })}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={saveWebhook}>
                  {editingWebhook ? 'Atualizar' : 'Criar'} Webhook
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhooks List */}
        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Webhook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum webhook configurado</p>
                <p className="text-sm text-gray-400">
                  Clique em "Novo Webhook" para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Webhook className="w-5 h-5" />
                        <span>{webhook.name}</span>
                        {!webhook.active && (
                          <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Inativo
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {webhook.url}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={(active) => toggleWebhook(webhook.id, active)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(webhook)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWebhook(webhook)}
                        disabled={testLoading === webhook.id || !webhook.active}
                      >
                        {testLoading === webhook.id ? (
                          'Testando...'
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Eventos:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map(event => (
                          <span
                            key={event}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    {testResults[webhook.id] && (
                      <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                        testResults[webhook.id] === 'success' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {testResults[webhook.id] === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {testResults[webhook.id] === 'success' 
                            ? 'Teste bem-sucedido!' 
                            : 'Falha no teste'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Eventos de Usuário</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <code>user_registered</code></li>
                  <li>• <code>favorite_added</code></li>
                  <li>• <code>favorite_removed</code></li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Eventos de Propriedades</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <code>property_viewed</code></li>
                  <li>• <code>lead_created</code></li>
                  <li>• <code>visit_scheduled</code></li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Eventos de Sistema</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <code>chat_message</code></li>
                  <li>• <code>page_view</code></li>
                  <li>• <code>unique_visitor</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WebhookConfiguration;
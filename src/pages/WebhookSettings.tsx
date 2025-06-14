import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

const WebhookSettings = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: 'Lead Notifications',
      url: 'https://webhook.site/unique-id',
      events: ['lead.created', 'lead.updated'],
      active: true,
      secret: 'whsec_1234567890'
    },
    {
      id: '2',
      name: 'Visit Reminders',
      url: 'https://webhook.site/another-id',
      events: ['visit.scheduled', 'visit.reminder'],
      active: false,
      secret: 'whsec_0987654321'
    }
  ]);

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true
  });

  const availableEvents = [
    { key: 'lead.created', label: 'Novo Lead' },
    { key: 'lead.updated', label: 'Lead Atualizado' },
    { key: 'visit.scheduled', label: 'Visita Agendada' },
    { key: 'visit.reminder', label: 'Lembrete de Visita' },
    { key: 'property.created', label: 'Imóvel Criado' },
    { key: 'property.updated', label: 'Imóvel Atualizado' }
  ];

  const toggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === id ? { ...webhook, active: !webhook.active } : webhook
    ));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
    toast({
      title: "Webhook removido",
      description: "O webhook foi removido com sucesso.",
    });
  };

  const toggleEventSelection = (eventKey: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventKey)
        ? prev.events.filter(e => e !== eventKey)
        : [...prev.events, eventKey]
    }));
  };

  const addWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e selecione pelo menos um evento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const webhook: WebhookConfig = {
        id: Date.now().toString(),
        ...newWebhook,
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`
      };

      setWebhooks(prev => [...prev, webhook]);
      setNewWebhook({ name: '', url: '', events: [], active: true });
      
      toast({
        title: "Webhook adicionado",
        description: "O webhook foi configurado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o webhook.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret || ''
        },
        body: JSON.stringify({
          event: 'webhook.test',
          data: {
            message: 'This is a test webhook',
            timestamp: new Date().toISOString()
          }
        })
      });

      toast({
        title: "Teste enviado",
        description: "O webhook de teste foi enviado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar o webhook de teste.",
        variant: "destructive",
      });
    }
  };

  const toggleSecretVisibility = (webhookId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }));
  };

  // Convert role for DashboardLayout compatibility
  const dashboardRole = profile?.role === 'super_admin' ? 'admin' : (profile?.role || 'admin');

  return (
    <DashboardLayout title="Configurações de Webhook" userRole={dashboardRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Webhook</h1>
          <p className="text-muted-foreground">Configure webhooks para receber notificações em tempo real</p>
        </div>

        {/* Add New Webhook */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhookName">Nome do Webhook *</Label>
                <Input
                  id="webhookName"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Notificações de Lead"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook *</Label>
                <Input
                  id="webhookUrl"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/endpoint"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableEvents.map((event) => (
                  <div
                    key={event.key}
                    onClick={() => toggleEventSelection(event.key)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      newWebhook.events.includes(event.key)
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="text-sm font-medium">{event.label}</div>
                    <div className="text-xs text-muted-foreground">{event.key}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={addWebhook} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Adicionando...' : 'Adicionar Webhook'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Webhooks */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Webhooks Configurados</h2>
          
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.active ? "default" : "secondary"}>
                        {webhook.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm font-medium">URL: </span>
                        <span className="text-sm text-muted-foreground">{webhook.url}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">Secret: </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground font-mono">
                            {showSecrets[webhook.id] 
                              ? webhook.secret 
                              : '••••••••••••••••'
                            }
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">Eventos: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={() => toggleWebhookStatus(webhook.id)}
                      />
                      <span className="text-sm">Webhook ativo</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        className="ml-4"
                      >
                        Testar
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WebhookSettings;

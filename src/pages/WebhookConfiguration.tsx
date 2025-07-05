import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Webhook, AlertCircle, CheckCircle, Send } from 'lucide-react';

const WebhookConfiguration = () => {
  const { profile, loading } = useProfile();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchWebhookUrl();
    }
  }, [profile]);

  const fetchWebhookUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'external_webhook_url')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setWebhookUrl(data?.value || '');
    } catch (error: any) {
      console.error('Error fetching webhook URL:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração do webhook",
        variant: "destructive",
      });
    }
  };

  const saveWebhookUrl = async () => {
    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'external_webhook_url',
          value: webhookUrl.trim()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Configuração salva!",
        description: "URL do webhook foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Error saving webhook URL:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configuração: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "URL necessária",
        description: "Configure uma URL de webhook antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const testPayload = {
        event: 'webhook_test',
        user_id: profile?.id,
        data: {
          message: 'Este é um teste do webhook universal',
          timestamp: new Date().toISOString(),
          test: true
        },
        timestamp: new Date().toISOString(),
        source: 'webhook_configuration'
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setTestResult('success');
        toast({
          title: "Teste bem-sucedido!",
          description: "O webhook foi chamado com sucesso.",
        });
      } else {
        setTestResult('error');
        toast({
          title: "Teste falhou",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResult('error');
      console.error('Error testing webhook:', error);
      toast({
        title: "Erro no teste",
        description: `Erro ao testar webhook: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
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

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Configuração de Webhook" userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Configuração de Webhook Universal</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure um webhook externo para receber todas as ações do sistema
          </p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Webhook className="w-5 h-5" />
              <span>URL do Webhook</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">URL do Webhook Externo</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://webhook.site/unique-url"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                URL onde serão enviados todos os eventos do sistema (favoritos, cadastros, leads, etc.)
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={saveWebhookUrl} disabled={saveLoading}>
                {saveLoading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
              
              <Button 
                onClick={testWebhook} 
                variant="outline" 
                disabled={testLoading || !webhookUrl.trim()}
              >
                {testLoading ? (
                  'Testando...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Testar Webhook
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                testResult === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {testResult === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>
                  {testResult === 'success' 
                    ? 'Webhook testado com sucesso!' 
                    : 'Falha no teste do webhook. Verifique a URL e tente novamente.'
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                O webhook será chamado para os seguintes eventos:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Eventos de Usuário</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• <code>user_registered</code> - Novo usuário cadastrado</li>
                    <li>• <code>favorite_added</code> - Imóvel favoritado</li>
                    <li>• <code>favorite_removed</code> - Favorito removido</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Eventos de Propriedades</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• <code>property_viewed</code> - Imóvel visualizado</li>
                    <li>• <code>lead_created</code> - Lead gerado</li>
                    <li>• <code>visit_scheduled</code> - Visita agendada</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Eventos de Sistema</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• <code>chat_message</code> - Mensagem do chat</li>
                    <li>• <code>page_view</code> - Página visualizada</li>
                    <li>• <code>unique_visitor</code> - Visitante único</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payload Example */}
        <Card>
          <CardHeader>
            <CardTitle>Exemplo de Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              rows={12}
              className="font-mono text-sm"
              value={JSON.stringify({
                event: "favorite_added",
                user_id: "12345678-1234-1234-1234-123456789abc",
                data: {
                  property_id: "87654321-4321-4321-4321-cba987654321",
                  property_title: "Apartamento de 2 quartos na Barra da Tijuca",
                  timestamp: "2024-01-15T10:30:00Z"
                },
                timestamp: "2024-01-15T10:30:00Z",
                source: "favorites"
              }, null, 2)}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WebhookConfiguration;
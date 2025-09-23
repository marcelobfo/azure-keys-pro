
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import AIParametersSettings from '@/components/AIParametersSettings';
import KnowledgeBaseManager from '@/components/KnowledgeBaseManager';
import ApiKeyTester from '@/components/ApiKeyTester';

const AdminChatSettings = () => {
  const [config, setConfig] = useState<any>({});
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: chatConfig, isLoading } = useQuery({
    queryKey: ['chat-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('*')
        .eq('active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    }
  });

  // Sync fetched config into local state when it becomes available
  useEffect(() => {
    if (chatConfig) {
      setConfig(chatConfig);
    }
  }, [chatConfig]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      if (chatConfig?.id) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('chat_configurations')
          .update(configData)
          .eq('id', chatConfig.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('chat_configurations')
          .insert({ ...configData, active: true })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-configuration'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Configurações do Chat" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Carregando configurações...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações do Chat" userRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configurações do Chat</h1>
          <Button onClick={handleSave} disabled={saveConfigMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="ai-params">Parâmetros IA</TabsTrigger>
            <TabsTrigger value="knowledge-base">Base de Conhecimento</TabsTrigger>
            <TabsTrigger value="responses">Respostas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ai-chat"
                    checked={config.ai_chat_enabled || false}
                    onCheckedChange={(checked) => handleConfigChange('ai_chat_enabled', checked)}
                  />
                  <Label htmlFor="ai-chat">Ativar Chat com IA</Label>
                </div>

                <div className="space-y-2">
                  <Label>Provedor de IA</Label>
                  <Select
                    value={config.api_provider || 'gemini'}
                    onValueChange={(value) => handleConfigChange('api_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-instruction">Instruções do Sistema</Label>
                  <Textarea
                    id="system-instruction"
                    value={config.system_instruction || ''}
                    onChange={(e) => handleConfigChange('system_instruction', e.target.value)}
                    placeholder="Digite as instruções gerais para o assistente IA..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Nome da Empresa</Label>
                  <Input
                    id="company"
                    value={config.company || ''}
                    onChange={(e) => handleConfigChange('company', e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chave da API {config.api_provider === 'gemini' ? 'Gemini' : 'OpenAI'}</Label>
                  <Input
                    type="password"
                    value={config.api_key_encrypted || ''}
                    onChange={(e) => handleConfigChange('api_key_encrypted', e.target.value)}
                    placeholder={`Digite sua chave da API ${config.api_provider === 'gemini' ? 'Gemini' : 'OpenAI'}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.api_provider === 'gemini' ? 
                      'Obtenha sua chave em: https://aistudio.google.com/app/apikey' :
                      'Obtenha sua chave em: https://platform.openai.com/api-keys'
                    }
                  </p>
                  <ApiKeyTester 
                    provider={config.api_provider || 'openai'} 
                    apiKey={config.api_key_encrypted || ''} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-params">
            <AIParametersSettings
              config={config}
              onConfigChange={handleConfigChange}
            />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <KnowledgeBaseManager />
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Respostas Automáticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="welcome-message"
                    value={config.welcome_message || ''}
                    onChange={(e) => handleConfigChange('welcome_message', e.target.value)}
                    placeholder="Mensagem inicial quando o chat é iniciado..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offline-message">Mensagem Fora do Horário</Label>
                  <Textarea
                    id="offline-message"
                    value={config.offline_message || ''}
                    onChange={(e) => handleConfigChange('offline_message', e.target.value)}
                    placeholder="Mensagem quando fora do horário comercial..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-responses">Respostas Personalizadas (JSON)</Label>
                  <Textarea
                    id="custom-responses"
                    value={config.custom_responses || ''}
                    onChange={(e) => handleConfigChange('custom_responses', e.target.value)}
                    placeholder='{"palavra-chave": "resposta personalizada"}'
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato JSON com palavras-chave e suas respostas correspondentes.
                </p>
                <ApiKeyTester 
                  provider={config.api_provider || 'openai'} 
                  apiKey={config.api_key_encrypted || ''} 
                />
              </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminChatSettings;

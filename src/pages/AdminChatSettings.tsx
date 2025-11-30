
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
import { EvolutionApiSettings } from '@/components/EvolutionApiSettings';

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
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching chat config:', error);
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
      // Remove id from configData to avoid conflicts
      const { id, ...dataWithoutId } = configData;
      
      if (chatConfig?.id) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('chat_configurations')
          .update(dataWithoutId)
          .eq('id', chatConfig.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Create new configuration - first deactivate any existing
        await supabase
          .from('chat_configurations')
          .update({ active: false })
          .eq('active', true);
          
        // Then create new one
        const { data, error } = await supabase
          .from('chat_configurations')
          .insert({ ...dataWithoutId, active: true })
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
    // Garantir que company sempre tenha um valor
    const configToSave = {
      ...config,
      company: config.company || 'Minha Imobiliária'
    };
    saveConfigMutation.mutate(configToSave);
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="ai-params">Parâmetros IA</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="evolution">Evolution API</TabsTrigger>
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
                  <Label htmlFor="company">Nome da Empresa *</Label>
                  <Input
                    id="company"
                    value={config.company || ''}
                    onChange={(e) => handleConfigChange('company', e.target.value)}
                    placeholder="Nome da sua empresa"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Campo obrigatório
                  </p>
                </div>


                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold">Chaves de API</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Chave da API Gemini</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      value={config.gemini_api_key || ''}
                      onChange={(e) => handleConfigChange('gemini_api_key', e.target.value)}
                      placeholder="Digite sua chave da API Gemini"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha sua chave em: https://aistudio.google.com/app/apikey
                    </p>
                    {config.gemini_api_key && (
                      <ApiKeyTester 
                        provider="gemini" 
                        apiKey={config.gemini_api_key} 
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={config.openai_api_key || ''}
                      onChange={(e) => handleConfigChange('openai_api_key', e.target.value)}
                      placeholder="Digite sua chave da API OpenAI"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha sua chave em: https://platform.openai.com/api-keys
                    </p>
                    {config.openai_api_key && (
                      <ApiKeyTester 
                        provider="openai" 
                        apiKey={config.openai_api_key} 
                      />
                    )}
                  </div>
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

          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Botão WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp-enabled"
                    checked={config.whatsapp_enabled || false}
                    onCheckedChange={(checked) => handleConfigChange('whatsapp_enabled', checked)}
                  />
                  <Label htmlFor="whatsapp-enabled">Ativar Botão Flutuante do WhatsApp</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    placeholder="5511999999999"
                    value={config.whatsapp_number || ''}
                    onChange={(e) => handleConfigChange('whatsapp_number', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_position">Posição do Botão</Label>
                  <Select
                    value={config.whatsapp_position || 'left'}
                    onValueChange={(value) => handleConfigChange('whatsapp_position', value)}
                  >
                    <SelectTrigger id="whatsapp_position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_icon_url">URL do Ícone Customizado</Label>
                  <Input
                    id="whatsapp_icon_url"
                    placeholder="https://exemplo.com/icone.webp"
                    value={config.whatsapp_icon_url || ''}
                    onChange={(e) => handleConfigChange('whatsapp_icon_url', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para usar o ícone padrão
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <EvolutionApiSettings 
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

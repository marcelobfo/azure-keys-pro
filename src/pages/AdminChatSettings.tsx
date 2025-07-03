
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface ChatConfig {
  id: string;
  company: string;
  ai_chat_enabled: boolean;
  whatsapp_enabled: boolean;
  api_provider: string;
  api_key_encrypted?: string;
  welcome_message?: string;
  whatsapp_number?: string;
  custom_responses: any;
}

const AdminChatSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    ai_chat_enabled: true,
    whatsapp_enabled: false,
    api_provider: 'openai',
    api_key: '',
    welcome_message: 'Olá! Como posso ajudá-lo hoje?',
    whatsapp_number: '',
  });

  useEffect(() => {
    fetchChatConfig();
  }, []);

  const fetchChatConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        setFormData({
          company: data.company || '',
          ai_chat_enabled: data.ai_chat_enabled || false,
          whatsapp_enabled: data.whatsapp_enabled || false,
          api_provider: data.api_provider || 'openai',
          api_key: '', // Não mostrar a chave por segurança
          welcome_message: data.welcome_message || 'Olá! Como posso ajudá-lo hoje?',
          whatsapp_number: data.whatsapp_number || '',
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveChatConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        company: formData.company,
        ai_chat_enabled: formData.ai_chat_enabled,
        whatsapp_enabled: formData.whatsapp_enabled,
        api_provider: formData.api_provider,
        welcome_message: formData.welcome_message,
        whatsapp_number: formData.whatsapp_number,
        ...(formData.api_key && { api_key_encrypted: btoa(formData.api_key) }), // Simples encoding
        active: true,
      };

      if (config) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('chat_configurations')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('chat_configurations')
          .insert(configData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações do chat salvas com sucesso",
      });

      fetchChatConfig();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Configurações do Chat</h2>
          <p className="text-muted-foreground">Configure o chat com IA e integração WhatsApp</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company">Nome da Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Ex: Imobiliária XYZ"
                />
              </div>
              
              <div>
                <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcome"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({...formData, welcome_message: e.target.value})}
                  placeholder="Digite a mensagem que será exibida quando o chat iniciar"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat com IA</CardTitle>
              <CardDescription>
                Configure o assistente virtual com IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai-chat"
                  checked={formData.ai_chat_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, ai_chat_enabled: checked})}
                />
                <Label htmlFor="ai-chat">Habilitar Chat com IA</Label>
              </div>

              {formData.ai_chat_enabled && (
                <>
                  <div>
                    <Label htmlFor="provider">Provedor de IA</Label>
                    <Select
                      value={formData.api_provider}
                      onValueChange={(value) => setFormData({...formData, api_provider: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="api-key">Chave da API</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      placeholder="Insira sua chave da API"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deixe em branco para manter a chave atual
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>
                Configure redirecionamento para WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp"
                  checked={formData.whatsapp_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, whatsapp_enabled: checked})}
                />
                <Label htmlFor="whatsapp">Habilitar WhatsApp</Label>
              </div>

              {formData.whatsapp_enabled && (
                <div>
                  <Label htmlFor="whatsapp-number">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp-number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
                    placeholder="Ex: 5511999999999"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite apenas números (com código do país)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveChatConfig} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminChatSettings;

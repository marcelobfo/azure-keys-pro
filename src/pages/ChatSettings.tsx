import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';

const ChatSettings = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    api_provider: 'openai',
    api_key: '',
    welcome_message: 'Olá! Como posso ajudá-lo hoje?',
    active: true,
    custom_responses: {
      greeting: 'Olá! Bem-vindo à nossa imobiliária!',
      contact_info: 'Para entrar em contato, ligue para (11) 99999-9999 ou envie um email para contato@imobiliaria.com',
      business_hours: 'Funcionamos de segunda a sexta das 8h às 18h, e sábados das 8h às 12h.'
    }
  });

  useEffect(() => {
    if (user && profile?.company_id) {
      fetchChatConfig();
    }
  }, [user, profile]);

  const fetchChatConfig = async () => {
    try {
      // Simular busca de configuração - em produção seria do banco
      console.log('Buscando configuração do chat para company_id:', profile?.company_id);
      
      // Para agora, mantém os valores padrão
      setFormData({
        api_provider: 'openai',
        api_key: '',
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
        active: true,
        custom_responses: {
          greeting: 'Olá! Bem-vindo à nossa imobiliária!',
          contact_info: 'Para entrar em contato, ligue para (11) 99999-9999 ou envie um email para contato@imobiliaria.com',
          business_hours: 'Funcionamos de segunda a sexta das 8h às 18h, e sábados das 8h às 12h.'
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const configData = {
        company_id: profile?.company_id,
        api_provider: formData.api_provider,
        api_key_encrypted: formData.api_key, // Em produção, criptografar
        welcome_message: formData.welcome_message,
        active: formData.active,
        custom_responses: formData.custom_responses
      };

      // Simular salvamento - em produção seria salvo no banco
      console.log('Salvando configuração do chat:', configData);

      toast({
        title: "Sucesso!",
        description: "Configurações do chat salvas com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configuração: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomResponseChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [key]: value
      }
    }));
  };

  // Get role for DashboardLayout - convert super_admin to admin for compatibility
  const dashboardRole = profile?.role === 'super_admin' ? 'admin' : (profile?.role || 'user');

  return (
    <DashboardLayout title="Configurações do Chat" userRole={dashboardRole}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Integração</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_provider">Provedor de IA</Label>
                  <Select value={formData.api_provider} onValueChange={(value) => handleChange('api_provider', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="api_key">Chave da API</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => handleChange('api_key', e.target.value)}
                    placeholder="Digite sua chave da API"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={formData.active}
                  onCheckedChange={(checked) => handleChange('active', checked)}
                />
                <Label>Chat ativo</Label>
              </div>

              <div>
                <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => handleChange('welcome_message', e.target.value)}
                  placeholder="Digite a mensagem de boas-vindas do chat"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Respostas Personalizadas</h3>
                
                <div>
                  <Label htmlFor="greeting">Saudação</Label>
                  <Textarea
                    id="greeting"
                    value={formData.custom_responses.greeting}
                    onChange={(e) => handleCustomResponseChange('greeting', e.target.value)}
                    placeholder="Mensagem de saudação"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_info">Informações de Contato</Label>
                  <Textarea
                    id="contact_info"
                    value={formData.custom_responses.contact_info}
                    onChange={(e) => handleCustomResponseChange('contact_info', e.target.value)}
                    placeholder="Como entrar em contato"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="business_hours">Horário de Funcionamento</Label>
                  <Textarea
                    id="business_hours"
                    value={formData.custom_responses.business_hours}
                    onChange={(e) => handleCustomResponseChange('business_hours', e.target.value)}
                    placeholder="Horários de atendimento"
                    rows={2}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste do Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Teste como o chat funcionará com as configurações atuais.
            </p>
            <Button variant="outline">
              Testar Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChatSettings;

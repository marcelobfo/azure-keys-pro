import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Bot, Phone, Settings, Users, BarChart3, Save, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useChatConfiguration } from '@/hooks/useChatConfiguration';
import { Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AdminChatSettings = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { configuration, loading: configLoading, updateField } = useChatConfiguration();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState({
    whatsapp_number: '',
    welcome_message: '',
    system_instruction: ''
  });

  // Atualizar estado local quando configuração carrega
  React.useEffect(() => {
    if (configuration) {
      setLocalConfig({
        whatsapp_number: configuration.whatsapp_number || '',
        welcome_message: configuration.welcome_message || '',
        system_instruction: configuration.system_instruction || ''
      });
    }
  }, [configuration]);

  const loading = profileLoading || configLoading;

  if (loading) {
    return (
      <DashboardLayout title="Configurações do Chat" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="Configurações do Chat" userRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Configurações do Sistema de Chat
          </h2>
          <p className="text-blue-100">
            Configure o chat ao vivo, IA e funcionalidades de atendimento.
          </p>
        </div>

        {/* Chat Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Chat Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat Ao Vivo
              </CardTitle>
              <CardDescription>
                Configure o sistema de chat em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Chat Habilitado</p>
                  <p className="text-sm text-muted-foreground">Ativar chat ao vivo no site</p>
                </div>
                <Switch 
                  checked={configuration?.active || false}
                  onCheckedChange={(checked) => updateField('active', checked)}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="welcome_message"
                    value={localConfig.welcome_message}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                    onBlur={() => updateField('welcome_message', localConfig.welcome_message)}
                    placeholder="Digite a mensagem de boas-vindas..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="chat_avatar">Avatar do Atendente</Label>
                  <Input
                    id="chat_avatar"
                    value={configuration?.custom_responses?.chat_avatar || ''}
                    onChange={(e) => updateField('custom_responses', {
                      ...configuration?.custom_responses,
                      chat_avatar: e.target.value
                    })}
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL da imagem do avatar que aparecerá no chat
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Horário de Funcionamento</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="horario_inicio" className="text-sm">Início</Label>
                      <Input
                        id="horario_inicio"
                        type="time"
                        value={configuration?.custom_responses?.horario_inicio || '08:00'}
                        onChange={(e) => updateField('custom_responses', {
                          ...configuration?.custom_responses,
                          horario_inicio: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_fim" className="text-sm">Fim</Label>
                      <Input
                        id="horario_fim"
                        type="time"
                        value={configuration?.custom_responses?.horario_fim || '18:00'}
                        onChange={(e) => updateField('custom_responses', {
                          ...configuration?.custom_responses,
                          horario_fim: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chat ficará disponível apenas neste horário
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status Atual</p>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const now = new Date();
                        const inicio = configuration?.custom_responses?.horario_inicio || '08:00';
                        const fim = configuration?.custom_responses?.horario_fim || '18:00';
                        const horaAtual = now.toTimeString().slice(0, 5);
                        const dentroHorario = horaAtual >= inicio && horaAtual <= fim;
                        return dentroHorario ? 'Horário de funcionamento' : 'Fora do horário';
                      })()}
                    </p>
                  </div>
                  <Badge variant={(() => {
                    const now = new Date();
                    const inicio = configuration?.custom_responses?.horario_inicio || '08:00';
                    const fim = configuration?.custom_responses?.horario_fim || '18:00';
                    const horaAtual = now.toTimeString().slice(0, 5);
                    const dentroHorario = horaAtual >= inicio && horaAtual <= fim;
                    return dentroHorario ? 'default' : 'secondary';
                  })()}>
                    {(() => {
                      const now = new Date();
                      const inicio = configuration?.custom_responses?.horario_inicio || '08:00';
                      const fim = configuration?.custom_responses?.horario_fim || '18:00';
                      const horaAtual = now.toTimeString().slice(0, 5);
                      const dentroHorario = horaAtual >= inicio && horaAtual <= fim;
                      return dentroHorario ? 'Aberto' : 'Fechado';
                    })()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Chat Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chat com IA
              </CardTitle>
              <CardDescription>
                Configure o assistente virtual inteligente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">IA Habilitada</p>
                  <p className="text-sm text-muted-foreground">Ativar respostas automáticas</p>
                </div>
                <Switch 
                  checked={configuration?.ai_chat_enabled || false}
                  onCheckedChange={(checked) => updateField('ai_chat_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Provedor</p>
                  <p className="text-sm text-muted-foreground">OpenAI GPT ou Google Gemini</p>
                </div>
                <Badge>{configuration?.api_provider || 'OpenAI'}</Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_instruction">Instrução do Sistema</Label>
                <Textarea
                  id="system_instruction"
                  value={localConfig.system_instruction}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, system_instruction: e.target.value }))}
                  onBlur={() => updateField('system_instruction', localConfig.system_instruction)}
                  placeholder="Digite as instruções para a IA..."
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/admin/ai-config')}
              >
                <Bot className="h-4 w-4 mr-2" />
                Configurar IA Avançado
              </Button>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Integração WhatsApp
              </CardTitle>
              <CardDescription>
                Configure a integração com WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">WhatsApp Habilitado</p>
                  <p className="text-sm text-muted-foreground">Redirecionar para WhatsApp</p>
                </div>
                <Switch 
                  checked={configuration?.whatsapp_enabled || false}
                  onCheckedChange={(checked) => updateField('whatsapp_enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                <Input
                  id="whatsapp_number"
                  value={localConfig.whatsapp_number}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  onBlur={() => updateField('whatsapp_number', localConfig.whatsapp_number)}
                  placeholder="+55 47 91234-5678"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {configuration?.whatsapp_number ? 'Configurado' : 'Pendente'}
                  </p>
                </div>
                <Badge variant={configuration?.whatsapp_number ? "default" : "secondary"}>
                  {configuration?.whatsapp_number ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/admin/whatsapp-config')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Configurar WhatsApp Avançado
              </Button>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe de Atendimento
              </CardTitle>
              <CardDescription>
                Gerencie atendentes e disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Atendentes Ativos</p>
                  <p className="text-sm text-muted-foreground">Corretores habilitados</p>
                </div>
                <Badge>2</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Online Agora</p>
                  <p className="text-sm text-muted-foreground">Disponíveis para chat</p>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Distribuição Automática</p>
                  <p className="text-sm text-muted-foreground">Chats distribuídos por disponibilidade</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/admin/team-management')}
              >
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Equipe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="h-16" 
            variant="outline"
            onClick={() => navigate('/admin/advanced-settings')}
          >
            <div className="text-center">
              <Settings className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Configurações Avançadas</p>
            </div>
          </Button>
          
          <Button 
            className="h-16" 
            variant="outline"
            onClick={() => navigate('/admin/chat-reports')}
          >
            <div className="text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Relatórios de Chat</p>
            </div>
          </Button>
          
          <Button 
            className="h-16" 
            variant="outline"
            onClick={() => navigate('/atendimento')}
          >
            <div className="text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Acessar Atendimento</p>
            </div>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminChatSettings;
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bot, Phone, Settings, Users, BarChart3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';

const AdminChatSettings = () => {
  const { profile, loading } = useProfile();

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
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações em Tempo Real</p>
                  <p className="text-sm text-muted-foreground">Alertas para novos chats</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Horário de Funcionamento</p>
                  <p className="text-sm text-muted-foreground">24/7 ou horário comercial</p>
                </div>
                <Badge variant="secondary">24/7</Badge>
              </div>

              <Button className="w-full" variant="outline">
                Configurar Horários
              </Button>
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
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Provedor</p>
                  <p className="text-sm text-muted-foreground">OpenAI GPT ou Google Gemini</p>
                </div>
                <Badge>OpenAI</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conhecimento do Site</p>
                  <p className="text-sm text-muted-foreground">IA treinada com dados do site</p>
                </div>
                <Badge variant="secondary">Ativo</Badge>
              </div>

              <Button className="w-full" variant="outline">
                Configurar IA
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
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Número Configurado</p>
                  <p className="text-sm text-muted-foreground">+55 47 9164-8836</p>
                </div>
                <Badge variant="secondary">Ativo</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mensagem Automática</p>
                  <p className="text-sm text-muted-foreground">Texto pré-definido</p>
                </div>
                <Badge>Configurado</Badge>
              </div>

              <Button className="w-full" variant="outline">
                Configurar WhatsApp
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

              <Button className="w-full" variant="outline">
                Gerenciar Equipe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-16" variant="outline">
            <div className="text-center">
              <Settings className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Configurações Avançadas</p>
            </div>
          </Button>
          
          <Button className="h-16" variant="outline">
            <div className="text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Relatórios de Chat</p>
            </div>
          </Button>
          
          <Button className="h-16" variant="outline">
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
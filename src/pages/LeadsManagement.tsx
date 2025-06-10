
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, User, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';

const LeadsManagement = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [leads] = useState([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      message: 'Tenho interesse na Casa Moderna no Centro',
      property: 'Casa Moderna no Centro',
      propertyId: '1',
      status: 'new',
      created_at: '2024-01-15T10:30:00Z',
      source: 'website'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(21) 88888-8888',
      message: 'Gostaria de agendar uma visita ao apartamento',
      property: 'Apartamento Vista Mar',
      propertyId: '2',
      status: 'contacted',
      created_at: '2024-01-14T15:45:00Z',
      source: 'form'
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      email: 'pedro@email.com',
      phone: '(31) 77777-7777',
      message: 'Preciso de mais informações sobre financiamento',
      property: 'Casa Moderna no Centro',
      propertyId: '1',
      status: 'qualified',
      created_at: '2024-01-13T09:15:00Z',
      source: 'chat'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">Novo</Badge>;
      case 'contacted':
        return <Badge variant="secondary">Contatado</Badge>;
      case 'qualified':
        return <Badge>Qualificado</Badge>;
      case 'converted':
        return <Badge variant="outline">Convertido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website':
        return <Eye className="h-4 w-4" />;
      case 'form':
        return <MessageSquare className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Gerenciar Leads" userRole={profile?.role || 'user'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Leads</h2>
            <p className="text-muted-foreground">Acompanhe e gerencie seus leads de imóveis</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.filter(l => l.status === 'new').length}</div>
              <p className="text-sm text-muted-foreground">Novos Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.filter(l => l.status === 'qualified').length}</div>
              <p className="text-sm text-muted-foreground">Qualificados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">25%</div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{lead.name}</h3>
                      {getStatusBadge(lead.status)}
                      <div className="flex items-center text-sm text-muted-foreground">
                        {getSourceIcon(lead.source)}
                        <span className="ml-1 capitalize">{lead.source}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          {lead.email}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Phone className="h-4 w-4 mr-2" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(lead.created_at)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Imóvel de Interesse:</p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600"
                          onClick={() => navigate(`/property/${lead.propertyId}`)}
                        >
                          {lead.property}
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Mensagem:</p>
                      <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded">
                        {lead.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Responder
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Visita
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

export default LeadsManagement;

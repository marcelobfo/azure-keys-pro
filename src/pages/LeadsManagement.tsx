import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, Calendar, MessageSquare, Search, Filter, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLeads, Lead } from '@/hooks/useLeads';
import DashboardLayout from '@/components/DashboardLayout';
import EditLeadDialog from '@/components/EditLeadDialog';
import LeadsBulkActions from '@/components/LeadsBulkActions';
import CreateLeadDialog from '@/components/CreateLeadDialog';

const LeadsManagement = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { leads, loading, updateLeadStatus, updateLead, deleteLead, fetchLeads } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      await deleteLead(leadId);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleBulkUpdate = async (leadIds: string[], updates: Partial<Lead>) => {
    try {
      for (const leadId of leadIds) {
        await updateLead(leadId, updates);
      }
    } catch (error) {
      console.error('Erro na atualização em massa:', error);
      throw error;
    }
  };

  const handleBulkDelete = async (leadIds: string[]) => {
    try {
      for (const leadId of leadIds) {
        await deleteLead(leadId);
      }
    } catch (error) {
      console.error('Erro na exclusão em massa:', error);
      throw error;
    }
  };

  // Ajustando badges para "Convertido" (roxo/branco) e "Perdido" (vermelho)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">Novo</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-500">Contatado</Badge>;
      case 'qualified':
        return <Badge className="bg-green-600 text-white">Qualificado</Badge>;
      case 'converted':
        return <Badge className="bg-purple-600 text-white">Convertido</Badge>;
      case 'lost':
        return <Badge variant="destructive">Perdido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Este lead não possui telefone cadastrado",
        variant: "destructive",
      });
    }
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Este lead não possui telefone cadastrado",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout title="Gerenciar Leads" userRole={dashboardRole}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gerenciar Leads" userRole={dashboardRole}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciar Leads
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Gerencie todos os leads e oportunidades
            </p>
          </div>
          <CreateLeadDialog onLeadCreated={fetchLeads} />
        </div>

        <LeadsBulkActions
          selectedLeads={selectedLeads}
          onClearSelection={() => setSelectedLeads([])}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onImportComplete={fetchLeads}
          allLeads={leads}
        />

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="contacted">Contatado</SelectItem>
              <SelectItem value="qualified">Qualificado</SelectItem>
              <SelectItem value="converted">Convertido</SelectItem>
              <SelectItem value="lost">Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.filter(l => l.status === 'new').length}</div>
              <p className="text-sm text-muted-foreground">Novos</p>
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
              <div className="text-2xl font-bold">{leads.filter(l => l.status === 'converted').length}</div>
              <p className="text-sm text-muted-foreground">Convertidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum lead encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Não há leads cadastrados no sistema ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{lead.name}</h3>
                          {getStatusBadge(lead.status)}
                        </div>
                      
                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {lead.phone}
                          </p>
                        )}
                        {lead.properties?.title && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Imóvel:</strong> {lead.properties.title}
                          </p>
                        )}
                        {lead.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Mensagem:</strong> {lead.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')} às {new Date(lead.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-2 lg:ml-4">
                      {/* Corrigir as opções do Select para garantir que "Convertido" e "Perdido" estão corretas */}
                      <Select value={lead.status} onValueChange={(value) => {
                        console.log('MUDANDO STATUS PARA:', value);
                        updateLeadStatus(lead.id, value);
                      }}>
                        <SelectTrigger className="w-full lg:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <EditLeadDialog
                          lead={lead}
                          onSave={updateLead}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(lead.phone || '')}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmail(lead.email)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWhatsApp(lead.phone || '')}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeadsManagement;

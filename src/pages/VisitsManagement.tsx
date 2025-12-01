
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, Mail, Eye, X, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Visit {
  id: string;
  property_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  visit_date: string;
  visit_time: string;
  notes: string;
  status: string;
  created_at: string;
  properties?: {
    title: string;
  };
}

const VisitsManagement = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          properties (
            title
          )
        `)
        .order('visit_date', { ascending: true });

      if (error) {
        throw error;
      }

      setVisits(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar visitas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ status: newStatus })
        .eq('id', visitId);

      if (error) {
        throw error;
      }

      setVisits(prev => prev.map(visit => 
        visit.id === visitId ? { ...visit, status: newStatus } : visit
      ));

      toast({
        title: "Status atualizado",
        description: "Status da visita foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da visita",
        variant: "destructive",
      });
    }
  };

  const deleteVisit = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);

      if (error) {
        throw error;
      }

      setVisits(prev => prev.filter(visit => visit.id !== visitId));

      toast({
        title: "Visita excluída",
        description: "Visita foi excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir visita:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir visita",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default">Agendada</Badge>;
      case 'completed':
        return <Badge variant="secondary">Realizada</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelada</Badge>;
      case 'no_show':
        return <Badge variant="destructive">Não Compareceu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  const isToday = (date: string) => {
    const today = new Date().toDateString();
    const visitDate = new Date(date).toDateString();
    return today === visitDate;
  };

  const isTomorrow = (date: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const visitDate = new Date(date).toDateString();
    return tomorrow.toDateString() === visitDate;
  };

  const dashboardRole = profile?.role === 'master' ? 'admin' : (profile?.role || 'user');

  if (loading) {
    return (
      <DashboardLayout title="Gerenciar Visitas" userRole={dashboardRole}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gerenciar Visitas" userRole={dashboardRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Visitas</h2>
            <p className="text-muted-foreground">Acompanhe e gerencie suas visitas agendadas</p>
          </div>
          <Button onClick={() => navigate('/schedule-visit')}>
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Nova Visita
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{visits.length}</div>
              <p className="text-sm text-muted-foreground">Visitas Agendadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{visits.filter(v => isToday(v.visit_date)).length}</div>
              <p className="text-sm text-muted-foreground">Visitas Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{visits.filter(v => isTomorrow(v.visit_date)).length}</div>
              <p className="text-sm text-muted-foreground">Visitas Amanhã</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{visits.filter(v => v.status === 'completed').length}</div>
              <p className="text-sm text-muted-foreground">Visitas Realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Visits List */}
        <div className="space-y-4">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma visita agendada
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Não há visitas agendadas no momento.
                </p>
                <Button onClick={() => navigate('/schedule-visit')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Primera Visita
                </Button>
              </CardContent>
            </Card>
          ) : (
            visits.map((visit) => (
              <Card key={visit.id} className={isToday(visit.visit_date) ? 'border-red-200 bg-red-50 dark:bg-red-950' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {visit.properties?.title || `Propriedade ${visit.property_id}`}
                        </h3>
                        {getStatusBadge(visit.status)}
                        {isToday(visit.visit_date) && (
                          <Badge variant="destructive">Hoje</Badge>
                        )}
                        {isTomorrow(visit.visit_date) && (
                          <Badge variant="default">Amanhã</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(visit.visit_date)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4 mr-2" />
                            {visit.visit_time}
                          </div>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => navigate(`/property/${visit.property_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Imóvel
                          </Button>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-muted-foreground mb-1">
                            <User className="h-4 w-4 mr-2" />
                            {visit.client_name}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-1">
                            <Mail className="h-4 w-4 mr-2" />
                            {visit.client_email}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            {visit.client_phone}
                          </div>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-1">Observações:</p>
                          <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-slate-800 p-3 rounded">
                            {visit.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateVisitStatus(visit.id, 'completed')}
                          disabled={visit.status === 'completed'}
                        >
                          Marcar como Realizada
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateVisitStatus(visit.id, 'cancelled')}
                          disabled={visit.status === 'cancelled'}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteVisit(visit.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Excluir
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

export default VisitsManagement;

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, Mail, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';

const VisitsManagement = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [visits] = useState([
    {
      id: '1',
      propertyTitle: 'Casa Moderna no Centro',
      propertyId: '1',
      clientName: 'João Silva',
      clientEmail: 'joao@email.com',
      clientPhone: '(11) 99999-9999',
      date: '2024-01-16',
      time: '14:30',
      status: 'scheduled',
      notes: 'Cliente interessado em financiamento'
    },
    {
      id: '2',
      propertyTitle: 'Apartamento Vista Mar',
      propertyId: '2',
      clientName: 'Maria Santos',
      clientEmail: 'maria@email.com',
      clientPhone: '(21) 88888-8888',
      date: '2024-01-17',
      time: '10:00',
      status: 'scheduled',
      notes: 'Primeira visita, casal jovem'
    },
    {
      id: '3',
      propertyTitle: 'Casa Moderna no Centro',
      propertyId: '1',
      clientName: 'Pedro Oliveira',
      clientEmail: 'pedro@email.com',
      clientPhone: '(31) 77777-7777',
      date: '2024-01-18',
      time: '16:00',
      status: 'scheduled',
      notes: 'Cliente tem pressa para decidir'
    }
  ]);

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

  const dashboardRole = profile?.role === 'super_admin' ? 'admin' : (profile?.role || 'user');

  return (
    <DashboardLayout title="Gerenciar Visitas" userRole={dashboardRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Visitas</h2>
            <p className="text-muted-foreground">Acompanhe e gerencie suas visitas agendadas</p>
          </div>
          <Button>
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
              <div className="text-2xl font-bold">{visits.filter(v => isToday(v.date)).length}</div>
              <p className="text-sm text-muted-foreground">Visitas Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{visits.filter(v => isTomorrow(v.date)).length}</div>
              <p className="text-sm text-muted-foreground">Visitas Amanhã</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">85%</div>
              <p className="text-sm text-muted-foreground">Taxa de Comparecimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Visits List */}
        <div className="space-y-4">
          {visits.map((visit) => (
            <Card key={visit.id} className={isToday(visit.date) ? 'border-red-200 bg-red-50 dark:bg-red-950' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                      {getStatusBadge(visit.status)}
                      {isToday(visit.date) && (
                        <Badge variant="destructive">Hoje</Badge>
                      )}
                      {isTomorrow(visit.date) && (
                        <Badge variant="default">Amanhã</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(visit.date)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4 mr-2" />
                          {visit.time}
                        </div>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600"
                          onClick={() => navigate(`/property/${visit.propertyId}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Imóvel
                        </Button>
                      </div>
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <User className="h-4 w-4 mr-2" />
                          {visit.clientName}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          {visit.clientEmail}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {visit.clientPhone}
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
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar para Cliente
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Reagendar
                      </Button>
                      <Button variant="destructive" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
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

export default VisitsManagement;

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  FileText,
  RefreshCw
} from 'lucide-react';

const AdminProtocols = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    tickets,
    loading,
    fetchTickets,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket
  } = useTickets();

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned_to: 'unassigned',
    search: '',
    date_from: '',
    date_to: ''
  });

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assigned_to: ''
  });

  // Available team members for assignment (in a real app, this would come from an API)
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    // Load team members
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // This would typically be a separate API call
      // For now, we'll use a mock approach
      setTeamMembers([
        { id: '1', full_name: 'Admin User', avatar_url: null },
        { id: '2', full_name: 'João Silva', avatar_url: null },
        { id: '3', full_name: 'Maria Santos', avatar_url: null }
      ]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Convert special values back to empty strings for the filter logic
    const filterValue = value === 'all' || value === 'unassigned' ? '' : value;
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(prev => ({ ...prev, [key]: value })); // Keep original value for UI
    fetchTickets(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: 'all',
      priority: 'all', 
      assigned_to: 'unassigned',
      search: '',
      date_from: '',
      date_to: ''
    };
    setFilters(clearedFilters);
    // Convert to empty strings for the actual filter logic
    const apiFilters = {
      status: '',
      priority: '',
      assigned_to: '',
      search: '',
      date_from: '',
      date_to: ''
    };
    fetchTickets(apiFilters);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    };

    const labels: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      urgent: 'destructive'
    };

    const labels: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };

    return (
      <Badge variant={variants[priority] || 'outline'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const openTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDetailsOpen(true);
  };

  const openEditDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setEditForm({
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedTicket) return;

    try {
      const promises = [];

      if (editForm.status !== selectedTicket.status) {
        promises.push(updateTicketStatus(selectedTicket.id, editForm.status as any));
      }

      if (editForm.priority !== selectedTicket.priority) {
        promises.push(updateTicketPriority(selectedTicket.id, editForm.priority as any));
      }

      if (editForm.assigned_to !== (selectedTicket.assigned_to || '')) {
        promises.push(assignTicket(selectedTicket.id, editForm.assigned_to || undefined));
      }

      await Promise.all(promises);

      setIsEditDialogOpen(false);
      fetchTickets(filters);

      toast({
        title: 'Sucesso',
        description: 'Ticket atualizado com sucesso',
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  return (
    <DashboardLayout title="Gestão de Protocolos" userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Protocolos de Atendimento</h1>
            <p className="text-muted-foreground">
              Gerencie todos os tickets de suporte do sistema
            </p>
          </div>
          <Button onClick={() => fetchTickets(filters)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar por Protocolo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Ex: 2025000001"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono">
                          {ticket.protocol_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {ticket.lead?.name || 'N/A'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {ticket.lead?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-2">
                            {ticket.subject || 'Sem assunto'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(ticket.priority)}
                        </TableCell>
                        <TableCell>
                          {ticket.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                ID: {ticket.assigned_to}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Não atribuído
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTicketDetails(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(ticket)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details Sheet */}
        <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Detalhes do Ticket</SheetTitle>
              <SheetDescription>
                Informações completas do protocolo {selectedTicket?.protocol_number}
              </SheetDescription>
            </SheetHeader>
            
            {selectedTicket && (
              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <div className="mt-1">
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Cliente</Label>
                    <div className="mt-1">
                      <p className="font-medium">{selectedTicket.lead?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTicket.lead?.email}</p>
                      {selectedTicket.lead?.phone && (
                        <p className="text-sm text-muted-foreground">{selectedTicket.lead?.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Assunto</Label>
                    <p className="mt-1">{selectedTicket.subject || 'Sem assunto'}</p>
                  </div>

                  {selectedTicket.description && (
                    <div>
                      <Label>Descrição</Label>
                      <p className="mt-1 text-sm">{selectedTicket.description}</p>
                    </div>
                  )}

                  <div>
                    <Label>Responsável</Label>
                    <div className="mt-1">
                      {selectedTicket.assigned_to ? (
                        <span>ID: {selectedTicket.assigned_to}</span>
                      ) : (
                        <span className="text-muted-foreground">Não atribuído</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Criado em</Label>
                      <p className="mt-1 text-sm">{formatDate(selectedTicket.created_at)}</p>
                    </div>
                    <div>
                      <Label>Atualizado em</Label>
                      <p className="mt-1 text-sm">{formatDate(selectedTicket.updated_at)}</p>
                    </div>
                  </div>

                  {selectedTicket.resolved_at && (
                    <div>
                      <Label>Resolvido em</Label>
                      <p className="mt-1 text-sm">{formatDate(selectedTicket.resolved_at)}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={() => openEditDialog(selectedTicket)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Ticket</DialogTitle>
              <DialogDescription>
                Altere as informações do protocolo {selectedTicket?.protocol_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-assigned">Responsável</Label>
                <Select value={editForm.assigned_to} onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChanges}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminProtocols;
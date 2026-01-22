import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTenantContext } from '@/contexts/TenantContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/priceUtils';
import { DollarSign, Users, Clock, Edit, Check, User, FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Corretor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  default_rate: number;
  tenant_id: string | null;
}

interface Commission {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  corretor_id: string;
  sale_price: number;
  commission_rate: number;
  commission_value: number;
  status: string;
  sale_date: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  tenant_id: string | null;
  lead_name?: string;
  lead_email?: string;
  property_title?: string;
  corretor_name?: string;
}

const CommissionsPanel = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { selectedTenantId } = useTenantContext();
  const { toast } = useToast();

  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isEditRateOpen, setIsEditRateOpen] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  const [editRate, setEditRate] = useState('5');

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile, selectedTenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar corretores do tenant
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, phone, tenant_id')
        .eq('role', 'corretor');

      const { data: profilesData, error: profilesError } = selectedTenantId 
        ? await profilesQuery.eq('tenant_id', selectedTenantId)
        : await profilesQuery;

      if (profilesError) throw profilesError;

      // Buscar configurações de comissão
      const { data: settingsData } = await supabase
        .from('corretor_commission_settings')
        .select('*');

      // Combinar dados
      const corretoresWithRates = (profilesData || []).map(p => {
        const setting = settingsData?.find(s => s.corretor_id === p.id);
        return {
          ...p,
          default_rate: setting?.default_rate || 5
        };
      });

      setCorretores(corretoresWithRates);

      // Buscar comissões
      let commissionsQuery = supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedTenantId) {
        commissionsQuery = commissionsQuery.eq('tenant_id', selectedTenantId);
      }

      const { data: commissionsData, error: commissionsError } = await commissionsQuery;
      if (commissionsError) throw commissionsError;

      // Cast para acessar lead_id que foi adicionado via migration
      const commissionsRaw = commissionsData as unknown as Array<{
        id: string;
        lead_id: string | null;
        property_id: string | null;
        corretor_id: string;
        sale_price: number;
        commission_rate: number;
        commission_value: number | null;
        status: string;
        sale_date: string;
        payment_date: string | null;
        notes: string | null;
        created_at: string;
        tenant_id: string | null;
      }>;

      // Buscar leads e properties separadamente para enriquecer os dados
      const leadIds = (commissionsRaw || []).map(c => c.lead_id).filter(Boolean) as string[];
      const propertyIds = (commissionsRaw || []).map(c => c.property_id).filter(Boolean) as string[];

      let leadsMap: Record<string, { name: string; email: string }> = {};
      let propertiesMap: Record<string, { title: string }> = {};

      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, name, email')
          .in('id', leadIds);
        
        leadsData?.forEach(l => {
          leadsMap[l.id] = { name: l.name, email: l.email || '' };
        });
      }

      if (propertyIds.length > 0) {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('id, title')
          .in('id', propertyIds);
        
        propertiesData?.forEach(p => {
          propertiesMap[p.id] = { title: p.title };
        });
      }

      // Adicionar nomes aos dados
      const commissionsWithNames: Commission[] = (commissionsRaw || []).map(c => {
        const corretor = corretoresWithRates.find(cor => cor.id === c.corretor_id);
        const lead = c.lead_id ? leadsMap[c.lead_id] : null;
        const property = c.property_id ? propertiesMap[c.property_id] : null;
        
        return {
          id: c.id,
          lead_id: c.lead_id,
          property_id: c.property_id,
          corretor_id: c.corretor_id,
          sale_price: c.sale_price,
          commission_rate: c.commission_rate,
          commission_value: c.commission_value || 0,
          status: c.status,
          sale_date: c.sale_date,
          payment_date: c.payment_date,
          notes: c.notes,
          created_at: c.created_at,
          tenant_id: c.tenant_id,
          corretor_name: corretor?.full_name || 'Desconhecido',
          lead_name: lead?.name || undefined,
          lead_email: lead?.email || undefined,
          property_title: property?.title || undefined
        };
      });

      setCommissions(commissionsWithNames);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de comissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    if (!selectedCorretor) return;

    try {
      const { error } = await supabase
        .from('corretor_commission_settings')
        .upsert({
          corretor_id: selectedCorretor.id,
          default_rate: parseFloat(editRate),
          tenant_id: selectedTenantId
        }, { onConflict: 'corretor_id' });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Taxa de comissão atualizada'
      });

      setIsEditRateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar taxa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar taxa',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comissão marcada como paga'
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive'
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profileLoading || loading) {
    return (
      <DashboardLayout title="Painel de Comissões" userRole="master">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (profile?.role !== 'master' && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Cálculos de estatísticas
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_value || 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_value || 0), 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_value || 0), 0);

  return (
    <DashboardLayout title="Painel de Comissões" userRole={profile?.role || 'master'}>
      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Comissões Automáticas</AlertTitle>
          <AlertDescription>
            As comissões são geradas automaticamente quando um lead é convertido (status = "Convertido").
            Para gerar uma comissão, o lead precisa ter um corretor atribuído e um imóvel vinculado.
          </AlertDescription>
        </Alert>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total em Comissões</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCommissions)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-amber-500">{formatCurrency(pendingCommissions)}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(paidCommissions)}</p>
                </div>
                <Check className="h-8 w-8 text-emerald-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Corretores Ativos</p>
                  <p className="text-2xl font-bold">{corretores.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Corretores */}
        <Card>
          <CardHeader>
            <CardTitle>Corretores e Taxas</CardTitle>
            <CardDescription>Gerencie as taxas de comissão por corretor</CardDescription>
          </CardHeader>
          <CardContent>
            {corretores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum corretor encontrado neste tenant</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Taxa Padrão</TableHead>
                    <TableHead>Total Comissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corretores.map(corretor => {
                    const corretorCommissions = commissions.filter(c => c.corretor_id === corretor.id);
                    const totalCorretorCommissions = corretorCommissions.reduce((sum, c) => sum + (c.commission_value || 0), 0);
                    
                    return (
                      <TableRow key={corretor.id}>
                        <TableCell className="font-medium">{corretor.full_name}</TableCell>
                        <TableCell>{corretor.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{corretor.default_rate}%</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(totalCorretorCommissions)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCorretor(corretor);
                              setEditRate(String(corretor.default_rate));
                              setIsEditRateOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar Taxa
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Comissões */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
            <CardDescription>Comissões geradas a partir de leads convertidos</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma comissão registrada ainda</p>
                <p className="text-sm mt-2">Converta leads para gerar comissões automaticamente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Valor Venda</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map(commission => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {new Date(commission.sale_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {commission.lead_name ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{commission.lead_name}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{commission.lead_email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{commission.corretor_name}</TableCell>
                      <TableCell>
                        {commission.property_title ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help max-w-[150px] truncate">
                                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{commission.property_title}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{commission.property_title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(commission.sale_price)}</TableCell>
                      <TableCell>{commission.commission_rate}%</TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatCurrency(commission.commission_value)}
                      </TableCell>
                      <TableCell>
                        {commission.status === 'paid' ? (
                          <Badge className="bg-green-500">Pago</Badge>
                        ) : commission.status === 'cancelled' ? (
                          <Badge variant="destructive">Cancelado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(commission.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Marcar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog para editar taxa */}
        <Dialog open={isEditRateOpen} onOpenChange={setIsEditRateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Taxa de Comissão</DialogTitle>
              <DialogDescription>
                Alterar a taxa padrão de {selectedCorretor?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Nova Taxa (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRate}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CommissionsPanel;
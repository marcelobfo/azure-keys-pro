import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, maskCurrency, parseCurrency } from '@/utils/priceUtils';
import { DollarSign, Users, TrendingUp, Clock, Plus, Edit, Check, X } from 'lucide-react';

interface Corretor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  default_rate: number;
}

interface Commission {
  id: string;
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
  property_title?: string;
  corretor_name?: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
}

const CommissionsPanel = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isAddCommissionOpen, setIsAddCommissionOpen] = useState(false);
  const [isEditRateOpen, setIsEditRateOpen] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  
  // Form states
  const [newCommission, setNewCommission] = useState({
    corretor_id: '',
    property_id: '',
    sale_price: '',
    commission_rate: '5',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [editRate, setEditRate] = useState('5');

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar corretores
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('role', 'corretor');

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
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Adicionar nomes aos dados
      const commissionsWithNames = (commissionsData || []).map(c => {
        const corretor = corretoresWithRates.find(cor => cor.id === c.corretor_id);
        return {
          ...c,
          corretor_name: corretor?.full_name || 'Desconhecido'
        };
      });

      setCommissions(commissionsWithNames);

      // Buscar imóveis vendidos ou todos
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title, price')
        .order('title');

      setProperties(propertiesData || []);
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

  const handleAddCommission = async () => {
    try {
      const salePrice = parseCurrency(newCommission.sale_price);
      if (!newCommission.corretor_id || salePrice <= 0) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase.from('commissions').insert({
        corretor_id: newCommission.corretor_id,
        property_id: newCommission.property_id || null,
        sale_price: salePrice,
        commission_rate: parseFloat(newCommission.commission_rate),
        sale_date: newCommission.sale_date,
        notes: newCommission.notes || null
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comissão registrada com sucesso'
      });

      setIsAddCommissionOpen(false);
      setNewCommission({
        corretor_id: '',
        property_id: '',
        sale_price: '',
        commission_rate: '5',
        sale_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar comissão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao registrar comissão',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRate = async () => {
    if (!selectedCorretor) return;

    try {
      const { error } = await supabase
        .from('corretor_commission_settings')
        .upsert({
          corretor_id: selectedCorretor.id,
          default_rate: parseFloat(editRate)
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
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(paidCommissions)}</p>
                </div>
                <Check className="h-8 w-8 text-green-600 opacity-70" />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Corretores e Taxas</CardTitle>
              <CardDescription>Gerencie as taxas de comissão por corretor</CardDescription>
            </div>
            <Dialog open={isAddCommissionOpen} onOpenChange={setIsAddCommissionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Venda
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nova Venda</DialogTitle>
                  <DialogDescription>
                    Registre uma venda e calcule a comissão do corretor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Corretor *</Label>
                    <Select
                      value={newCommission.corretor_id}
                      onValueChange={(value) => {
                        const corretor = corretores.find(c => c.id === value);
                        setNewCommission(prev => ({
                          ...prev,
                          corretor_id: value,
                          commission_rate: String(corretor?.default_rate || 5)
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o corretor" />
                      </SelectTrigger>
                      <SelectContent>
                        {corretores.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name} ({c.default_rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Imóvel (opcional)</Label>
                    <Select
                      value={newCommission.property_id}
                      onValueChange={(value) => setNewCommission(prev => ({ ...prev, property_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Valor da Venda *</Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={newCommission.sale_price}
                      onChange={(e) => setNewCommission(prev => ({
                        ...prev,
                        sale_price: maskCurrency(e.target.value)
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Taxa de Comissão (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newCommission.commission_rate}
                      onChange={(e) => setNewCommission(prev => ({
                        ...prev,
                        commission_rate: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Data da Venda</Label>
                    <Input
                      type="date"
                      value={newCommission.sale_date}
                      onChange={(e) => setNewCommission(prev => ({
                        ...prev,
                        sale_date: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Input
                      placeholder="Observações sobre a venda..."
                      value={newCommission.notes}
                      onChange={(e) => setNewCommission(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </div>
                  
                  {newCommission.sale_price && newCommission.commission_rate && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Valor da Comissão:</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(parseCurrency(newCommission.sale_price) * parseFloat(newCommission.commission_rate) / 100)}
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCommissionOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddCommission}>
                    Registrar Venda
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Histórico de Comissões */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
            <CardDescription>Todas as vendas e comissões registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma comissão registrada ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Corretor</TableHead>
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
                      <TableCell className="font-medium">{commission.corretor_name}</TableCell>
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

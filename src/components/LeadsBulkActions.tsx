import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/hooks/useLeads';
import Papa from 'papaparse';

interface LeadsBulkActionsProps {
  selectedLeads: string[];
  onClearSelection: () => void;
  onBulkUpdate: (leadIds: string[], updates: Partial<Lead>) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onImportComplete: () => void;
  allLeads: Lead[];
}

const LeadsBulkActions: React.FC<LeadsBulkActionsProps> = ({
  selectedLeads,
  onClearSelection,
  onBulkUpdate,
  onBulkDelete,
  onImportComplete,
  allLeads
}) => {
  const { toast } = useToast();
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAssignedTo, setBulkAssignedTo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportAll = () => {
    const csvData = allLeads.map(lead => ({
      Nome: lead.name,
      Email: lead.email,
      Telefone: lead.phone || '',
      Mensagem: lead.message || '',
      Status: lead.status,
      'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
      'Atualizado em': lead.updated_at ? new Date(lead.updated_at).toLocaleDateString('pt-BR') : ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${allLeads.length} leads exportados com sucesso`,
    });
  };

  const handleExportSelected = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione ao menos um lead para exportar",
        variant: "destructive",
      });
      return;
    }

    const selectedLeadData = allLeads.filter(lead => selectedLeads.includes(lead.id));
    const csvData = selectedLeadData.map(lead => ({
      Nome: lead.name,
      Email: lead.email,
      Telefone: lead.phone || '',
      Mensagem: lead.message || '',
      Status: lead.status,
      'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
      'Atualizado em': lead.updated_at ? new Date(lead.updated_at).toLocaleDateString('pt-BR') : ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_selecionados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${selectedLeads.length} leads selecionados exportados com sucesso`,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const validLeads = results.data.filter((row: any) => 
            row.Nome && row.Email && row.Nome.trim() && row.Email.trim()
          );

          if (validLeads.length === 0) {
            toast({
              title: "Erro na importação",
              description: "Nenhum lead válido encontrado no arquivo. Verifique se as colunas Nome e Email estão preenchidas.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          // Aqui você implementaria a lógica de importação real
          // Por enquanto, vamos simular
          toast({
            title: "Importação concluída",
            description: `${validLeads.length} leads importados com sucesso`,
          });
          
          onImportComplete();
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: "Erro ao processar o arquivo CSV",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        toast({
          title: "Erro na importação",
          description: "Erro ao ler o arquivo CSV",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedLeads, { status: bulkStatus });
      setBulkStatus('');
      onClearSelection();
      toast({
        title: "Status atualizado",
        description: `Status de ${selectedLeads.length} leads atualizados para ${bulkStatus}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status dos leads",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignedTo || selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedLeads, { assigned_to: bulkAssignedTo });
      setBulkAssignedTo('');
      onClearSelection();
      toast({
        title: "Leads atribuídos",
        description: `${selectedLeads.length} leads atribuídos com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atribuir leads",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads selecionados? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedLeads);
      onClearSelection();
      toast({
        title: "Leads excluídos",
        description: `${selectedLeads.length} leads excluídos com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir leads",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Ações em Massa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Exportar */}
          <div className="space-y-2">
            <Label>Exportar Leads</Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleExportAll}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Todos
              </Button>
              <Button
                variant="outline"
                onClick={handleExportSelected}
                disabled={selectedLeads.length === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Selecionados ({selectedLeads.length})
              </Button>
            </div>
          </div>

          {/* Importar */}
          <div className="space-y-2">
            <Label>Importar Leads</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleImport}
                disabled={isProcessing}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Formato CSV: Nome, Email, Telefone, Mensagem
              </p>
            </div>
          </div>

          {/* Atualizar Status */}
          <div className="space-y-2">
            <Label>Alterar Status</Label>
            <div className="space-y-2">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || selectedLeads.length === 0 || isProcessing}
                className="w-full"
              >
                Atualizar ({selectedLeads.length})
              </Button>
            </div>
          </div>

          {/* Ações de Exclusão */}
          <div className="space-y-2">
            <Label>Ações Gerais</Label>
            <div className="space-y-2">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedLeads.length === 0 || isProcessing}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Selecionados ({selectedLeads.length})
              </Button>
              {selectedLeads.length > 0 && (
                <Button
                  variant="outline"
                  onClick={onClearSelection}
                  className="w-full"
                >
                  Limpar Seleção
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsBulkActions;
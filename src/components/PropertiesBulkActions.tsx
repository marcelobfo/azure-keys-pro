import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface Property {
  id: string;
  title: string;
  property_type: string;
  price: number;
  location: string;
  city: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  created_at: string;
}

interface PropertiesBulkActionsProps {
  properties: Property[];
  onImportComplete: () => void;
}

const PropertiesBulkActions: React.FC<PropertiesBulkActionsProps> = ({
  properties,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportProperties = () => {
    const csvData = properties.map(property => ({
      Título: property.title,
      Tipo: property.property_type,
      Preço: property.price,
      Localização: property.location,
      Cidade: property.city,
      'Área (m²)': property.area || '',
      Quartos: property.bedrooms || '',
      Lavabo: property.bathrooms || '',
      Status: property.status,
      'Criado em': new Date(property.created_at).toLocaleDateString('pt-BR')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `propriedades_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${properties.length} propriedades exportadas com sucesso`,
    });
  };

  const handleImportProperties = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const validProperties = results.data.filter((row: any) => 
            row.Título && row.Tipo && row.Preço && row.Localização && row.Cidade &&
            row.Título.trim() && row.Tipo.trim() && row.Localização.trim() && row.Cidade.trim()
          );

          if (validProperties.length === 0) {
            toast({
              title: "Erro na importação",
              description: "Nenhuma propriedade válida encontrada no arquivo. Verifique se as colunas obrigatórias estão preenchidas.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          // Aqui você implementaria a lógica de importação real
          // Por enquanto, vamos simular
          toast({
            title: "Importação simulada",
            description: `${validProperties.length} propriedades seriam importadas. Esta funcionalidade requer implementação backend completa.`,
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

  const downloadTemplate = () => {
    const template = [
      {
        Título: 'Apartamento 3 dormitórios na praia',
        Tipo: 'apartamento',
        Preço: 450000,
        Localização: 'Rua das Flores, 123 - Centro',
        Cidade: 'Florianópolis',
        'Área (m²)': 85,
        Quartos: 3,
        Lavabo: 2,
        Descrição: 'Apartamento com vista para o mar...',
        Status: 'active'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_propriedades.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template baixado",
      description: "Use este arquivo como modelo para importação",
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Importar/Exportar Propriedades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exportar */}
          <div className="space-y-2">
            <Label>Exportar Propriedades</Label>
            <Button
              variant="outline"
              onClick={handleExportProperties}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Todas ({properties.length})
            </Button>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Baixar Template</Label>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo CSV
            </Button>
          </div>

          {/* Importar */}
          <div className="space-y-2">
            <Label>Importar Propriedades</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportProperties}
              disabled={isProcessing}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Colunas obrigatórias: Título, Tipo, Preço, Localização, Cidade
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertiesBulkActions;
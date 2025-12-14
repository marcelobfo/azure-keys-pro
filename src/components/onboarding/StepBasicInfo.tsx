import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2 } from 'lucide-react';

interface BasicInfoData {
  site_name: string;
  site_title: string;
  site_description: string;
  site_favicon_url: string;
}

interface StepBasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
}

export const StepBasicInfo = ({ data, onChange }: StepBasicInfoProps) => {
  const handleChange = (field: keyof BasicInfoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Dados Básicos</h2>
        <p className="text-muted-foreground mt-2">
          Configure as informações principais da sua imobiliária
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site_name">Nome da Imobiliária *</Label>
          <Input
            id="site_name"
            value={data.site_name}
            onChange={(e) => handleChange('site_name', e.target.value)}
            placeholder="Ex: Imobiliária Premium"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_title">Título do Site (SEO)</Label>
          <Input
            id="site_title"
            value={data.site_title}
            onChange={(e) => handleChange('site_title', e.target.value)}
            placeholder="Ex: Imobiliária Premium - Imóveis de Alto Padrão"
          />
          <p className="text-xs text-muted-foreground">
            Aparece na aba do navegador e resultados de busca
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_description">Descrição (SEO)</Label>
          <Textarea
            id="site_description"
            value={data.site_description}
            onChange={(e) => handleChange('site_description', e.target.value)}
            placeholder="Breve descrição da sua imobiliária para mecanismos de busca..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Máximo 160 caracteres recomendado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_favicon_url">URL do Favicon</Label>
          <Input
            id="site_favicon_url"
            value={data.site_favicon_url}
            onChange={(e) => handleChange('site_favicon_url', e.target.value)}
            placeholder="https://exemplo.com/favicon.ico"
          />
          <p className="text-xs text-muted-foreground">
            Ícone que aparece na aba do navegador (32x32 pixels)
          </p>
        </div>
      </div>
    </div>
  );
};

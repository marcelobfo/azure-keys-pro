import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Palette, Image } from 'lucide-react';

interface BrandingData {
  header_logo_light: string;
  header_logo_dark: string;
  footer_logo: string;
  logo_size_header: number;
  logo_size_footer: number;
}

interface StepBrandingProps {
  data: BrandingData;
  onChange: (data: BrandingData) => void;
}

export const StepBranding = ({ data, onChange }: StepBrandingProps) => {
  const handleChange = (field: keyof BrandingData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Branding</h2>
        <p className="text-muted-foreground mt-2">
          Configure as logos da sua imobiliária
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="header_logo_light">Logo para Tema Claro</Label>
            <Input
              id="header_logo_light"
              value={data.header_logo_light}
              onChange={(e) => handleChange('header_logo_light', e.target.value)}
              placeholder="https://exemplo.com/logo-light.png"
            />
            {data.header_logo_light && (
              <div className="p-4 bg-background border rounded-lg">
                <img
                  src={data.header_logo_light}
                  alt="Logo tema claro"
                  className="max-h-12 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="header_logo_dark">Logo para Tema Escuro</Label>
            <Input
              id="header_logo_dark"
              value={data.header_logo_dark}
              onChange={(e) => handleChange('header_logo_dark', e.target.value)}
              placeholder="https://exemplo.com/logo-dark.png"
            />
            {data.header_logo_dark && (
              <div className="p-4 bg-slate-900 border rounded-lg">
                <img
                  src={data.header_logo_dark}
                  alt="Logo tema escuro"
                  className="max-h-12 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footer_logo">Logo do Rodapé</Label>
            <Input
              id="footer_logo"
              value={data.footer_logo}
              onChange={(e) => handleChange('footer_logo', e.target.value)}
              placeholder="https://exemplo.com/logo-footer.png"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar a logo do header
            </p>
          </div>

          <div className="space-y-3">
            <Label>Tamanho da Logo no Header: {data.logo_size_header}px</Label>
            <Slider
              value={[data.logo_size_header]}
              onValueChange={([value]) => handleChange('logo_size_header', value)}
              min={24}
              max={80}
              step={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Tamanho da Logo no Footer: {data.logo_size_footer}px</Label>
            <Slider
              value={[data.logo_size_footer]}
              onValueChange={([value]) => handleChange('logo_size_footer', value)}
              min={24}
              max={120}
              step={4}
            />
          </div>
        </div>
      </div>

      {!data.header_logo_light && !data.header_logo_dark && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <Image className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Você pode adicionar as logos depois nas configurações do site
          </p>
        </div>
      )}
    </div>
  );
};

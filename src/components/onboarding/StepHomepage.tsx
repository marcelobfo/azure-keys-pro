import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Layout, Image } from 'lucide-react';

interface HomepageData {
  home_layout: string;
  home_banner_title: string;
  home_banner_subtitle: string;
  home_banner_button: string;
  home_banner_image: string;
}

interface StepHomepageProps {
  data: HomepageData;
  onChange: (data: HomepageData) => void;
}

const layoutOptions = [
  { value: 'classic', label: 'Clássico', description: 'Banner + Grid de imóveis' },
  { value: 'modern', label: 'Moderno', description: 'Banner grande + Carrossel' },
  { value: 'minimal', label: 'Minimalista', description: 'Busca em destaque + Lista' },
  { value: 'magazine', label: 'Magazine', description: 'Estilo editorial com destaques' },
];

export const StepHomepage = ({ data, onChange }: StepHomepageProps) => {
  const handleChange = (field: keyof HomepageData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layout className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Página Inicial</h2>
        <p className="text-muted-foreground mt-2">
          Configure o visual da sua página inicial
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Layout da Página Inicial</Label>
          <RadioGroup
            value={data.home_layout}
            onValueChange={(value) => handleChange('home_layout', value)}
            className="grid gap-3 md:grid-cols-2"
          >
            {layoutOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.home_layout === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Image className="w-4 h-4" /> Banner Principal
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="home_banner_title">Título do Banner</Label>
              <Input
                id="home_banner_title"
                value={data.home_banner_title}
                onChange={(e) => handleChange('home_banner_title', e.target.value)}
                placeholder="Encontre o imóvel dos seus sonhos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home_banner_button">Texto do Botão</Label>
              <Input
                id="home_banner_button"
                value={data.home_banner_button}
                onChange={(e) => handleChange('home_banner_button', e.target.value)}
                placeholder="Ver Imóveis"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="home_banner_subtitle">Subtítulo do Banner</Label>
              <Input
                id="home_banner_subtitle"
                value={data.home_banner_subtitle}
                onChange={(e) => handleChange('home_banner_subtitle', e.target.value)}
                placeholder="Os melhores imóveis da região"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="home_banner_image">URL da Imagem do Banner</Label>
              <Input
                id="home_banner_image"
                value={data.home_banner_image}
                onChange={(e) => handleChange('home_banner_image', e.target.value)}
                placeholder="https://exemplo.com/banner.jpg"
              />
              {data.home_banner_image && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={data.home_banner_image}
                    alt="Preview do banner"
                    className="w-full h-32 object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

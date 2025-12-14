import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings, MessageSquare, Users, Home, DollarSign, Share2, Phone } from 'lucide-react';

interface FeaturesData {
  chat_enabled: boolean;
  leads_enabled: boolean;
  olx_enabled: boolean;
  commissions_enabled: boolean;
  whatsapp_enabled: boolean;
  max_users: number;
  max_properties: number;
}

interface StepFeaturesProps {
  data: FeaturesData;
  onChange: (data: FeaturesData) => void;
}

export const StepFeatures = ({ data, onChange }: StepFeaturesProps) => {
  const handleToggle = (field: keyof FeaturesData, value: boolean) => {
    onChange({ ...data, [field]: value });
  };

  const handleNumberChange = (field: 'max_users' | 'max_properties', value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({ ...data, [field]: numValue });
  };

  const features = [
    {
      key: 'chat_enabled' as const,
      icon: MessageSquare,
      label: 'Chat com IA',
      description: 'Atendimento automatizado com inteligência artificial',
    },
    {
      key: 'leads_enabled' as const,
      icon: Users,
      label: 'Gestão de Leads',
      description: 'Captura e gerenciamento de contatos interessados',
    },
    {
      key: 'commissions_enabled' as const,
      icon: DollarSign,
      label: 'Comissões',
      description: 'Controle de comissões dos corretores',
    },
    {
      key: 'olx_enabled' as const,
      icon: Share2,
      label: 'Integração OLX',
      description: 'Publicação automática de imóveis na OLX',
    },
    {
      key: 'whatsapp_enabled' as const,
      icon: Phone,
      label: 'Botão WhatsApp',
      description: 'Botão flutuante para contato via WhatsApp',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Recursos</h2>
        <p className="text-muted-foreground mt-2">
          Escolha os recursos que deseja habilitar
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.key}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <Switch
                checked={data[feature.key]}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          );
        })}
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Home className="w-4 h-4" /> Limites do Plano
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_users">Máximo de Usuários</Label>
            <Input
              id="max_users"
              type="number"
              min={1}
              value={data.max_users}
              onChange={(e) => handleNumberChange('max_users', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_properties">Máximo de Imóveis</Label>
            <Input
              id="max_properties"
              type="number"
              min={1}
              value={data.max_properties}
              onChange={(e) => handleNumberChange('max_properties', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

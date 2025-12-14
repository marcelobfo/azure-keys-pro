import { CheckCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OnboardingCompleteProps {
  tenantName: string;
  tenantSlug: string;
}

export const OnboardingComplete = ({ tenantName, tenantSlug }: OnboardingCompleteProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>

      <h2 className="text-3xl font-bold mb-4">Configuração Concluída!</h2>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Parabéns! A imobiliária <strong>{tenantName}</strong> está pronta para uso.
        Você pode acessar o site ou ajustar as configurações a qualquer momento.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/site-settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Mais Configurações
        </Button>

        <Button onClick={() => window.open(`/t/${tenantSlug}`, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Visitar Site
        </Button>
      </div>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg max-w-lg mx-auto">
        <h3 className="font-medium mb-3">Próximos Passos</h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li>• Adicione seus primeiros imóveis</li>
          <li>• Convide corretores para a plataforma</li>
          <li>• Configure a integração com WhatsApp</li>
          <li>• Personalize as cores e visual do site</li>
        </ul>
      </div>
    </div>
  );
};

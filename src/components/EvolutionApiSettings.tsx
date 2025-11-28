import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Check } from "lucide-react";

interface EvolutionApiSettingsProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export const EvolutionApiSettings = ({ config, onConfigChange }: EvolutionApiSettingsProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async () => {
    if (!config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${config.evolution_api_url}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.evolution_api_key
        }
      });

      if (response.ok) {
        const data = await response.json();
        const instanceExists = data.some((inst: any) => inst.instance?.instanceName === config.evolution_instance);
        
        if (instanceExists) {
          setTestResult({ success: true, message: 'Conexão bem-sucedida! Instância encontrada.' });
          toast.success("Conexão com Evolution API funcionando!");
        } else {
          setTestResult({ success: false, message: 'Instância não encontrada. Verifique o nome.' });
          toast.error("Instância não encontrada");
        }
      } else {
        setTestResult({ success: false, message: `Erro: ${response.status} - Verifique URL e API Key` });
        toast.error("Erro ao conectar com Evolution API");
      }
    } catch (error: any) {
      console.error('Evolution API test error:', error);
      setTestResult({ success: false, message: `Erro: ${error.message}` });
      toast.error("Falha na conexão com Evolution API");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações via WhatsApp (Evolution API)</CardTitle>
        <CardDescription>
          Configure a Evolution API para receber notificações de novos leads via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evolution_api_url">URL da API *</Label>
          <Input
            id="evolution_api_url"
            placeholder="https://sua-api.evolution.com"
            value={config.evolution_api_url || ''}
            onChange={(e) => onConfigChange('evolution_api_url', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            URL base da sua Evolution API (sem barra no final)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evolution_api_key">API Key *</Label>
          <Input
            id="evolution_api_key"
            type="password"
            placeholder="Sua chave de API"
            value={config.evolution_api_key || ''}
            onChange={(e) => onConfigChange('evolution_api_key', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evolution_instance">Nome da Instância *</Label>
          <Input
            id="evolution_instance"
            placeholder="minhainstancia"
            value={config.evolution_instance || ''}
            onChange={(e) => onConfigChange('evolution_instance', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp_notification_number">Número para Notificações *</Label>
          <Input
            id="whatsapp_notification_number"
            placeholder="5511999999999"
            value={config.whatsapp_notification_number || ''}
            onChange={(e) => onConfigChange('whatsapp_notification_number', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Número que receberá as notificações (código do país + DDD + número, sem espaços ou caracteres)
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={testConnection}
            disabled={isTesting || !config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance}
            variant="outline"
            className="w-full"
          >
            {isTesting ? 'Testando...' : 'Testar Conexão'}
          </Button>

          {testResult && (
            <div className={`p-3 rounded-md flex items-start gap-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult.success ? (
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{testResult.message}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            * Campos obrigatórios. As notificações só serão enviadas quando todos os campos estiverem preenchidos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

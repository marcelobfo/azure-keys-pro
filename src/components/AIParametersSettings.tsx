
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIParametersSettingsProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

const AIParametersSettings: React.FC<AIParametersSettingsProps> = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Modelo IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Modelo do Provedor</Label>
            <Input
              value={config.provider_model || 'gemini-2.0-flash-exp'}
              onChange={(e) => onConfigChange('provider_model', e.target.value)}
              placeholder="ex: gemini-2.0-flash-exp, gpt-4"
            />
            <p className="text-xs text-muted-foreground">
              Para Gemini: gemini-2.0-flash-exp, gemini-1.5-pro, etc. Para OpenAI: gpt-4, gpt-3.5-turbo, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Temperatura: {config.temperature || 0.7}</Label>
            <Slider
              value={[config.temperature || 0.7]}
              onValueChange={(value) => onConfigChange('temperature', value[0])}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controla a criatividade das respostas. 0 = mais focado, 2 = mais criativo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Top P: {config.top_p || 0.9}</Label>
            <Slider
              value={[config.top_p || 0.9]}
              onValueChange={(value) => onConfigChange('top_p', value[0])}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controla a diversidade das palavras escolhidas. Valores mais baixos são mais focados.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Máximo de Tokens</Label>
            <Input
              type="number"
              value={config.max_tokens || 800}
              onChange={(e) => onConfigChange('max_tokens', parseInt(e.target.value))}
              min={1}
              max={4000}
            />
            <p className="text-xs text-muted-foreground">
              Limite máximo de tokens (palavras/símbolos) na resposta. Entre 1 e 4000.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="knowledge-base"
              checked={config.knowledge_base_enabled || false}
              onCheckedChange={(checked) => onConfigChange('knowledge_base_enabled', checked)}
            />
            <Label htmlFor="knowledge-base">Ativar Base de Conhecimento</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Quando ativado, o AI usará os artigos da base de conhecimento para fornecer respostas mais precisas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIParametersSettings;

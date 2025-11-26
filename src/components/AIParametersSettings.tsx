
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
            <Select
              value={config.provider_model || 'gemini-2.5-pro'}
              onValueChange={(value) => onConfigChange('provider_model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Recomendado)</SelectItem>
                <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro Preview (Mais recente)</SelectItem>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido)</SelectItem>
                <SelectItem value="gemini-3-pro-image-preview">Gemini 3 Pro Image (Geração de Imagens)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4 Omni (OpenAI)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4 Omni Mini (OpenAI - Rápido)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Gemini 2.5 Pro: estável e confiável. Gemini 3 Pro: raciocínio avançado. Flash: mais rápido.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Temperatura: {config.temperature || 1.0}</Label>
            <Slider
              value={[config.temperature || 1.0]}
              onValueChange={(value) => onConfigChange('temperature', value[0])}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 1.0 para Gemini 3. Controla a criatividade das respostas.
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

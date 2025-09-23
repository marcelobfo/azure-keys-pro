import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiKeyTesterProps {
  provider: string;
  apiKey: string;
}

const ApiKeyTester: React.FC<ApiKeyTesterProps> = ({ provider, apiKey }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave de API primeiro",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: {
          provider,
          message: 'Hello, this is a test message.',
          apiKey
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setTestResult('success');
      toast({
        title: "Sucesso!",
        description: `Conectado com sucesso ao ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}`,
      });
    } catch (error: any) {
      console.error('API test error:', error);
      setTestResult('error');
      toast({
        title: "Erro de conexão",
        description: error.message || "Falha ao conectar com a API",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Testar Conectividade</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <Button 
            onClick={testConnection} 
            disabled={testing || !apiKey}
            size="sm"
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
          
          {testResult === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Conectado
            </div>
          )}
          
          {testResult === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <XCircle className="w-4 h-4 mr-1" />
              Erro de conexão
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyTester;
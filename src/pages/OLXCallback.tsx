import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OLXCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage(`Erro na autorização: ${error}`);
      return;
    }

    if (code && user) {
      processCallback(code);
    } else if (!user) {
      setStatus('error');
      setMessage('Você precisa estar logado para completar a integração');
    }
  }, [searchParams, user]);

  const processCallback = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('olx-oauth-callback', {
        body: {
          code,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStatus('success');
        setMessage('Integração com OLX realizada com sucesso!');
        toast({
          title: 'Sucesso!',
          description: 'Sua conta OLX foi conectada com sucesso.',
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error processing callback:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar autorização');
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar autorização',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && (
              <>
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                Processando...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Sucesso!
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                Erro
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status !== 'processing' && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/admin/olx-settings')}>
                Voltar às Configurações
              </Button>
              {status === 'success' && (
                <Button variant="outline" onClick={() => window.close()}>
                  Fechar Janela
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OLXCallback;

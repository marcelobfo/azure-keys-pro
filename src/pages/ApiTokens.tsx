
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface ApiToken {
  id: string;
  token_name: string;
  token_hash: string;
  active: boolean;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

const ApiTokens = () => {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do token é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate cryptographically secure token using database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_secure_token');

      if (tokenError) throw tokenError;
      
      const token = tokenData;
      
      // Hash token securely using database function
      const { data: hashedToken, error: hashError } = await supabase
        .rpc('hash_token', { token });

      if (hashError) throw hashError;

      // Set expiration to 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error } = await supabase
        .from('api_tokens')
        .insert({
          token_name: newTokenName,
          token_hash: hashedToken,
          active: true,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      setGeneratedToken(token);
      setNewTokenName('');
      fetchTokens();
      
      toast({
        title: "Sucesso",
        description: "Token criado com sucesso. Copie-o agora, ele não será mostrado novamente.",
      });
    } catch (error: any) {
      console.error('Token creation error:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar token",
        variant: "destructive",
      });
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('api_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(tokens.filter(t => t.id !== tokenId));
      toast({
        title: "Sucesso",
        description: "Token excluído com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir token",
        variant: "destructive",
      });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copiado",
      description: "Token copiado para a área de transferência",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Tokens de API</h2>
            <p className="text-muted-foreground">Gerencie tokens de acesso para integração</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Token</DialogTitle>
                <DialogDescription>
                  Crie um novo token de API para integração com sistemas externos.
                </DialogDescription>
              </DialogHeader>
              
              {generatedToken ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">Token criado com sucesso!</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showToken ? "text" : "password"}
                        value={generatedToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToken(generatedToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Copie este token agora. Ele não será mostrado novamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tokenName">Nome do Token</Label>
                    <Input
                      id="tokenName"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="Ex: Integração Sistema X"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                {generatedToken ? (
                  <Button onClick={() => {
                    setGeneratedToken('');
                    setIsCreateModalOpen(false);
                  }}>
                    Fechar
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createToken}>
                      Criar Token
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {tokens.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum token criado
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Crie seu primeiro token de API para começar a integrar
                </p>
              </CardContent>
            </Card>
          ) : (
            tokens.map((token) => (
              <Card key={token.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{token.token_name}</CardTitle>
                      <CardDescription>
                        Criado em {new Date(token.created_at).toLocaleDateString('pt-BR')}
                        {token.last_used_at && (
                          <span> • Último uso: {new Date(token.last_used_at).toLocaleDateString('pt-BR')}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={token.active ? "default" : "secondary"}>
                        {token.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteToken(token.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="password"
                      value={token.token_hash}
                      readOnly
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToken(token.token_hash)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Documentação da API */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Documentação da API</CardTitle>
            <CardDescription>
              Como usar os tokens de API para integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Autenticação</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Inclua o token no cabeçalho Authorization:
              </p>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                Authorization: Bearer SEU_TOKEN_AQUI
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Endpoints Disponíveis</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li><code>GET /api/properties</code> - Listar propriedades</li>
                <li><code>GET /api/properties/:id</code> - Obter propriedade específica</li>
                <li><code>POST /api/leads</code> - Criar lead</li>
                <li><code>GET /api/leads</code> - Listar leads</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ApiTokens;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutomaticMessage {
  id: string;
  trigger: string;
  message: string;
  enabled: boolean;
  created_at: string;
}

const AutomaticMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AutomaticMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState({
    trigger: '',
    message: '',
    enabled: true
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.custom_responses) {
        const customResponses = typeof data.custom_responses === 'string' 
          ? JSON.parse(data.custom_responses) 
          : data.custom_responses;
        
        const messageArray = Object.entries(customResponses || {}).map(([trigger, message], index) => ({
          id: `msg-${index}`,
          trigger,
          message: message as string,
          enabled: true,
          created_at: new Date().toISOString()
        }));
        
        setMessages(messageArray);
      }
    } catch (error: any) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const saveMessages = async () => {
    setLoading(true);
    try {
      const customResponses = messages.reduce((acc, msg) => {
        if (msg.enabled && msg.trigger && msg.message) {
          acc[msg.trigger] = msg.message;
        }
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from('chat_configurations')
        .upsert({
          company: 'Maresia Litoral',
          custom_responses: customResponses,
          active: true
        });

      if (error) throw error;

      toast({
        title: "Mensagens salvas!",
        description: "As mensagens automáticas foram atualizadas.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar mensagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar mensagens automáticas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMessage = () => {
    if (!newMessage.trigger || !newMessage.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o gatilho e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    const message: AutomaticMessage = {
      id: `msg-${Date.now()}`,
      trigger: newMessage.trigger,
      message: newMessage.message,
      enabled: newMessage.enabled,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage({ trigger: '', message: '', enabled: true });
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const toggleMessage = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, enabled: !msg.enabled } : msg
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Mensagem Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="trigger">Palavra-chave (Gatilho)</Label>
            <Input
              id="trigger"
              placeholder="Ex: horário, preço, localização"
              value={newMessage.trigger}
              onChange={(e) => setNewMessage(prev => ({ ...prev, trigger: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="message">Mensagem de Resposta</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem que será enviada automaticamente..."
              value={newMessage.message}
              onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newMessage.enabled}
              onCheckedChange={(checked) => setNewMessage(prev => ({ ...prev, enabled: checked }))}
            />
            <Label>Ativar mensagem</Label>
          </div>
          <Button onClick={addMessage}>Adicionar Mensagem</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens Automáticas Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma mensagem automática configurada.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">Gatilho:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {message.trigger}
                        </code>
                        <Switch
                          checked={message.enabled}
                          onCheckedChange={() => toggleMessage(message.id)}
                        />
                      </div>
                      <p className="text-gray-700 mb-2">{message.message}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMessage(message.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {messages.length > 0 && (
            <div className="mt-6">
              <Button onClick={saveMessages} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Todas as Mensagens'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomaticMessages;
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatConfiguration {
  id: string;
  active: boolean;
  ai_chat_enabled: boolean;
  whatsapp_enabled: boolean;
  welcome_message: string;
  whatsapp_number: string | null;
  system_instruction: string | null;
  company: string;
  api_provider: string;
  api_key_encrypted: string | null;
  custom_responses: any;
}

export const useChatConfiguration = () => {
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<ChatConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar configuração atual
  const fetchConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuração:', error);
        return;
      }

      if (data) {
        setConfiguration(data);
      } else {
        // Criar configuração padrão se não existir
        await createDefaultConfiguration();
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar configuração padrão
  const createDefaultConfiguration = async () => {
    try {
      const defaultConfig = {
        company: 'Sua Imobiliária',
        active: true,
        ai_chat_enabled: false,
        whatsapp_enabled: true,
        welcome_message: 'Olá! Como posso ajudá-lo hoje?',
        whatsapp_number: '+5547991648836',
        api_provider: 'openai',
        custom_responses: {
          greeting: 'Bem-vindo ao nosso chat!',
          offline: 'No momento não temos atendentes online, mas responderemos em breve.',
          closing: 'Obrigado por entrar em contato!'
        }
      };

      const { data, error } = await supabase
        .from('chat_configurations')
        .insert(defaultConfig)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configuração padrão:', error);
        return;
      }

      setConfiguration(data);
    } catch (error) {
      console.error('Erro ao criar configuração padrão:', error);
    }
  };

  // Atualizar configuração
  const updateConfiguration = async (updates: Partial<ChatConfiguration>) => {
    if (!configuration) return;

    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .update(updates)
        .eq('id', configuration.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configuração:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a configuração.',
          variant: 'destructive',
        });
        return;
      }

      setConfiguration(data);
      toast({
        title: 'Configuração atualizada!',
        description: 'As alterações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração.',
        variant: 'destructive',
      });
    }
  };

  // Atualizar configuração específica do campo
  const updateField = async (field: keyof ChatConfiguration, value: any) => {
    await updateConfiguration({ [field]: value });
  };

  useEffect(() => {
    fetchConfiguration();
  }, []);

  return {
    configuration,
    loading,
    updateConfiguration,
    updateField,
    fetchConfiguration
  };
};
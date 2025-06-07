
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PropertyAlert {
  id: string;
  property_type: string | null;
  city: string | null;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  min_area: number | null;
  max_area: number | null;
  active: boolean;
  created_at: string;
}

export const usePropertyAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    } else {
      setAlerts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('property_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const createAlert = async (alertData: Omit<PropertyAlert, 'id' | 'created_at'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('property_alerts')
      .insert({
        ...alertData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar alerta",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } else {
      setAlerts(prev => [data, ...prev]);
      toast({
        title: "Alerta criado",
        description: "Você será notificado sobre novos imóveis!",
      });
      return { data };
    }
  };

  const updateAlert = async (alertId: string, updates: Partial<PropertyAlert>) => {
    const { data, error } = await supabase
      .from('property_alerts')
      .update(updates)
      .eq('id', alertId)
      .eq('user_id', user?.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao atualizar alerta",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } else {
      setAlerts(prev => prev.map(a => a.id === alertId ? data : a));
      toast({
        title: "Alerta atualizado",
        description: "Suas preferências foram salvas!",
      });
      return { data };
    }
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('property_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Erro ao remover alerta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({
        title: "Alerta removido",
        description: "O alerta foi removido com sucesso!",
      });
    }
  };

  return {
    alerts,
    loading,
    createAlert,
    updateAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
};

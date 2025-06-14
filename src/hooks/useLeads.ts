
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  property_id: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string | null;
}

export const useLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLeads(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, status, updated_at: new Date().toISOString() }
            : lead
        )
      );

      toast({
        title: "Sucesso",
        description: "Status do lead atualizado",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do lead",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId));

      toast({
        title: "Sucesso",
        description: "Lead excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lead",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    loading,
    fetchLeads,
    updateLeadStatus,
    deleteLead,
    refetch: fetchLeads
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantContext } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';

export interface Visit {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  visit_date: string;
  visit_time: string;
  status: string | null;
  notes: string | null;
  property_id: string | null;
  tenant_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  properties?: {
    title: string;
    location: string;
  };
}

export const useVisits = () => {
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedTenantId, isGlobalView } = useTenantContext();
  const { isSuperAdmin } = useRoles();

  const fetchVisits = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('visits')
        .select(`
          *,
          properties (
            title,
            location
          )
        `)
        .order('visit_date', { ascending: true });

      // Super admin com tenant selecionado filtra por tenant
      if (isSuperAdmin && selectedTenantId && !isGlobalView) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVisits(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar visitas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visitId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', visitId);

      if (error) {
        throw error;
      }

      setVisits(prev => 
        prev.map(visit => 
          visit.id === visitId 
            ? { ...visit, status, updated_at: new Date().toISOString() }
            : visit
        )
      );

      toast({
        title: "Sucesso",
        description: "Status da visita atualizado",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar visita:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da visita",
        variant: "destructive",
      });
    }
  };

  const deleteVisit = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);

      if (error) {
        throw error;
      }

      setVisits(prev => prev.filter(visit => visit.id !== visitId));

      toast({
        title: "Sucesso",
        description: "Visita excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir visita:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir visita",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [selectedTenantId, isGlobalView]);

  return {
    visits,
    loading,
    fetchVisits,
    updateVisitStatus,
    deleteVisit,
    refetch: fetchVisits
  };
};

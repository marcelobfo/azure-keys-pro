import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantContext } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';

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
  tenant_id?: string | null;
  source?: string | null;
  olx_link?: string | null;
  olx_ad_id?: string | null;
  olx_list_id?: string | null;
  properties?: {
    title: string;
  };
}

export const useLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedTenantId, isGlobalView } = useTenantContext();
  const { isSuperAdmin } = useRoles();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leads')
        .select(`
          *,
          properties (
            title
          )
        `)
        .order('created_at', { ascending: false });

      // Super admin com tenant selecionado filtra por tenant
      // Super admin em visão global vê todos
      // Usuários normais são filtrados automaticamente pelo RLS
      if (isSuperAdmin && selectedTenantId && !isGlobalView) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data, error } = await query;

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

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, ...updates, updated_at: new Date().toISOString() }
            : lead
        )
      );

      toast({
        title: "Sucesso",
        description: "Lead atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar lead",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      console.log('Tentando excluir lead:', leadId);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Erro do Supabase:', error);
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
        description: error.message || "Erro ao excluir lead",
        variant: "destructive",
      });
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, assigned_to: userId, updated_at: new Date().toISOString() }
            : lead
        )
      );

      toast({
        title: "Sucesso",
        description: "Lead atribuído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atribuir lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir lead",
        variant: "destructive",
      });
    }
  };

  const createLead = async (leadData: Partial<Lead>) => {
    try {
      // Adiciona tenant_id se super admin tem tenant selecionado
      const insertData: any = {
        name: leadData.name || '',
        email: leadData.email,
        phone: leadData.phone,
        message: leadData.message,
        property_id: leadData.property_id,
        status: leadData.status || 'new',
        assigned_to: leadData.assigned_to,
      };

      if (selectedTenantId) {
        insertData.tenant_id = selectedTenantId;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchLeads();

      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead",
        variant: "destructive",
      });
      return null;
    }
  };

  const { loading: rolesLoading } = useRoles();

  useEffect(() => {
    if (!rolesLoading) {
      fetchLeads();
    }
  }, [selectedTenantId, isGlobalView, isSuperAdmin, rolesLoading]);

  return {
    leads,
    loading,
    fetchLeads,
    updateLeadStatus,
    updateLead,
    deleteLead,
    assignLead,
    createLead,
    refetch: fetchLeads
  };
};

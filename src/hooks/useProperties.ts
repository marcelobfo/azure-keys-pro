import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantContext } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';

export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rental_price: number | null;
  location: string;
  city: string;
  state: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garage_spaces: number | null;
  suites: number | null;
  property_type: string;
  purpose: string | null;
  status: string | null;
  images: string[] | null;
  features: string[] | null;
  tags: string[] | null;
  is_featured: boolean | null;
  is_beachfront: boolean | null;
  is_near_beach: boolean | null;
  is_development: boolean | null;
  accepts_exchange: boolean | null;
  property_code: string | null;
  slug: string | null;
  user_id: string | null;
  tenant_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  view_count: number | null;
}

export const useProperties = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedTenantId, isGlobalView } = useTenantContext();
  const { isSuperAdmin } = useRoles();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      // Super admin com tenant selecionado filtra por tenant
      if (isSuperAdmin && selectedTenantId && !isGlobalView) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar imóveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Partial<Property>) => {
    try {
      const insertData: any = {
        title: propertyData.title || '',
        price: propertyData.price || 0,
        location: propertyData.location || '',
        city: propertyData.city || '',
        property_type: propertyData.property_type || '',
        ...propertyData,
      };

      if (selectedTenantId) {
        insertData.tenant_id = selectedTenantId;
      }

      const { data, error } = await supabase
        .from('properties')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchProperties();

      toast({
        title: "Sucesso",
        description: "Imóvel criado com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar imóvel:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar imóvel",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      setProperties(prev => 
        prev.map(prop => 
          prop.id === propertyId 
            ? { ...prop, ...updates, updated_at: new Date().toISOString() }
            : prop
        )
      );

      toast({
        title: "Sucesso",
        description: "Imóvel atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar imóvel:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar imóvel",
        variant: "destructive",
      });
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      setProperties(prev => prev.filter(prop => prop.id !== propertyId));

      toast({
        title: "Sucesso",
        description: "Imóvel excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir imóvel:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir imóvel",
        variant: "destructive",
      });
    }
  };

  const { loading: rolesLoading } = useRoles();

  useEffect(() => {
    if (!rolesLoading) {
      fetchProperties();
    }
  }, [selectedTenantId, isGlobalView, isSuperAdmin, rolesLoading]);

  return {
    properties,
    loading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    refetch: fetchProperties
  };
};

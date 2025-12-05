import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useRoles } from '@/hooks/useRoles';
import { useTenantContext } from '@/contexts/TenantContext';

export interface TenantFeatures {
  id: string;
  tenant_id: string;
  chat_enabled: boolean;
  olx_enabled: boolean;
  leads_enabled: boolean;
  commissions_enabled: boolean;
  evolution_enabled: boolean;
  whatsapp_enabled: boolean;
  max_users: number;
  max_properties: number;
  created_at: string;
  updated_at: string;
}

export const useTenantFeatures = () => {
  const { profile } = useProfile();
  const { isSuperAdmin } = useRoles();
  const { selectedTenantId, isGlobalView } = useTenantContext();
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine which tenant ID to use
  const effectiveTenantId = isSuperAdmin ? selectedTenantId : profile?.tenant_id;

  useEffect(() => {
    // Super admin in global view - return all features enabled
    if (isSuperAdmin && isGlobalView) {
      setFeatures(null);
      setLoading(false);
      return;
    }

    if (effectiveTenantId) {
      fetchTenantFeatures(effectiveTenantId);
    } else {
      setFeatures(null);
      setLoading(false);
    }
  }, [effectiveTenantId, isSuperAdmin, isGlobalView]);

  const fetchTenantFeatures = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('Error fetching tenant features:', error);
        // Default features if not found
        setFeatures({
          id: '',
          tenant_id: tenantId,
          chat_enabled: true,
          olx_enabled: false,
          leads_enabled: true,
          commissions_enabled: true,
          evolution_enabled: false,
          whatsapp_enabled: false,
          max_users: 10,
          max_properties: 100,
          created_at: '',
          updated_at: '',
        });
      } else {
        setFeatures(data as TenantFeatures);
      }
    } catch (err) {
      console.error('Error fetching tenant features:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof Omit<TenantFeatures, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'max_users' | 'max_properties'>): boolean => {
    // Super admin in global view has all features enabled
    if (isSuperAdmin && isGlobalView) return true;
    if (!features) return true; // Default to enabled if no features set
    return features[feature] ?? true;
  };

  const getLimit = (limit: 'max_users' | 'max_properties'): number => {
    // Super admin in global view has no limits
    if (isSuperAdmin && isGlobalView) return Infinity;
    if (!features) return 100; // Default limit
    return features[limit] ?? 100;
  };

  return {
    features,
    loading,
    hasFeature,
    getLimit,
    effectiveTenantId,
    isGlobalView: isSuperAdmin && isGlobalView,
    refetch: () => effectiveTenantId && fetchTenantFeatures(effectiveTenantId),
  };
};

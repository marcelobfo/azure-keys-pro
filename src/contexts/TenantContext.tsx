import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useProfile } from '@/hooks/useProfile';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  selectedTenantId: string | null;
  selectedTenant: Tenant | null;
  allTenants: Tenant[];
  setSelectedTenant: (tenantId: string | null) => void;
  isGlobalView: boolean;
  setGlobalView: (value: boolean) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedTenantId';
const GLOBAL_VIEW_KEY = 'tenantGlobalView';

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { profile, loading: profileLoading } = useProfile();
  
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all tenants for super admin
  useEffect(() => {
    const loadTenants = async () => {
      if (!user || rolesLoading) return;

      if (isSuperAdmin) {
        try {
          const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .order('name');

          if (error) {
            console.error('Error loading tenants:', error);
          } else {
            setAllTenants(data || []);
          }
        } catch (err) {
          console.error('Error loading tenants:', err);
        }
      }
      
      setLoading(false);
    };

    loadTenants();
  }, [user, isSuperAdmin, rolesLoading]);

  // Initialize selected tenant from localStorage or profile
  useEffect(() => {
    if (rolesLoading || profileLoading || loading) return;

    if (isSuperAdmin) {
      // Check localStorage for saved selection
      const savedTenantId = localStorage.getItem(STORAGE_KEY);
      const savedGlobalView = localStorage.getItem(GLOBAL_VIEW_KEY) === 'true';

      if (savedGlobalView) {
        setIsGlobalView(true);
        setSelectedTenantId(null);
        setSelectedTenantState(null);
      } else if (savedTenantId && allTenants.length > 0) {
        const tenant = allTenants.find(t => t.id === savedTenantId);
        if (tenant) {
          setSelectedTenantId(savedTenantId);
          setSelectedTenantState(tenant);
        } else if (profile?.tenant_id) {
          // Fallback to profile tenant
          const profileTenant = allTenants.find(t => t.id === profile.tenant_id);
          if (profileTenant) {
            setSelectedTenantId(profile.tenant_id);
            setSelectedTenantState(profileTenant);
          }
        }
      } else if (profile?.tenant_id && allTenants.length > 0) {
        const profileTenant = allTenants.find(t => t.id === profile.tenant_id);
        if (profileTenant) {
          setSelectedTenantId(profile.tenant_id);
          setSelectedTenantState(profileTenant);
        }
      }
    } else {
      // Non super admin - use profile tenant
      setSelectedTenantId(profile?.tenant_id || null);
    }
  }, [isSuperAdmin, rolesLoading, profileLoading, loading, allTenants, profile?.tenant_id]);

  const setSelectedTenant = (tenantId: string | null) => {
    if (tenantId === null || tenantId === 'all') {
      setIsGlobalView(true);
      setSelectedTenantId(null);
      setSelectedTenantState(null);
      localStorage.setItem(GLOBAL_VIEW_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setIsGlobalView(false);
      setSelectedTenantId(tenantId);
      const tenant = allTenants.find(t => t.id === tenantId);
      setSelectedTenantState(tenant || null);
      localStorage.setItem(STORAGE_KEY, tenantId);
      localStorage.setItem(GLOBAL_VIEW_KEY, 'false');
    }
  };

  const setGlobalView = (value: boolean) => {
    setIsGlobalView(value);
    if (value) {
      setSelectedTenantId(null);
      setSelectedTenantState(null);
      localStorage.setItem(GLOBAL_VIEW_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        selectedTenantId,
        selectedTenant,
        allTenants,
        setSelectedTenant,
        isGlobalView,
        setGlobalView,
        loading: loading || rolesLoading || profileLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;

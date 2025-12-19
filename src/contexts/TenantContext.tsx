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
  currentTenant: Tenant | null; // Tenant detected by domain/URL
  allTenants: Tenant[];
  setSelectedTenant: (tenantId: string | null) => void;
  isGlobalView: boolean;
  setGlobalView: (value: boolean) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedTenantId';
const GLOBAL_VIEW_KEY = 'tenantGlobalView';

// Detect tenant from URL/domain
const detectTenantFromUrl = async (): Promise<Tenant | null> => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // 1. Check for path-based tenant: /t/tenant-slug/...
  const pathMatch = pathname.match(/^\/t\/([^/]+)/);
  if (pathMatch) {
    const tenantSlug = pathMatch[1];
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();

    if (data) return data;
  }

  // 2. Check for custom domain
  if (!hostname.includes('localhost') && 
      !hostname.includes('lovableproject.com') &&
      !hostname.includes('lovable.app')) {
    // Remove www. prefix for matching
    const cleanHostname = hostname.replace(/^www\./, '');
    
    // First try exact match (with or without www)
    const { data: exactMatch } = await supabase
      .from('tenants')
      .select('*')
      .or(`domain.eq.${cleanHostname},domain.eq.www.${cleanHostname}`)
      .single();

    if (exactMatch) return exactMatch;
    
    // Fallback: check if hostname contains the domain
    const { data: allTenants } = await supabase
      .from('tenants')
      .select('*')
      .not('domain', 'is', null);
    
    if (allTenants) {
      const matchedTenant = allTenants.find(t => 
        t.domain && (
          cleanHostname.includes(t.domain.replace(/^www\./, '')) ||
          t.domain.replace(/^www\./, '').includes(cleanHostname)
        )
      );
      if (matchedTenant) return matchedTenant;
    }
  }

  // 3. Check for subdomain: tenant-slug.domain.com
  const subdomainParts = hostname.split('.');
  if (subdomainParts.length >= 3) {
    const subdomain = subdomainParts[0];
    if (subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', subdomain)
        .single();

      if (data) return data;
    }
  }

  return null;
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isSuperAdmin, loading: rolesLoading } = useRoles();
  const { profile, loading: profileLoading } = useProfile();
  
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detect tenant from URL/domain on mount
  useEffect(() => {
    const detectTenant = async () => {
      const detected = await detectTenantFromUrl();
      setCurrentTenant(detected);
      
      // If tenant detected and no user logged in, use it as selected
      if (detected && !user) {
        setSelectedTenantId(detected.id);
        setSelectedTenantState(detected);
      }
    };
    
    detectTenant();
  }, [user]);

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

  // Initialize selected tenant from localStorage, profile, or detected tenant
  useEffect(() => {
    if (rolesLoading || profileLoading || loading) return;

    // If tenant was detected from URL/domain, prioritize it for non-admin users
    if (currentTenant && !isSuperAdmin) {
      setSelectedTenantId(currentTenant.id);
      setSelectedTenantState(currentTenant);
      return;
    }

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
      // Non super admin - use detected tenant or profile tenant
      if (currentTenant) {
        setSelectedTenantId(currentTenant.id);
        setSelectedTenantState(currentTenant);
      } else {
        setSelectedTenantId(profile?.tenant_id || null);
      }
    }
  }, [isSuperAdmin, rolesLoading, profileLoading, loading, allTenants, profile?.tenant_id, currentTenant]);

  const setSelectedTenant = async (tenantId: string | null) => {
    if (tenantId === null || tenantId === 'all') {
      setIsGlobalView(true);
      setSelectedTenantId(null);
      setSelectedTenantState(null);
      localStorage.setItem(GLOBAL_VIEW_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
      
      // Update admin_tenant_context in database for super admin
      if (user && isSuperAdmin) {
        await supabase
          .from('admin_tenant_context')
          .upsert({ 
            user_id: user.id, 
            viewing_tenant_id: null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    } else {
      setIsGlobalView(false);
      setSelectedTenantId(tenantId);
      const tenant = allTenants.find(t => t.id === tenantId);
      setSelectedTenantState(tenant || null);
      localStorage.setItem(STORAGE_KEY, tenantId);
      localStorage.setItem(GLOBAL_VIEW_KEY, 'false');
      
      // Update admin_tenant_context in database for super admin
      if (user && isSuperAdmin) {
        await supabase
          .from('admin_tenant_context')
          .upsert({ 
            user_id: user.id, 
            viewing_tenant_id: tenantId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
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
        currentTenant,
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

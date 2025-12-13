import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

export const useTenantByDomain = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectTenant = async () => {
      try {
        setLoading(true);
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // 1. Check for path-based tenant: /t/tenant-slug/...
        const pathMatch = pathname.match(/^\/t\/([^/]+)/);
        if (pathMatch) {
          const tenantSlug = pathMatch[1];
          const { data, error: err } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', tenantSlug)
            .single();

          if (err && err.code !== 'PGRST116') throw err;
          if (data) {
            setTenant(data);
            setLoading(false);
            return;
          }
        }

        // 2. Check for custom domain
        // Skip localhost and lovableproject domains
        if (!hostname.includes('localhost') && 
            !hostname.includes('lovableproject.com') &&
            !hostname.includes('lovable.app')) {
          const { data, error: err } = await supabase
            .from('tenants')
            .select('*')
            .eq('domain', hostname)
            .single();

          if (err && err.code !== 'PGRST116') throw err;
          if (data) {
            setTenant(data);
            setLoading(false);
            return;
          }
        }

        // 3. Check for subdomain: tenant-slug.domain.com
        const subdomainParts = hostname.split('.');
        if (subdomainParts.length >= 3) {
          const subdomain = subdomainParts[0];
          // Skip www and common subdomains
          if (subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
            const { data, error: err } = await supabase
              .from('tenants')
              .select('*')
              .eq('slug', subdomain)
              .single();

            if (err && err.code !== 'PGRST116') throw err;
            if (data) {
              setTenant(data);
              setLoading(false);
              return;
            }
          }
        }

        // No tenant found - this is the main/default site
        setTenant(null);
      } catch (err) {
        console.error('Error detecting tenant:', err);
        setError(err instanceof Error ? err.message : 'Error detecting tenant');
      } finally {
        setLoading(false);
      }
    };

    detectTenant();
  }, []);

  return { tenant, loading, error };
};

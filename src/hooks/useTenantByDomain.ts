import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Configure your base domain here
const BASE_DOMAIN = 'techmoveis.com.br';

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
        // Normalize hostname: remove www. prefix
        const rawHostname = window.location.hostname;
        const hostname = rawHostname.replace(/^www\./, '');
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

        // 2. Check for subdomain: tenant-slug.techmoveis.com.br
        if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname.endsWith(`.${BASE_DOMAIN.replace(/^www\./, '')}`)) {
          const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '').replace(`.${BASE_DOMAIN.replace(/^www\./, '')}`, '');
          
          if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
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

        // 3. Check for custom domain (not localhost, not lovable domains, not base domain)
        const isLocalhost = hostname.includes('localhost');
        const isLovable = hostname.includes('lovableproject.com') || hostname.includes('lovable.app');
        const isBaseDomain = hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`;
        
        if (!isLocalhost && !isLovable && !isBaseDomain) {
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
          
          // Try with www prefix if not found
          const { data: dataWithWww, error: errWithWww } = await supabase
            .from('tenants')
            .select('*')
            .eq('domain', `www.${hostname}`)
            .single();

          if (errWithWww && errWithWww.code !== 'PGRST116') throw errWithWww;
          if (dataWithWww) {
            setTenant(dataWithWww);
            setLoading(false);
            return;
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

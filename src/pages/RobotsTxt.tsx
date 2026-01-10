import { useEffect, useState } from 'react';
import { useTenantByDomain } from '@/hooks/useTenantByDomain';
import { supabase } from '@/integrations/supabase/client';

const RobotsTxt = () => {
  const { tenant } = useTenantByDomain();
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (rendered) return;

    // Construir URL base do tenant
    let baseUrl = window.location.origin;
    
    // Se tiver domínio customizado no tenant, usar ele
    if (tenant?.domain) {
      baseUrl = `https://${tenant.domain.replace(/^www\./, '')}`;
    }

    // URL da Edge Function para o sitemap XML
    const supabaseUrl = 'https://vmlnzfodeubthlhjahpc.supabase.co';
    const sitemapUrl = `${supabaseUrl}/functions/v1/sitemap?domain=${encodeURIComponent(window.location.hostname)}`;

    const robotsTxt = `# Robots.txt - ${tenant?.name || 'Site'}
# Generated dynamically for multi-tenant SEO

User-agent: *
Allow: /

# Bloquear áreas administrativas
Disallow: /admin/*
Disallow: /dashboard/*
Disallow: /login
Disallow: /auth

# Bloquear rotas de API e funcionalidades internas
Disallow: /api/*
Disallow: /*.json$

# Sitemap - Edge Function (XML puro para crawlers)
Sitemap: ${sitemapUrl}

# Crawl-delay para não sobrecarregar o servidor
Crawl-delay: 1
`;

    // Renderizar como texto puro
    document.open('text/plain');
    document.write(robotsTxt);
    document.close();
    
    setRendered(true);
  }, [tenant, rendered]);

  return null;
};

export default RobotsTxt;

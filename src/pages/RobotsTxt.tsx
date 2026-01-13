import { useEffect, useState } from 'react';
import { useTenantByDomain } from '@/hooks/useTenantByDomain';
import { supabase } from '@/integrations/supabase/client';

const RobotsTxt = () => {
  const { tenant } = useTenantByDomain();
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (rendered) return;

    // Construir URL base do tenant
    // Construir URL base do tenant
    const hostname = window.location.hostname.replace(/^www\./, '');
    const baseUrl = `https://${hostname}`;

    // Sitemap URL limpa no próprio domínio (servida via Vercel rewrite)
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

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

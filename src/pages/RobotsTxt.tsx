import { useEffect, useState } from 'react';
import { useTenantByDomain } from '@/hooks/useTenantByDomain';

const RobotsTxt = () => {
  const { loading: tenantLoading } = useTenantByDomain();
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (tenantLoading || generated) return;

    const generateAndRenderRobots = () => {
      try {
        const baseUrl = window.location.origin;
        
        const robotsTxt = `# Robots.txt for ${baseUrl}
# Generated dynamically per tenant

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth
Disallow: /login
Disallow: /profile
Disallow: /api/

# Allow search engines to access all public content
Allow: /imoveis
Allow: /imovel/
Allow: /contact
Allow: /nossa-equipe

# Sitemap location (XML format for crawlers)
Sitemap: ${baseUrl}/sitemap.xml?format=xml

# Crawl-delay (optional - be nice to servers)
Crawl-delay: 1
`;

        // Render plain text in browser
        renderTextInBrowser(robotsTxt);
        setGenerated(true);
        
      } catch (error) {
        console.error('Erro ao gerar robots.txt:', error);
      }
    };

    generateAndRenderRobots();
  }, [tenantLoading, generated]);

  // Loading state
  if (tenantLoading || !generated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gerando robots.txt...</p>
        </div>
      </div>
    );
  }

  return null;
};

function renderTextInBrowser(textContent: string): void {
  // Replace document content with plain text
  document.open('text/plain');
  document.write(textContent);
  document.close();
}

export default RobotsTxt;

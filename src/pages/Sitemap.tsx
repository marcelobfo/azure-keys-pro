import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantByDomain } from '@/hooks/useTenantByDomain';

interface Property {
  slug: string;
  updated_at: string;
  images: string[] | null;
  title: string;
}

const Sitemap = () => {
  const { tenant, loading: tenantLoading } = useTenantByDomain();
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (tenantLoading || generated) return;

    const generateAndRenderSitemap = async () => {
      try {
        const baseUrl = window.location.origin;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Build query for properties
        let query = supabase
          .from('properties')
          .select('slug, updated_at, images, title')
          .eq('status', 'active')
          .not('slug', 'is', null);

        // Filter by tenant if detected
        if (tenant?.id) {
          query = query.eq('tenant_id', tenant.id);
        }

        const { data: properties, error } = await query;

        if (error) {
          console.error('Erro ao buscar propriedades:', error);
          return;
        }

        // Generate XML sitemap with images
        const sitemapXml = generateSitemapXml(baseUrl, currentDate, properties || []);

        // Render pure XML in browser
        renderXmlInBrowser(sitemapXml);
        setGenerated(true);
        
      } catch (error) {
        console.error('Erro ao gerar sitemap:', error);
      }
    };

    generateAndRenderSitemap();
  }, [tenant, tenantLoading, generated]);

  // Loading state
  if (tenantLoading || !generated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gerando sitemap...</p>
        </div>
      </div>
    );
  }

  return null;
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemapXml(baseUrl: string, currentDate: string, properties: Property[]): string {
  const staticPages = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis/destaque</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis/frente-mar</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis/quadra-mar</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis/empreendimentos</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/nossa-equipe</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  const propertyUrls = properties.map(property => {
    const lastmod = new Date(property.updated_at).toISOString().split('T')[0];
    const images = property.images || [];
    
    // Generate image:image tags for SEO
    const imagesTags = images.slice(0, 5).map(img => `
    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:title>${escapeXml(property.title)}</image:title>
    </image:image>`).join('');

    return `
  <url>
    <loc>${baseUrl}/imovel/${property.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imagesTags}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages}
${propertyUrls}
</urlset>`;
}

function renderXmlInBrowser(xmlContent: string): void {
  // Replace document content with pure XML
  document.open('text/xml');
  document.write(xmlContent);
  document.close();
}

export default Sitemap;

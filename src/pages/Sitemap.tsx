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

        // Generate XML sitemap with XSLT stylesheet
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

function generateXslStylesheet(): string {
  return `<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title>Sitemap XML</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white; 
            padding: 30px 40px;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .header p {
            margin-top: 8px;
            opacity: 0.9;
            font-size: 14px;
          }
          .stats { 
            display: flex;
            gap: 20px;
            padding: 20px 40px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .stat-card {
            background: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
          }
          .stat-card .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          .stat-card .value {
            font-size: 28px;
            font-weight: 700;
            color: #1e3a8a;
            margin-top: 4px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse;
          }
          thead {
            position: sticky;
            top: 0;
            z-index: 10;
          }
          th { 
            background: #f1f5f9; 
            padding: 16px 20px; 
            text-align: left; 
            font-weight: 600; 
            color: #334155; 
            border-bottom: 2px solid #e2e8f0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td { 
            padding: 16px 20px; 
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          tr:hover td { 
            background: #f8fafc; 
          }
          .url-cell {
            max-width: 500px;
          }
          .url-link { 
            color: #2563eb; 
            text-decoration: none;
            word-break: break-all;
            font-size: 14px;
            font-weight: 500;
          }
          .url-link:hover { 
            text-decoration: underline; 
            color: #1d4ed8;
          }
          .date {
            color: #64748b;
            font-size: 13px;
            white-space: nowrap;
          }
          .freq {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            background: #e0e7ff;
            color: #3730a3;
          }
          .priority { 
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            font-size: 13px;
            font-weight: 700;
          }
          .priority-high { 
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
          }
          .priority-medium { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }
          .priority-low { 
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            color: #64748b;
          }
          .images-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #f0f9ff;
            color: #0369a1;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
          }
          .images-badge.has-images {
            background: #ecfdf5;
            color: #047857;
          }
          .footer {
            padding: 20px 40px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 13px;
          }
          @media (max-width: 768px) {
            body { padding: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 20px; }
            .stats { flex-direction: column; padding: 15px; gap: 10px; }
            th, td { padding: 12px 10px; font-size: 12px; }
            .url-cell { max-width: 200px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗺️ Sitemap XML</h1>
            <p>Mapa do site para mecanismos de busca • Gerado automaticamente</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="label">Total de URLs</div>
              <div class="value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
            </div>
            <div class="stat-card">
              <div class="label">Total de Imagens</div>
              <div class="value"><xsl:value-of select="count(sitemap:urlset/sitemap:url/image:image)"/></div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 50%">URL</th>
                <th style="width: 15%">Última Modificação</th>
                <th style="width: 12%">Frequência</th>
                <th style="width: 10%">Prioridade</th>
                <th style="width: 13%">Imagens</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="url-cell">
                    <a class="url-link" href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td class="date">
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <span class="freq"><xsl:value-of select="sitemap:changefreq"/></span>
                  </td>
                  <td>
                    <xsl:variable name="prio" select="sitemap:priority"/>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:text>priority </xsl:text>
                        <xsl:choose>
                          <xsl:when test="$prio &gt;= 0.8">priority-high</xsl:when>
                          <xsl:when test="$prio &gt;= 0.5">priority-medium</xsl:when>
                          <xsl:otherwise>priority-low</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                  <td>
                    <xsl:variable name="imgCount" select="count(image:image)"/>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:text>images-badge</xsl:text>
                        <xsl:if test="$imgCount &gt; 0"> has-images</xsl:if>
                      </xsl:attribute>
                      📷 <xsl:value-of select="$imgCount"/>
                    </span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          
          <div class="footer">
            Sitemap gerado automaticamente • Válido para Google, Bing e outros mecanismos de busca
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
}

function generateSitemapXml(baseUrl: string, currentDate: string, properties: Property[]): string {
  const xslStylesheet = generateXslStylesheet();
  const encodedXsl = encodeURIComponent(xslStylesheet);

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
<?xml-stylesheet type="text/xsl" href="data:text/xsl;charset=utf-8,${encodedXsl}"?>
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

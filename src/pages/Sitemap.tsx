import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantByDomain } from '@/hooks/useTenantByDomain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Download, MapPin, Image, FileText, Globe, Calendar, RefreshCw } from 'lucide-react';

interface Property {
  slug: string;
  updated_at: string;
  images: string[] | null;
  title: string;
}

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  images: number;
  title?: string;
}

const Sitemap = () => {
  const { tenant, loading: tenantLoading } = useTenantByDomain();
  const [urls, setUrls] = useState<SitemapUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [isXmlMode, setIsXmlMode] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    // Check if XML format is requested (for bots)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('format') === 'xml') {
      setIsXmlMode(true);
    }
  }, []);

  useEffect(() => {
    if (tenantLoading) return;

    const generateSitemap = async () => {
      try {
        setLoading(true);
        const baseUrl = window.location.origin;
        const currentDate = new Date().toISOString().split('T')[0];

        // Fetch properties
        let query = supabase
          .from('properties')
          .select('slug, updated_at, images, title')
          .eq('status', 'active');

        if (tenant?.id) {
          query = query.eq('tenant_id', tenant.id);
        }

        const { data: propertiesData, error } = await query;
        if (error) throw error;

        setProperties(propertiesData || []);

        // Build URLs list
        const sitemapUrls: SitemapUrl[] = [
          { loc: `${baseUrl}/`, lastmod: currentDate, changefreq: 'daily', priority: 1.0, images: 0, title: 'Página Inicial' },
          { loc: `${baseUrl}/imoveis`, lastmod: currentDate, changefreq: 'daily', priority: 0.9, images: 0, title: 'Lista de Imóveis' },
          { loc: `${baseUrl}/contact`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6, images: 0, title: 'Contato' },
          { loc: `${baseUrl}/nossa-equipe`, lastmod: currentDate, changefreq: 'monthly', priority: 0.5, images: 0, title: 'Nossa Equipe' },
        ];

        // Add properties
        if (propertiesData) {
          propertiesData.forEach((property: Property) => {
            if (property.slug) {
              const imageCount = property.images?.length || 0;
              sitemapUrls.push({
                loc: `${baseUrl}/imovel/${property.slug}`,
                lastmod: property.updated_at ? property.updated_at.split('T')[0] : currentDate,
                changefreq: 'weekly',
                priority: 0.7,
                images: imageCount,
                title: property.title
              });
            }
          });
        }

        setUrls(sitemapUrls);

        // If XML mode, render XML and exit
        if (isXmlMode && propertiesData) {
          const xmlContent = generateXmlContent(sitemapUrls, propertiesData);
          renderXmlInBrowser(xmlContent);
        }

      } catch (error) {
        console.error('Erro ao gerar sitemap:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSitemap();
  }, [tenant, tenantLoading, isXmlMode]);

  const generateXmlContent = (sitemapUrls: SitemapUrl[], propertiesData: Property[]): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    sitemapUrls.forEach(url => {
      xml += `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>`;

      // Add images for properties
      const property = propertiesData.find(p => url.loc.includes(p.slug));
      if (property?.images) {
        property.images.forEach(imageUrl => {
          xml += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(property.title)}</image:title>
    </image:image>`;
        });
      }

      xml += `
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  };

  const downloadXml = () => {
    window.open(`${window.location.origin}/sitemap.xml?format=xml`, '_blank');
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (priority >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const totalImages = urls.reduce((acc, url) => acc + url.images, 0);

  // If XML mode, show nothing (XML is rendered directly)
  if (isXmlMode) {
    return null;
  }

  // Loading state
  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando sitemap...</p>
        </div>
      </div>
    );
  }

  // HTML formatted view for humans
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Sitemap XML</h1>
          </div>
          <p className="text-primary-foreground/80">
            Mapa do site para mecanismos de busca • {tenant?.name || 'Site'}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Total de URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{urls.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Image className="h-4 w-4" />
                Total de Imagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{totalImages}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Última Atualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Download Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <span>Lista de todas as páginas indexáveis</span>
          </div>
          <Button onClick={downloadXml} className="gap-2">
            <Download className="h-4 w-4" />
            Download XML
          </Button>
        </div>

        {/* URLs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">URL</TableHead>
                  <TableHead className="font-semibold w-32">Última Mod.</TableHead>
                  <TableHead className="font-semibold w-28">Frequência</TableHead>
                  <TableHead className="font-semibold w-24">Prioridade</TableHead>
                  <TableHead className="font-semibold w-24 text-center">Imagens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.map((url, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {url.title && (
                          <span className="text-sm font-medium text-foreground">{url.title}</span>
                        )}
                        <a 
                          href={url.loc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 truncate max-w-md"
                        >
                          {url.loc}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {url.lastmod}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {url.changefreq}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPriorityColor(url.priority)}>
                        {url.priority.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {url.images > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <Image className="h-3 w-3" />
                          {url.images}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Este sitemap é gerado dinamicamente e atualizado automaticamente.</p>
          <p className="mt-1">
            Para uso em mecanismos de busca, acesse:{' '}
            <a 
              href={`${window.location.origin}/sitemap.xml?format=xml`}
              className="text-primary hover:underline"
            >
              {window.location.origin}/sitemap.xml?format=xml
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderXmlInBrowser(xmlContent: string): void {
  document.open('text/xml');
  document.write(xmlContent);
  document.close();
}

export default Sitemap;

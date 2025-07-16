import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const baseUrl = window.location.origin;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Buscar todas as propriedades ativas
        const { data: properties, error } = await supabase
          .from('properties')
          .select('slug, updated_at')
          .eq('status', 'active')
          .not('slug', 'is', null);

        if (error) {
          console.error('Erro ao buscar propriedades:', error);
          return;
        }

        // Gerar XML do sitemap
        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
${properties?.map(property => `  <url>
    <loc>${baseUrl}/imovel/${property.slug}</loc>
    <lastmod>${new Date(property.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

        // Definir content type e retornar XML
        const response = new Response(sitemapXml, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
        
        // Criar download do sitemap
        const blob = new Blob([sitemapXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Erro ao gerar sitemap:', error);
      }
    };

    generateSitemap();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Gerando Sitemap
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          O sitemap.xml está sendo gerado automaticamente...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default Sitemap;
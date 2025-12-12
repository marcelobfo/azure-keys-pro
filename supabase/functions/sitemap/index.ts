import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';
    
    // Detectar domínio: query param > X-Forwarded-Host > Origin > Referer > fallback
    let domain = url.searchParams.get('domain') || 
                 req.headers.get('x-forwarded-host') ||
                 req.headers.get('host') ||
                 '';
    
    // Extrair domínio do Origin/Referer se necessário
    if (!domain || domain.includes('supabase')) {
      const origin = req.headers.get('origin') || req.headers.get('referer') || '';
      if (origin) {
        try {
          const originUrl = new URL(origin);
          domain = originUrl.hostname;
        } catch {}
      }
    }

    // Fallback para domínio padrão
    if (!domain || domain.includes('supabase') || domain.includes('localhost')) {
      domain = 'techne.imobiliario.digital';
    }

    const siteUrl = `https://${domain}`;
    console.log(`Generating sitemap for domain: ${domain}, type: ${type}`);

    // Buscar tenant pelo domínio
    let tenantId: string | null = null;
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, domain')
      .eq('domain', domain)
      .maybeSingle();

    if (tenant) {
      tenantId = tenant.id;
      console.log(`Found tenant: ${tenantId} for domain: ${domain}`);
    } else {
      console.log(`No tenant found for domain: ${domain}, returning all properties`);
    }

    // Retornar baseado no tipo
    if (type === 'index') {
      return generateSitemapIndex(siteUrl);
    } else if (type === 'pages') {
      return generatePagesSitemap(siteUrl);
    } else if (type === 'properties') {
      return await generatePropertiesSitemap(supabase, siteUrl, tenantId);
    } else {
      // Default: sitemap completo (retrocompatibilidade)
      return await generateFullSitemap(supabase, siteUrl, tenantId);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating sitemap:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateSitemapIndex(siteUrl: string): Response {
  const today = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-properties.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function generatePagesSitemap(siteUrl: string): Response {
  const staticPages = [
    { loc: '', priority: '1.0', changefreq: 'daily' },
    { loc: '/imoveis', priority: '0.9', changefreq: 'daily' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/favoritos', priority: '0.6', changefreq: 'weekly' },
    { loc: '/alertas', priority: '0.6', changefreq: 'weekly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of staticPages) {
    xml += `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

async function generatePropertiesSitemap(
  supabase: any, 
  siteUrl: string, 
  tenantId: string | null
): Promise<Response> {
  let query = supabase
    .from('properties')
    .select('slug, updated_at, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  console.log(`Found ${properties?.length || 0} properties for sitemap`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  if (properties && properties.length > 0) {
    for (const property of properties) {
      if (property.slug) {
        const lastmod = property.updated_at || property.created_at || new Date().toISOString();
        const formattedDate = lastmod.split('T')[0];
        
        xml += `  <url>
    <loc>${siteUrl}/imovel/${property.slug}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

async function generateFullSitemap(
  supabase: any, 
  siteUrl: string, 
  tenantId: string | null
): Promise<Response> {
  let query = supabase
    .from('properties')
    .select('slug, updated_at, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  console.log(`Found ${properties?.length || 0} active properties`);

  const staticPages = [
    { loc: '', priority: '1.0', changefreq: 'daily' },
    { loc: '/imoveis', priority: '0.9', changefreq: 'daily' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/favoritos', priority: '0.6', changefreq: 'weekly' },
    { loc: '/alertas', priority: '0.6', changefreq: 'weekly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of staticPages) {
    xml += `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  if (properties && properties.length > 0) {
    for (const property of properties) {
      if (property.slug) {
        const lastmod = property.updated_at || property.created_at || new Date().toISOString();
        const formattedDate = lastmod.split('T')[0];
        
        xml += `  <url>
    <loc>${siteUrl}/imovel/${property.slug}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

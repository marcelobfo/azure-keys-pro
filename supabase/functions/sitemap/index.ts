import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domínio base para detecção de subdomínios
const BASE_DOMAIN = 'techmoveis.com.br';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'full';
    
    // Detectar domínio: query param > X-Forwarded-Host > Origin > Referer
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

    // Remover www. se presente
    domain = domain.replace(/^www\./, '');

    console.log(`Processing sitemap request for domain: ${domain}, type: ${type}`);

    // Buscar tenant - tentar múltiplas estratégias
    let tenantId: string | null = null;
    let tenantSlug: string | null = null;
    let siteUrl = `https://${domain}`;

    // Estratégia 1: Verificar se é um subdomínio do BASE_DOMAIN
    if (domain.endsWith(`.${BASE_DOMAIN}`)) {
      const slug = domain.replace(`.${BASE_DOMAIN}`, '');
      console.log(`Detected subdomain slug: ${slug}`);
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, slug, domain')
        .eq('slug', slug)
        .maybeSingle();

      if (tenant) {
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
        console.log(`Found tenant by slug: ${tenantId}`);
      }
    }

    // Estratégia 2: Buscar por domínio customizado
    if (!tenantId && domain && !domain.includes('localhost') && !domain.includes('supabase') && !domain.includes('lovable')) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, slug, domain')
        .ilike('domain', domain)
        .maybeSingle();

      if (tenant) {
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
        siteUrl = `https://${tenant.domain}`;
        console.log(`Found tenant by custom domain: ${tenantId}`);
      }
    }

    // Estratégia 3: Verificar query param tenant_id ou slug
    const paramTenantId = url.searchParams.get('tenant_id');
    const paramSlug = url.searchParams.get('slug');
    
    if (!tenantId && (paramTenantId || paramSlug)) {
      let query = supabase.from('tenants').select('id, slug, domain');
      
      if (paramTenantId) {
        query = query.eq('id', paramTenantId);
      } else if (paramSlug) {
        query = query.eq('slug', paramSlug);
      }
      
      const { data: tenant } = await query.maybeSingle();
      
      if (tenant) {
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
        // Usar domínio do tenant se disponível
        if (tenant.domain) {
          siteUrl = `https://${tenant.domain}`;
        } else {
          siteUrl = `https://${tenant.slug}.${BASE_DOMAIN}`;
        }
        console.log(`Found tenant by param: ${tenantId}`);
      }
    }

    console.log(`Final tenant resolution - ID: ${tenantId}, Slug: ${tenantSlug}, SiteURL: ${siteUrl}`);

    // Retornar baseado no tipo
    if (type === 'index') {
      return generateSitemapIndex(siteUrl);
    } else if (type === 'pages') {
      return generatePagesSitemap(siteUrl);
    } else if (type === 'properties') {
      return await generatePropertiesSitemap(supabase, siteUrl, tenantId);
    } else {
      // Default: sitemap completo
      return await generateFullSitemap(supabase, siteUrl, tenantId);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating sitemap:', errorMessage);
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error generating sitemap: ${errorMessage} -->
</urlset>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
});

function generateSitemapIndex(siteUrl: string): Response {
  const today = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml?type=pages</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap.xml?type=properties</loc>
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
  const today = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { loc: '', priority: '1.0', changefreq: 'daily' },
    { loc: '/imoveis', priority: '0.9', changefreq: 'daily' },
    { loc: '/imoveis?purpose=sale', priority: '0.8', changefreq: 'daily' },
    { loc: '/imoveis?purpose=rent', priority: '0.8', changefreq: 'daily' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/nossa-equipe', priority: '0.6', changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of staticPages) {
    xml += `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
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
    .select('slug, updated_at, created_at, images')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  console.log(`Found ${properties?.length || 0} properties for sitemap`);

  // Usar sitemap com imagens para melhor SEO
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
`;
        
        // Adicionar imagens do imóvel (máximo 5 para não sobrecarregar)
        if (property.images && Array.isArray(property.images)) {
          const images = property.images.slice(0, 5);
          for (const imageUrl of images) {
            if (imageUrl && typeof imageUrl === 'string') {
              xml += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>
`;
            }
          }
        }
        
        xml += `  </url>
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
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('properties')
    .select('slug, updated_at, created_at, images, title')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: properties, error } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }

  console.log(`Found ${properties?.length || 0} active properties for tenant: ${tenantId || 'all'}`);

  const staticPages = [
    { loc: '', priority: '1.0', changefreq: 'daily' },
    { loc: '/imoveis', priority: '0.9', changefreq: 'daily' },
    { loc: '/imoveis?purpose=sale', priority: '0.8', changefreq: 'daily' },
    { loc: '/imoveis?purpose=rent', priority: '0.8', changefreq: 'daily' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/nossa-equipe', priority: '0.6', changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Páginas estáticas
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Imóveis
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
`;
        
        // Adicionar imagens do imóvel
        if (property.images && Array.isArray(property.images)) {
          const images = property.images.slice(0, 5);
          for (const imageUrl of images) {
            if (imageUrl && typeof imageUrl === 'string') {
              xml += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(property.title || 'Imóvel')}</image:title>
    </image:image>
`;
            }
          }
        }
        
        xml += `  </url>
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

// Função para escapar caracteres especiais em XML
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

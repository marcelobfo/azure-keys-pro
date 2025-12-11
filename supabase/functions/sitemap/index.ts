import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the site URL from request headers or use default
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('site_url') || 'https://techne.imobiliario.digital';

    console.log('Generating sitemap for:', siteUrl);

    // Fetch all active properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('slug, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    console.log(`Found ${properties?.length || 0} active properties`);

    // Static pages
    const staticPages = [
      { loc: '', priority: '1.0', changefreq: 'daily' },
      { loc: '/imoveis', priority: '0.9', changefreq: 'daily' },
      { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
      { loc: '/favoritos', priority: '0.6', changefreq: 'weekly' },
      { loc: '/alertas', priority: '0.6', changefreq: 'weekly' },
    ];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add property pages
    if (properties && properties.length > 0) {
      for (const property of properties) {
        if (property.slug) {
          const lastmod = property.updated_at || property.created_at || new Date().toISOString();
          const formattedDate = lastmod.split('T')[0]; // Format: YYYY-MM-DD
          
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

    console.log('Sitemap generated successfully');

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

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

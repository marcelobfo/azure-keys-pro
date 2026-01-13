import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detectar se é um bot/crawler
function isBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'WhatsApp',
    'Twitterbot',
    'LinkedInBot',
    'Googlebot',
    'bingbot',
    'Slackbot',
    'TelegramBot',
    'Discordbot',
    'Pinterest',
    'Embedly',
    'Quora Link Preview',
    'Showyoubot',
    'outbrain',
    'vkShare',
    'W3C_Validator',
    'redditbot',
    'Applebot',
    'Slurp',
    'DuckDuckBot',
  ];
  
  return botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent') || '';
    
    // Se não for bot, redireciona para a SPA
    if (!isBot(userAgent)) {
      // Detectar domínio original
      const forwardedHost = req.headers.get('x-forwarded-host') || 
                           req.headers.get('host') || 
                           'localhost';
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${protocol}://${forwardedHost}/index.html`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Para bots, buscar dados do tenant e retornar HTML com OG tags
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detectar domínio do tenant
    let domain = req.headers.get('x-forwarded-host') || 
                 req.headers.get('host') || 
                 '';
    
    // Normalizar domínio (remover www. e porta)
    domain = domain.replace(/^www\./, '').split(':')[0];
    
    console.log(`[og-home] Processing request for domain: ${domain}, User-Agent: ${userAgent.substring(0, 50)}`);

    // Buscar tenant pelo domínio
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, domain, logo_url')
      .or(`domain.ilike.%${domain}%,slug.eq.${domain.split('.')[0]}`)
      .maybeSingle();

    if (tenantError) {
      console.error('[og-home] Error fetching tenant:', tenantError);
    }

    console.log(`[og-home] Found tenant:`, tenant?.name || 'none');

    // Buscar configurações do site
    let siteSettings: Record<string, string> = {};
    
    if (tenant?.id) {
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('tenant_id', tenant.id);

      if (settingsError) {
        console.error('[og-home] Error fetching settings:', settingsError);
      } else if (settings) {
        siteSettings = settings.reduce((acc, s) => {
          if (s.key && s.value) acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Montar dados para OG tags com fallbacks inteligentes
    const siteName = siteSettings['site_name'] || tenant?.name || 'Imobiliária';
    const siteTitle = siteSettings['site_title'] || `${siteName} - Imóveis`;
    const siteDescription = siteSettings['site_description'] || 
      siteSettings['meta_description'] ||
      `Encontre o imóvel dos seus sonhos com a ${siteName}. Casas, apartamentos, terrenos e muito mais.`;
    
    // Imagem: priorizar og_image > header_logo_light > logo_url do tenant
    let ogImage = siteSettings['og_image'] || 
                  siteSettings['header_logo_light'] || 
                  siteSettings['logo_url'] ||
                  tenant?.logo_url ||
                  '';

    // Se não tiver imagem, usar um placeholder
    if (!ogImage) {
      ogImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop';
    }

    // URL canônica
    const canonicalUrl = `https://${domain}`;

    console.log(`[og-home] Generating OG for: ${siteName}, image: ${ogImage.substring(0, 50)}...`);

    // Gerar HTML com meta tags OG
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${siteTitle}</title>
  <meta name="title" content="${siteTitle}">
  <meta name="description" content="${siteDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${siteTitle}">
  <meta property="og:description" content="${siteDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${canonicalUrl}">
  <meta property="twitter:title" content="${siteTitle}">
  <meta property="twitter:description" content="${siteDescription}">
  <meta property="twitter:image" content="${ogImage}">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:alt" content="${siteName}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect for browsers that somehow reach this -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}/index.html">
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loading {
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="loading">
    <p>Redirecionando para ${siteName}...</p>
  </div>
  <script>
    window.location.href = '${canonicalUrl}/index.html';
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });

  } catch (error) {
    console.error('[og-home] Error:', error);
    
    // Em caso de erro, redirecionar para a SPA
    const forwardedHost = req.headers.get('x-forwarded-host') || 
                         req.headers.get('host') || 
                         'localhost';
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://${forwardedHost}/index.html`,
      },
    });
  }
});

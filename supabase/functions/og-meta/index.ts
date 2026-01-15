import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const identifier = url.searchParams.get('slug')

    if (!identifier) {
      return new Response('Slug is required', { status: 400, headers: corsHeaders })
    }

    const isUUID = (value: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(value)
    }

    // Detectar o domínio dinamicamente
    const forwardedHost = req.headers.get('x-forwarded-host')
    const host = req.headers.get('host')
    const origin = req.headers.get('origin')

    // Determinar o domínio base para redirecionamento
    let baseDomain = forwardedHost || host || ''

    // Remover porta se presente
    if (baseDomain.includes(':')) {
      baseDomain = baseDomain.split(':')[0]
    }

    // Se não tiver domínio válido, usar origin ou fallback
    if (!baseDomain || baseDomain.includes('supabase') || baseDomain.includes('edge-runtime')) {
      if (origin) {
        try {
          baseDomain = new URL(origin).hostname
        } catch {
          baseDomain = 'localhost'
        }
      } else {
        baseDomain = 'localhost'
      }
    }

    // Determinar protocolo
    const protocol = baseDomain === 'localhost' ? 'http' : 'https'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados do imóvel (aceita slug OU uuid)
    const selectFields =
      'id, title, description, price, city, location, property_type, images, bedrooms, bathrooms, area, slug, tenant_id'

    let propQuery = supabase
      .from('properties')
      .select(selectFields)
      .eq('status', 'active')

    propQuery = isUUID(identifier) ? propQuery.eq('id', identifier) : propQuery.eq('slug', identifier)

    const { data: property, error } = await propQuery.single()

    if (error || !property) {
      console.error('Property not found:', { identifier, error })
      return new Response('Property not found', { status: 404, headers: corsHeaders })
    }

    // Buscar configurações do site
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['company_name', 'meta_description', 'header_logo_light'])

    const settings: Record<string, string> = {}
    siteSettings?.forEach((s: { key: string; value: string | null }) => {
      if (s.value) settings[s.key] = s.value
    })

    const companyName = settings.company_name || 'Imobiliária'
    const siteLogo = settings.header_logo_light || ''

    // Formatar preço
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(property.price)

    // Criar descrição
    const specs = []
    if (property.bedrooms) specs.push(`${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`)
    if (property.bathrooms) specs.push(`${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`)
    if (property.area) specs.push(`${property.area}m²`)

    const description = property.description
      ? property.description.substring(0, 155) + '...'
      : `${property.property_type} em ${property.location}, ${property.city}. ${specs.join(', ')}. ${formattedPrice}`

    // URL do imóvel (redireciona para a SPA)
    // Importante: quando /share/:slug é um rewrite (Vercel), o host visto aqui pode ser o domínio do Supabase.
    // Então resolvemos o domínio real via tenant do imóvel (quando disponível).
    const normalizeBaseUrl = (input: string): string | null => {
      const trimmed = input.trim().replace(/\/+$/, '')
      try {
        return new URL(trimmed).origin
      } catch {
        try {
          return new URL(`https://${trimmed}`).origin
        } catch {
          return null
        }
      }
    }

    let spaBaseUrl = `${protocol}://${baseDomain}`

    if (property.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('domain, redirect_url')
        .eq('id', property.tenant_id)
        .maybeSingle()

      const candidate = tenant?.redirect_url || tenant?.domain || ''
      const resolved = candidate ? normalizeBaseUrl(candidate) : null
      if (resolved) spaBaseUrl = resolved
    }

    // Sempre redirecionar para um identificador válido (slug preferencialmente)
    const redirectIdentifier = property.slug || property.id
    const spaUrl = `${spaBaseUrl.replace(/\/+$/, '')}/imovel/${redirectIdentifier}`

    console.log('Share redirect resolved:', {
      identifier,
      redirectIdentifier,
      forwardedHost,
      host,
      origin,
      baseDomain,
      protocol,
      spaBaseUrl,
      spaUrl,
      tenant_id: property.tenant_id,
    })
    
    // Imagem (usar primeira imagem do imóvel ou logo do site)
    const ogImage = property.images && property.images.length > 0 
      ? property.images[0] 
      : siteLogo

    const title = `${property.title} | ${companyName}`

    // HTML com meta tags para bots
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${spaUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${companyName}">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${spaUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImage}">
  
  <!-- Product Info -->
  <meta property="product:price:amount" content="${property.price}">
  <meta property="product:price:currency" content="BRL">
  
  <!-- Canonical -->
  <link rel="canonical" href="${spaUrl}">
  
  <!-- Redirect to SPA -->
  <meta http-equiv="refresh" content="0;url=${spaUrl}">
  <script>window.location.href = "${spaUrl}";</script>
</head>
<body>
  <h1>${property.title}</h1>
  <p>${description}</p>
  <p>Preço: ${formattedPrice}</p>
  <p>Localização: ${property.location}, ${property.city}</p>
  ${ogImage ? `<img src="${ogImage}" alt="${property.title}">` : ''}
  <a href="${spaUrl}">Ver imóvel</a>
</body>
</html>`

    console.log('Serving OG meta for:', identifier, '- Redirect:', spaUrl, '- Title:', title)

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Error in og-meta function:', error)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})

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
    const slug = url.searchParams.get('slug')
    
    if (!slug) {
      return new Response('Slug is required', { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados do imóvel
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, title, description, price, city, location, property_type, images, bedrooms, bathrooms, area, slug')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !property) {
      console.error('Property not found:', error)
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
    const spaUrl = `https://maresia-litoral.lovable.app/imovel/${slug}`
    
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

    console.log('Serving OG meta for:', slug, '- Title:', title)

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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  console.log('Gemini Enhanced - Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      context, 
      sessionId,
      systemInstruction,
      temperature = 0.7,
      topP = 0.9,
      maxOutputTokens = 1000,
      model = 'gemini-2.0-flash-exp'
    } = await req.json();
    
    console.log('Gemini Enhanced - Processing:', {
      messageLength: message?.length,
      sessionId,
      model,
      temperature,
      topP,
      maxOutputTokens,
      hasSystemInstruction: !!systemInstruction
    });

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY não configurada');
      throw new Error('API key do Gemini não configurada');
    }

    // Buscar contexto do site - imóveis e informações
    console.log('Buscando contexto do site...');
    const { data: siteContext, error: siteError } = await supabase
      .rpc('get_site_context_for_ai');

    if (siteError) {
      console.error('Erro ao buscar contexto do site:', siteError);
    }

    // Buscar imóveis específicos se a mensagem mencionar códigos ou termos de busca
    let specificProperties = [];
    const propertyCodeMatch = message.match(/[A-Z]{2}-\d{3}/g);
    const searchTerms = extractSearchTerms(message);
    
    if (propertyCodeMatch || searchTerms.hasTerms) {
      console.log('Buscando imóveis específicos...');
      const { data: properties, error: propError } = await supabase
        .rpc('search_properties_for_ai', {
          search_type: searchTerms.type,
          search_city: searchTerms.city,
          min_price: searchTerms.minPrice,
          max_price: searchTerms.maxPrice,
          min_bedrooms: searchTerms.minBedrooms,
          property_type_filter: searchTerms.propertyType
        });

      if (!propError && properties) {
        specificProperties = properties.slice(0, 5); // Limitar a 5 imóveis
      }
    }

    // Construir contexto enriquecido
    const enrichedContext = buildEnrichedContext(siteContext, specificProperties, context);
    
    console.log('Contexto enriquecido criado:', {
      hasProperties: specificProperties.length > 0,
      totalProperties: siteContext?.total_properties || 0,
      featuredCount: siteContext?.featured_properties?.length || 0
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure generation parameters
    const generationConfig = {
      temperature: Math.max(0, Math.min(2, temperature)),
      topP: Math.max(0.1, Math.min(1, topP)),
      maxOutputTokens: Math.max(1, Math.min(4000, maxOutputTokens)),
    };

    console.log('Gemini Enhanced - Using generation config:', generationConfig);

    const enhancedSystemInstruction = buildSystemInstruction(enrichedContext, systemInstruction);

    const modelInstance = genAI.getGenerativeModel({ 
      model: model || 'gemini-2.0-flash-exp',
      generationConfig,
      systemInstruction: enhancedSystemInstruction
    });

    const result = await modelInstance.generateContent(message);
    const response = result.response;
    const text = response.text();

    console.log('Gemini Enhanced - Response generated:', {
      responseLength: text.length,
      sessionId,
      containsPropertyInfo: text.includes('imóvel') || text.includes('propriedade')
    });

    return new Response(
      JSON.stringify({ 
        response: text,
        sessionId,
        model: model || 'gemini-2.0-flash-exp',
        usedConfig: generationConfig,
        contextUsed: {
          siteData: !!siteContext,
          specificProperties: specificProperties.length,
          totalProperties: siteContext?.total_properties || 0
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro no Gemini Enhanced chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})

function extractSearchTerms(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Detectar tipo de propriedade
  let type = null;
  if (lowerMessage.includes('apartamento') || lowerMessage.includes('ap ')) {
    type = 'apartamento';
  } else if (lowerMessage.includes('casa')) {
    type = 'casa';
  } else if (lowerMessage.includes('cobertura')) {
    type = 'cobertura';
  } else if (lowerMessage.includes('lote')) {
    type = 'lote';
  }

  // Detectar cidades comuns
  let city = null;
  const cities = ['são paulo', 'rio de janeiro', 'belo horizonte', 'salvador', 'brasília', 'fortaleza', 'recife'];
  for (const c of cities) {
    if (lowerMessage.includes(c)) {
      city = c;
      break;
    }
  }

  // Detectar preços
  let minPrice = null;
  let maxPrice = null;
  const priceMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(?:mil|k|milhões?)/gi);
  if (priceMatch) {
    const prices = priceMatch.map(p => {
      const num = parseFloat(p.replace(/[^\d.]/g, ''));
      if (p.includes('milhões') || p.includes('milhão')) {
        return num * 1000000;
      } else if (p.includes('mil') || p.includes('k')) {
        return num * 1000;
      }
      return num;
    });
    
    if (prices.length === 1) {
      maxPrice = prices[0];
    } else if (prices.length === 2) {
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
  }

  // Detectar quartos
  let minBedrooms = null;
  const bedroomMatch = lowerMessage.match(/(\d+)\s*(?:quartos?|dormitórios?)/i);
  if (bedroomMatch) {
    minBedrooms = parseInt(bedroomMatch[1]);
  }

  return {
    hasTerms: !!(type || city || minPrice || maxPrice || minBedrooms),
    type,
    city,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType: type
  };
}

function buildEnrichedContext(siteContext: any, specificProperties: any[], originalContext: any) {
  const context = {
    site: siteContext || {},
    properties: {
      specific: specificProperties,
      featured: siteContext?.featured_properties || [],
      total: siteContext?.total_properties || 0,
      types: siteContext?.property_types || [],
      cities: siteContext?.cities || [],
      priceRange: siteContext?.price_ranges || {}
    },
    services: siteContext?.site_info?.services || [],
    original: originalContext || {}
  };

  return context;
}

function buildSystemInstruction(context: any, originalInstruction?: string) {
  const baseInstruction = originalInstruction || `
Você é um assistente virtual especializado em imóveis. Você é profissional, prestativo e tem conhecimento completo sobre o portfólio de imóveis da empresa.

INFORMAÇÕES IMPORTANTES:
- Total de imóveis ativos: ${context.properties.total}
- Tipos de imóveis disponíveis: ${context.properties.types.join(', ')}
- Cidades atendidas: ${context.properties.cities.join(', ')}
- Faixa de preços: R$ ${context.properties.priceRange.min_price?.toLocaleString('pt-BR')} - R$ ${context.properties.priceRange.max_price?.toLocaleString('pt-BR')}

SUAS PRINCIPAIS FUNÇÕES:
1. 📋 CONSULTA DE IMÓVEIS: Ajude clientes a encontrar imóveis ideais
2. 📅 AGENDAMENTO: Ofereça agendamento de visitas quando apropriado
3. 🤝 TRANSFERÊNCIA: Transfira para atendente humano quando solicitado
4. 💬 SUPORTE: Forneça informações precisas e úteis

INSTRUÇÕES ESPECÍFICAS:
- Seja OBJETIVO e DIRETO nas respostas
- Sempre mencione códigos dos imóveis quando relevante
- Ofereça agendamento de visitas quando o cliente demonstrar interesse
- Use dados REAIS dos imóveis disponíveis
- Quando não souber algo específico, seja honesto e ofereça transferência

DADOS DISPONÍVEIS:
${context.properties.specific.length > 0 ? `
IMÓVEIS ESPECÍFICOS ENCONTRADOS:
${context.properties.specific.map((prop: any) => `
- ${prop.property_type} ${prop.title}
  Código: ${prop.id.toString().slice(0, 8)}
  Preço: R$ ${prop.price?.toLocaleString('pt-BR')}
  Local: ${prop.location}, ${prop.city}
  ${prop.bedrooms} quartos, ${prop.bathrooms} banheiros
  Área: ${prop.area}m²
  ${prop.description?.substring(0, 200)}...
`).join('\n')}
` : ''}

${context.properties.featured.length > 0 ? `
IMÓVEIS EM DESTAQUE:
${context.properties.featured.slice(0, 3).map((prop: any) => `
- ${prop.property_type} ${prop.title}
  Preço: R$ ${prop.price?.toLocaleString('pt-BR')}
  Local: ${prop.location}, ${prop.city}
  ${prop.bedrooms} quartos, ${prop.bathrooms} banheiros
`).join('\n')}
` : ''}

SERVIÇOS OFERECIDOS:
${context.services.join('\n- ')}

Responda sempre em português brasileiro, seja objetivo e profissional.
`;

  return baseInstruction;
}
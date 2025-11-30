import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, sessionId, chatHistory, systemInstruction, temperature, topP, maxOutputTokens, model, ...otherParams } = await req.json();
    console.log('Gemini Chat Enhanced - Received request:', { message, sessionId, chatHistory: chatHistory?.length || 0, temperature, topP, maxOutputTokens, model });

    // Try to get API key from database first, fallback to env
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    try {
      const { data: config } = await supabase
        .from('chat_configurations')
        .select('gemini_api_key')
        .eq('active', true)
        .single();
      
      if (config?.gemini_api_key) {
        geminiApiKey = config.gemini_api_key;
        console.log('Using Gemini API key from database');
      }
    } catch (error) {
      console.warn('Could not fetch API key from database, using env variable:', error);
    }
    
    if (!geminiApiKey) {
      throw new Error('API key do Gemini não configurada. Configure em Admin > Configurações do Chat');
    }

    // Get site context and search for relevant properties  
    const { data: siteContext } = await supabase.rpc('get_site_context_for_ai');
    console.log('Site context loaded:', siteContext);

    // Extract search terms from message
    const searchTerms = extractSearchTerms(message);
    console.log('Extracted search terms:', searchTerms);

    let relevantProperties = null;
    if (searchTerms.hasPropertyTerms) {
      const { data: properties } = await supabase.rpc('search_properties_for_ai', {
        property_type_filter: searchTerms.propertyType,
        city_filter: searchTerms.city,
        min_price_filter: searchTerms.minPrice,
        max_price_filter: searchTerms.maxPrice,
        min_bedrooms_filter: searchTerms.minBedrooms,
        max_bedrooms_filter: searchTerms.maxBedrooms,
        limit_count: 8
      });
      relevantProperties = properties;
      console.log('Found relevant properties:', relevantProperties?.length || 0);
      
      // If no properties found with specific filters, try a broader search
      if (!relevantProperties || relevantProperties.length === 0) {
        console.log('No properties found with specific filters, trying broader search...');
        const { data: broadProperties } = await supabase.rpc('search_properties_for_ai', {
          property_type_filter: searchTerms.propertyType,
          city_filter: null, // Remove city filter
          min_price_filter: null,
          max_price_filter: null,
          min_bedrooms_filter: null,
          max_bedrooms_filter: null,
          limit_count: 6
        });
        relevantProperties = broadProperties;
        console.log('Broader search found:', relevantProperties?.length || 0);
      }
    }

    // Get/update session memory if sessionId provided
    let sessionMemory = {};
    if (sessionId) {
      const { data: memoryData } = await supabase
        .from('chat_context_memory')
        .select('key, value')
        .eq('session_id', sessionId);
      
      if (memoryData) {
        sessionMemory = memoryData.reduce((acc: any, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
      }
      console.log('Loaded session memory:', sessionMemory);
    }

    // Build enhanced context
    const enhancedContext = buildEnrichedContext(siteContext, relevantProperties, {
      ...context,
      memory: sessionMemory
    });

    // Extrair nome do cliente para o histórico
    const clientName = context?.clientName || 'Cliente';

    // Converter histórico para formato Gemini
    const geminiHistory = convertToGeminiHistory(chatHistory || [], clientName);
    console.log('Chat history loaded:', geminiHistory.length, 'messages');

    // Build system instruction  
    const finalSystemInstruction = systemInstruction || buildSystemInstruction(enhancedContext);

    // Initialize Gemini AI with enhanced context
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const modelInstance = genAI.getGenerativeModel({
      model: model || "gemini-2.5-flash",
      generationConfig: {
        temperature: temperature !== undefined ? temperature : 1.0,
        topP: topP !== undefined ? topP : 0.95,
        maxOutputTokens: maxOutputTokens || 800,
      },
      systemInstruction: finalSystemInstruction
    });

    console.log('Generating AI response with chat history...');
    
    // Usar startChat com histórico para manter contexto
    const chat = modelInstance.startChat({
      history: geminiHistory
    });

    // Enviar mensagem atual e obter resposta
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();
    console.log('Gemini response generated:', aiResponse.substring(0, 100) + '...');

    // Check if user wants to schedule a visit
    if (aiResponse.includes('[SCHEDULE_VISIT]') && sessionId) {
      console.log('Visit scheduling detected');
      const visitMatch = aiResponse.match(/\[SCHEDULE_VISIT:([^\]]+)\]/);
      if (visitMatch) {
        try {
          const visitData = JSON.parse(visitMatch[1]);
          await scheduleVisitFromBot(sessionId, visitData);
        } catch (parseError) {
          console.error('Error parsing visit data:', parseError);
        }
      }
    }

    // Check if user wants to transfer to human
    if (aiResponse.includes('[TRANSFER_TO_HUMAN]') && sessionId) {
      console.log('Human transfer detected');
      await transferToHuman(sessionId);
    }

    // Update session memory if needed
    if (sessionId) {
      await updateSessionMemory(sessionId, message, aiResponse, searchTerms);
    }

    return new Response(JSON.stringify({
      response: aiResponse.replace(/\[(SCHEDULE_VISIT|TRANSFER_TO_HUMAN)[^\]]*\]/g, '').trim(),
      sessionId,
      context: enhancedContext
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Gemini chat enhanced:', error);
    return new Response(JSON.stringify({
      error: 'Desculpe, ocorreu um erro. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para converter histórico para formato Gemini
function convertToGeminiHistory(chatHistory: any[], clientName: string): any[] {
  if (!chatHistory || chatHistory.length === 0) return [];
  
  return chatHistory.map(msg => ({
    role: msg.sender_type === 'lead' ? 'user' : 'model',
    parts: [{ text: msg.message }]
  }));
}

function extractSearchTerms(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Expanded property-related keywords
  const propertyKeywords = [
    'imóvel', 'imóveis', 'propriedade', 'propriedades',
    'casa', 'casas', 'apartamento', 'apartamentos', 'cobertura', 'coberturas',
    'lote', 'lotes', 'studio', 'studios', 'loft', 'lofts',
    'comprar', 'vender', 'alugar', 'locação', 'venda',
    'disponível', 'disponíveis', 'catálogo', 'portfólio',
    'quero', 'procuro', 'busco', 'interesse', 'tenho interesse'
  ];
  
  // Property types
  const propertyTypes = ['casa', 'apartamento', 'cobertura', 'lote', 'studio', 'loft'];
  const foundType = propertyTypes.find(type => lowerMessage.includes(type));
  
  // Expanded cities - should be dynamically loaded from database in production
  const cities = [
    'balneário camboriú', 'camboriú', 'itajaí', 'florianópolis', 'joinville',
    'blumenau', 'são josé', 'palhoça', 'biguaçu', 'tijucas',
    'porto belo', 'bombinhas', 'navegantes', 'penha'
  ];
  const foundCity = cities.find(city => lowerMessage.includes(city));
  
  // Price detection - improved patterns
  let minPrice: number | null = null, maxPrice: number | null = null;
  const pricePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:mil|k)/gi,
    /(\d+(?:\.\d+)?)\s*(?:milhão|milhões|mi)/gi,
    /r\$\s*(\d+(?:\.\d+)?)/gi,
    /até\s*(?:r\$\s*)?(\d+(?:\.\d+)?)\s*(?:mil|milhão|k|mi)?/gi,
    /entre\s*(?:r\$\s*)?(\d+(?:\.\d+)?)\s*(?:e|até)\s*(?:r\$\s*)?(\d+(?:\.\d+)?)/gi
  ];
  
  for (const pattern of pricePatterns) {
    const matches = [...message.matchAll(pattern)];
    if (matches.length > 0) {
      matches.forEach(match => {
        const num = parseFloat(match[1]);
        let value = num;
        
        // Convert based on context
        if (match[0].includes('mil') || match[0].includes('k')) {
          value = num * 1000;
        } else if (match[0].includes('milhão') || match[0].includes('mi')) {
          value = num * 1000000;
        } else if (num < 10000) {
          // Assume thousands if less than 10k
          value = num * 1000;
        }
        
        if (match[0].includes('até')) {
          maxPrice = value;
        } else if (!minPrice || value < minPrice) {
          if (maxPrice) {
            minPrice = Math.min(value, maxPrice);
            maxPrice = Math.max(value, maxPrice);
          } else {
            maxPrice = value;
          }
        }
      });
    }
  }
  
  // Bedrooms detection - improved
  let minBedrooms = null;
  const bedroomPatterns = [
    /(\d+)\s*(?:quarto|quartos|dormitório|dormitórios|qto|qtos)/gi,
    /(\d+)\s*(?:bed|beds|br)/gi
  ];
  
  for (const pattern of bedroomPatterns) {
    const match = message.match(pattern);
    if (match) {
      minBedrooms = parseInt(match[1]);
      break;
    }
  }
  
  // Check if message contains any property-related terms or is a general inquiry
  const hasPropertyTerms = propertyKeywords.some(keyword => lowerMessage.includes(keyword)) ||
                          foundType || foundCity || minPrice || maxPrice || minBedrooms ||
                          // General questions that should trigger property search
                          lowerMessage.includes('que') && (lowerMessage.includes('tem') || lowerMessage.includes('têm')) ||
                          lowerMessage.includes('mostrar') || lowerMessage.includes('ver') ||
                          lowerMessage.includes('opções') || lowerMessage.includes('opção');

  console.log('Enhanced search terms analysis:', {
    message: lowerMessage,
    foundKeywords: propertyKeywords.filter(k => lowerMessage.includes(k)),
    hasPropertyTerms,
    foundType,
    foundCity,
    priceRange: { minPrice, maxPrice },
    bedrooms: minBedrooms
  });

  return {
    propertyType: foundType,
    city: foundCity,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms: null,
    hasPropertyTerms
  };
}

function buildEnrichedContext(siteContext: any, specificProperties: any[], originalContext: any) {
  return {
    site: siteContext,
    properties: specificProperties,
    original: originalContext
  };
}

function buildSystemInstruction(context: any): string {
  const { site, properties, original } = context;
  const memory = original?.memory || {};
  
  // Extrair dados do cliente
  const clientName = original?.clientName || 'Cliente';
  const clientEmail = original?.clientEmail;
  const subject = original?.subject;
  const initialMessage = original?.initialMessage;
  
  let instruction = `Você é Alice, consultora imobiliária virtual da ${site?.company || 'Imobiliária'}.

**DADOS DO CLIENTE:**
- Nome: ${clientName}
${clientEmail ? `- Email: ${clientEmail}` : ''}
${subject ? `- Assunto de interesse: ${subject}` : ''}
${initialMessage ? `- Pergunta/Mensagem inicial: "${initialMessage}"` : ''}

**REGRAS CRÍTICAS:**
1. SEMPRE chame o cliente pelo nome "${clientName}" nas suas respostas
2. NUNCA pergunte o nome - você já tem essa informação
3. Na primeira resposta, RESPONDA DIRETAMENTE à pergunta/dúvida inicial do cliente
4. Seja OBJETIVA e PRÁTICA
5. Respostas curtas (máximo 3 parágrafos)
6. SEMPRE ofereça ações concretas (agendar visita, ver mais detalhes, falar com especialista)
7. Use dados REAIS do sistema - os imóveis abaixo são dados verdadeiros

**DADOS DA EMPRESA:**
${site?.company ? `Empresa: ${site.company}` : ''}
${site?.phone ? `Telefone: ${site.phone}` : ''}
${site?.email ? `Email: ${site.email}` : ''}

**HORÁRIO DE ATENDIMENTO:**
${site?.business_hours ? site.business_hours.map((h: any) => 
  `${getDayName(h.day)}: ${h.start_time} às ${h.end_time}`
).join('\n') : 'Consulte nossa equipe'}

**AÇÕES DISPONÍVEIS:**

1. **BUSCAR IMÓVEIS**: Quando solicitado, use os dados reais:
${properties ? `
IMÓVEIS ENCONTRADOS (${properties.length}):
${properties.map((p: any) => `
🏠 **${p.title}** - ${p.property_code}
📍 ${p.location}
💰 R$ ${p.price?.toLocaleString('pt-BR')}
🛏️ ${p.bedrooms} quartos | 🚿 ${p.bathrooms} banheiros  
📐 ${p.area}m²
🔗 /imovel/${p.slug}
`).join('\n')}
` : 'Sem imóveis encontrados com esses critérios.'}

2. **AGENDAR VISITA**: Quando cliente quiser visitar, colete:
- Nome completo
- Telefone
- Email  
- Data preferida (formato YYYY-MM-DD)
- Horário preferido (formato HH:MM)
- Imóvel de interesse

Após coletar TODOS os dados, adicione: [SCHEDULE_VISIT:{"property_id":"ID","client_name":"Nome","client_email":"email","client_phone":"phone","visit_date":"YYYY-MM-DD","visit_time":"HH:MM"}]

3. **FALAR COM HUMANO**: Se cliente pedir, responda:
"Vou conectar você com um de nossos especialistas. Aguarde um momento..."
E adicione: [TRANSFER_TO_HUMAN]

**MEMÓRIA DA CONVERSA:**
${Object.keys(memory).length > 0 ? JSON.stringify(memory, null, 2) : 'Primeira interação'}

Mantenha o foco e seja eficiente!`;

  return instruction;
}

function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day] || 'Dia inválido';
}

async function scheduleVisitFromBot(sessionId: string, visitData: any) {
  try {
    console.log('Scheduling visit from bot:', visitData);
    
    const { error } = await supabase
      .from('visits')
      .insert({
        ...visitData,
        status: 'scheduled'
      });

    if (error) {
      console.error('Error scheduling visit:', error);
    } else {
      console.log('Visit scheduled successfully');
    }
  } catch (error) {
    console.error('Error in scheduleVisitFromBot:', error);
  }
}

async function transferToHuman(sessionId: string) {
  try {
    console.log('Transferring to human:', sessionId);
    
    // First get current tags
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('tags')
      .eq('id', sessionId)
      .single();

    const currentTags = sessionData?.tags || [];
    const newTags = [...currentTags, 'human_requested'];
    
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        status: 'waiting',
        attendant_id: null,
        tags: newTags
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error transferring to human:', error);
    } else {
      console.log('Successfully transferred to human');
    }
  } catch (error) {
    console.error('Error in transferToHuman:', error);
  }
}

async function updateSessionMemory(sessionId: string, userMessage: string, aiResponse: string, searchTerms: any) {
  try {
    // Update user preferences
    if (searchTerms.hasPropertyTerms) {
      const preferences = {
        propertyType: searchTerms.propertyType,
        city: searchTerms.city,
        priceRange: searchTerms.minPrice || searchTerms.maxPrice ? {
          min: searchTerms.minPrice,
          max: searchTerms.maxPrice
        } : null,
        bedrooms: searchTerms.minBedrooms,
        lastSearch: new Date().toISOString()
      };

      await supabase
        .from('chat_context_memory')
        .upsert({
          session_id: sessionId,
          key: 'user_preferences',
          value: preferences
        });
    }

    // Update conversation history summary
    const historyUpdate = {
      lastMessage: userMessage.substring(0, 200),
      lastResponse: aiResponse.substring(0, 200), 
      timestamp: new Date().toISOString()
    };

    await supabase
      .from('chat_context_memory')
      .upsert({
        session_id: sessionId,
        key: 'conversation_summary',
        value: historyUpdate
      });

  } catch (error) {
    console.error('Error updating session memory:', error);
  }
}
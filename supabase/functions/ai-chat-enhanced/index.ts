import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    properties?: any[];
    siteInfo?: any;
    userInfo?: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { message, sessionId, context }: ChatRequest = await req.json();

    // Buscar informações do site para contexto
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('*');

    const siteContext = siteSettings?.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Buscar algumas propriedades em destaque para contexto
    const { data: featuredProperties } = await supabase
      .from('properties')
      .select('title, price, location, property_type, bedrooms, area, description')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(5);

    // Buscar configuração do chat
    const { data: chatConfig } = await supabase
      .from('chat_configurations')
      .select('*')
      .eq('active', true)
      .single();

    const systemInstruction = chatConfig?.system_instruction || `
Você é um assistente virtual especializado em imóveis da ${siteContext?.site_name || 'nossa imobiliária'}. 

INFORMAÇÕES SOBRE A EMPRESA:
- Nome: ${siteContext?.site_name || 'Imobiliária'}
- Telefone: ${siteContext?.contact_phone || 'Não informado'}
- Email: ${siteContext?.contact_email || 'Não informado'}
- Endereço: ${siteContext?.contact_address || 'Não informado'}

INSTRUÇÕES:
1. Seja sempre cordial e profissional
2. Forneça informações precisas sobre nossos imóveis
3. Se não souber uma informação específica, ofereça para conectar com um atendente humano
4. Ajude com dúvidas sobre compra, venda, aluguel e financiamento
5. Sempre mencione que temos atendentes especializados disponíveis

IMÓVEIS EM DESTAQUE:
${featuredProperties?.map(p => 
  `- ${p.title}: ${p.property_type} com ${p.bedrooms} quartos, ${p.area}m² em ${p.location} por R$ ${p.price?.toLocaleString('pt-BR')}`
).join('\n') || 'Nenhum imóvel em destaque no momento'}

Responda de forma natural e útil, sempre focando em ajudar o cliente com suas necessidades imobiliárias.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Se há um sessionId, salvar a mensagem no banco
    if (sessionId) {
      await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionId,
            sender_type: 'bot',
            message: aiResponse,
            read_status: false
          }
        ]);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      canTransferToHuman: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat-enhanced function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Desculpe, ocorreu um erro. Por favor, tente novamente ou entre em contato com nossos atendentes.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    const systemPrompt = `Você é um assistente virtual especializado em imóveis para uma imobiliária brasileira. 
    Você deve ajudar clientes interessados em comprar, vender ou alugar imóveis.
    
    Informações importantes:
    - Seja cordial e profissional
    - Faça perguntas relevantes sobre necessidades do cliente
    - Ofereça agendamento de visitas
    - Colete informações sobre orçamento, localização preferida, tipo de imóvel
    - Sempre termine oferecendo mais ajuda
    
    Nome do cliente: ${context?.name || 'Cliente'}
    
    Respostas personalizadas disponíveis:
    - Saudação: ${context?.customResponses?.greeting || ''}
    - Contato: ${context?.customResponses?.contact_info || ''}
    - Horários: ${context?.customResponses?.business_hours || ''}
    
    Responda em português brasileiro de forma natural e útil.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nMensagem do usuário: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      }),
    });

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      response: 'Desculpe, estou com dificuldades técnicas. Pode tentar novamente em alguns minutos?'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

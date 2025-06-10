
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    
    Responda em português brasileiro de forma natural e útil.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context?.previousMessages?.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      response: 'Desculpe, estou com dificuldades técnicas. Pode tentar novamente em alguns minutos?'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

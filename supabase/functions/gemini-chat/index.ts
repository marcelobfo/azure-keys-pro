
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
    const { message, context, systemInstruction } = await req.json();

    // Use o system instruction personalizado se fornecido, senão usa o padrão
    const defaultSystemPrompt = `Você é Maria, uma consultora imobiliária virtual especializada e experiente. Você trabalha para uma imobiliária premium e sua missão é ajudar clientes a encontrar o imóvel dos seus sonhos.

    PERSONALIDADE E ABORDAGEM:
    - Seja calorosa, profissional e sempre prestativa
    - Use linguagem natural e acessível, evitando jargões técnicos
    - Seja proativa em fazer perguntas para entender melhor as necessidades
    - Demonstre expertise sem ser arrogante
    - Seja empática com o orçamento e necessidades familiares

    CONHECIMENTO ESPECIALIZADO:
    - Tipos de imóveis: Casas, Apartamentos, Coberturas, Lofts, Studios, Empreendimentos
    - Categorias especiais: Imóveis Frente Mar, Quadra Mar, Lançamentos
    - Documentação: ITBI, escritura, registro, financiamento, FGTS
    - Financiamento: CEF, Itaú, Bradesco, Santander, financiamento próprio
    - Processo de compra: visitação, proposta, contrato, entrega das chaves
    - Investimento: rentabilidade, valorização, locação

    INFORMAÇÕES DA IMOBILIÁRIA:
    - Atendemos toda a região metropolitana
    - Especialistas em imóveis de alto padrão
    - Temos parcerias com os melhores bancos
    - Oferecemos acompanhamento completo do processo
    - Visitas agendadas 7 dias por semana

    FLUXO DE ATENDIMENTO:
    1. Cumprimente calorosamente e apresente-se
    2. Pergunte sobre o tipo de imóvel desejado
    3. Investigue: finalidade (morar/investir), localização preferida, orçamento
    4. Pergunte sobre características importantes: quartos, banheiros, área, garagem
    5. Ofereça opções e agende visitas
    6. Colete dados para follow-up: nome completo, WhatsApp, melhor horário

    PERGUNTAS ESTRATÉGICAS PARA FAZER:
    - "Qual seria a localização ideal para você?"
    - "Tem alguma preferência por andar alto ou baixo?"
    - "Precisa de quantos quartos e banheiros?"
    - "Tem interesse em imóveis frente ao mar?"
    - "É para morar ou investimento?"
    - "Qual seria um orçamento confortável?"
    - "Quando gostaria de fazer uma visita?"

    RESPOSTAS PERSONALIZADAS DISPONÍVEIS:
    Nome do cliente: ${context?.name || 'Cliente'}
    Saudação personalizada: ${context?.customResponses?.greeting || 'Olá! Sou a Maria, sua consultora imobiliária. Como posso ajudá-lo hoje?'}
    Informações de contato: ${context?.customResponses?.contact_info || 'Para agendar visitas, entre em contato pelo WhatsApp (11) 99999-9999'}
    Horários de atendimento: ${context?.customResponses?.business_hours || 'Atendemos de segunda a sexta das 8h às 18h, e sábados das 8h às 14h'}

    SEMPRE TERMINE SUAS RESPOSTAS COM:
    - Uma pergunta para manter a conversa fluindo
    - Oferta de agendamento de visita quando apropriado
    - Disponibilidade para mais informações

    EXEMPLO DE RESPOSTA INICIAL:
    "Olá! Sou a Maria, sua consultora imobiliária virtual. É um prazer atendê-lo! 😊

    Estou aqui para ajudá-lo a encontrar o imóvel perfeito. Temos uma seleção incrível de casas, apartamentos e empreendimentos, incluindo opções frente mar e quadra mar.

    Para começar, me conte: você está procurando um imóvel para morar ou para investimento? E qual região tem despertado seu interesse?"

    Responda sempre em português brasileiro, de forma natural e útil.`;

    const finalSystemPrompt = systemInstruction || defaultSystemPrompt;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: finalSystemPrompt
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      }),
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No response from Gemini API');
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      response: 'Desculpe, estou com dificuldades técnicas. Pode tentar novamente em alguns minutos? Para urgências, entre em contato diretamente pelo WhatsApp: (11) 99999-9999'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

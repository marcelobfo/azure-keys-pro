
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Gemini chat - Request received:', req.method);
  
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
      maxOutputTokens = 800,
      model = 'gemini-2.0-flash-exp'
    } = await req.json();
    
    console.log('Gemini chat - Processing:', {
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

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure generation parameters
    const generationConfig = {
      temperature: Math.max(0, Math.min(2, temperature)), // Clamp between 0-2
      topP: Math.max(0.1, Math.min(1, topP)), // Clamp between 0.1-1
      maxOutputTokens: Math.max(1, Math.min(4000, maxOutputTokens)), // Clamp between 1-4000
    };

    console.log('Gemini - Using generation config:', generationConfig);

    const modelInstance = genAI.getGenerativeModel({ 
      model: model || 'gemini-2.0-flash-exp',
      generationConfig,
      systemInstruction: systemInstruction || context || 'Você é um assistente imobiliário prestativo. Responda de forma profissional e útil.'
    });

    const result = await modelInstance.generateContent(message);
    const response = result.response;
    const text = response.text();

    console.log('Gemini - Response generated:', {
      responseLength: text.length,
      sessionId
    });

    return new Response(
      JSON.stringify({ 
        response: text,
        sessionId,
        model: model || 'gemini-2.0-flash-exp',
        usedConfig: generationConfig
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro no Gemini chat:', error);
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
});

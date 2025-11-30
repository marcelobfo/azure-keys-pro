
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
      temperature = 1.0, // Gemini 3 recommendation
      topP = 0.95,
      maxOutputTokens = 800,
      model = 'gemini-2.5-pro' // Updated to stable version
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

    // Try to get API key from database first, fallback to env
    let apiKey = Deno.env.get('GEMINI_API_KEY');
    
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const configResponse = await fetch(`${supabaseUrl}/rest/v1/chat_configurations?active=eq.true&select=gemini_api_key`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (configResponse.ok) {
        const configs = await configResponse.json();
        if (configs && configs.length > 0 && configs[0].gemini_api_key) {
          apiKey = configs[0].gemini_api_key;
          console.log('Using Gemini API key from database');
        }
      }
    } catch (error) {
      console.warn('Could not fetch API key from database, using env variable:', error);
    }
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY não configurada');
      throw new Error('API key do Gemini não configurada. Configure em Admin > Configurações do Chat');
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
      model: model || 'gemini-2.5-pro',
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
        model: model || 'gemini-2.5-pro',
        usedConfig: generationConfig
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    console.error('Erro no Gemini chat:', error);
    
    // Improve error messages
    const err = error as Error;
    let errorMessage = err.message || 'Erro desconhecido';
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Quota do Gemini excedida. Verifique seus limites em https://ai.google.dev/usage';
    } else if (errorMessage.includes('API key')) {
      errorMessage = 'Chave da API do Gemini inválida ou não configurada';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, message, apiKey } = await req.json();

    if (!provider) {
      throw new Error('Provider is required');
    }

    if (provider === 'gemini') {
      // Use the API key from request (stored in database) or fallback to env
      const geminiApiKey = apiKey || Deno.env.get('GEMINI_API_KEY');
      
      if (!geminiApiKey) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Chave da API do Gemini não configurada. Configure em Admin > Configurações do Chat.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Testing Gemini API with key:', geminiApiKey.substring(0, 10) + '...');

      // Using gemini-2.5-flash - fast and efficient for testing
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message || 'Teste de conexão'
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            maxOutputTokens: 500, // Increased to ensure enough space for response
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        
        // Parse error for better messages
        let errorMessage = `Erro na API do Gemini: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
            // Check for quota errors
            if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
              errorMessage = 'Quota do Gemini excedida. Verifique seus limites em https://ai.google.dev/usage';
            }
          }
        } catch (e) {
          // Keep default error message
        }
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: errorMessage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('Gemini test raw response:', JSON.stringify(data));
      
      const firstCandidate = data?.candidates?.[0];
      const finishReason = firstCandidate?.finishReason;
      
      // Check if tokens were exhausted
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response hit MAX_TOKENS:', JSON.stringify(data));
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Conexão com Gemini funcionando! (Resposta limitada por tokens)',
          response: 'Teste de conexão bem-sucedido. A API está funcionando corretamente.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const firstPart = firstCandidate?.content?.parts?.[0];
      const text = typeof firstPart?.text === 'string' ? firstPart.text : '';
      
      if (!text) {
        console.error('Invalid Gemini response structure (no text):', JSON.stringify(data));
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Resposta inválida da API do Gemini. Possível problema: tokens insuficientes ou chave incorreta.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Conexão com Gemini funcionando perfeitamente!',
        response: text
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (provider === 'openai') {
      // Use the API key from request (stored in database) or fallback to env
      const openaiApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
      
      if (!openaiApiKey) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Chave da API da OpenAI não configurada. Configure em Admin > Configurações do Chat.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Testing OpenAI API with key:', openaiApiKey.substring(0, 10) + '...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: message || 'Teste de conexão' }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Erro na API da OpenAI: ${response.status} - Verifique se a chave está correta` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenAI response structure:', JSON.stringify(data));
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Resposta inválida da API da OpenAI. Verifique se a chave da API está correta.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Conexão com OpenAI funcionando perfeitamente!',
        response: data.choices[0].message.content
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Provedor não suportado. Use "openai" ou "gemini"' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    console.error('Error in test-ai-provider function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
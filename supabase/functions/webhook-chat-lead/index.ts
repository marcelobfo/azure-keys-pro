
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
    const leadData = await req.json();
    
    console.log('Novo lead do chat recebido:', leadData);
    
    // Aqui você pode integrar com sistemas externos como:
    // - CRM
    // - Sistema de notificações
    // - Email marketing
    // - WhatsApp Business API
    
    // Exemplo de resposta de webhook
    const webhookResponse = {
      success: true,
      leadId: `chat_${Date.now()}`,
      message: 'Lead do chat processado com sucesso',
      timestamp: new Date().toISOString(),
      data: leadData
    };

    return new Response(JSON.stringify(webhookResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing chat lead:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

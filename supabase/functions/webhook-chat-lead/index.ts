
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData = await req.json();
    
    console.log('Novo lead do chat recebido:', leadData);
    
    // Buscar webhooks ativos que escutam eventos de chat
    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('active', true)
      .contains('events', ['chat_message']);

    if (webhookError) {
      console.error('Error fetching webhooks:', webhookError);
    } else if (webhooks && webhooks.length > 0) {
      // Enviar para cada webhook ativo
      for (const webhook of webhooks) {
        try {
          const webhookPayload = {
            event: 'chat_message',
            data: leadData,
            timestamp: new Date().toISOString(),
            source: 'chat_lead'
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Webhook/1.0'
          };

          // Adicionar secret key se configurada
          if (webhook.secret_key) {
            headers['X-Webhook-Secret'] = webhook.secret_key;
          }

          // Adicionar headers customizados
          if (webhook.headers) {
            Object.assign(headers, webhook.headers);
          }

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(webhookPayload)
          });

          console.log(`Webhook ${webhook.name} enviado:`, response.status);

          // Log do resultado
          await supabase
            .from('webhook_logs')
            .insert({
              event_type: 'chat_message',
              source: 'chat_lead',
              data: {
                webhook_id: webhook.id,
                webhook_name: webhook.name,
                payload: webhookPayload,
                response_status: response.status,
                success: response.ok
              }
            });

        } catch (webhookError) {
          console.error(`Error sending to webhook ${webhook.name}:`, webhookError);
          
          // Log do erro
          await supabase
            .from('webhook_logs')
            .insert({
              event_type: 'chat_message',
              source: 'chat_lead',
              data: {
                webhook_id: webhook.id,
                webhook_name: webhook.name,
                error: webhookError.message,
                success: false
              }
            });
        }
      }
    }
    
    // Resposta de confirmação
    const webhookResponse = {
      success: true,
      leadId: `chat_${Date.now()}`,
      message: 'Lead do chat processado com sucesso',
      timestamp: new Date().toISOString(),
      data: leadData,
      webhooks_sent: webhooks?.length || 0
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

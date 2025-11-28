import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData } = await req.json();
    
    console.log('WhatsApp Notification - Processing lead:', leadData);

    // Buscar configurações da Evolution API do banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config } = await supabase
      .from('chat_configurations')
      .select('evolution_api_url, evolution_api_key, evolution_instance, whatsapp_notification_number')
      .eq('active', true)
      .maybeSingle();

    if (!config || !config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance || !config.whatsapp_notification_number) {
      console.log('Evolution API não configurada, notificação WhatsApp não enviada');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Evolution API não configurada. Configure em Admin > Configurações do Chat > WhatsApp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const message = `🏠 *NOVO LEAD RECEBIDO*

👤 *Nome:* ${leadData.name}
📧 *Email:* ${leadData.email}
📱 *Telefone:* ${leadData.phone || 'Não informado'}
💬 *Mensagem:* ${leadData.message || 'Sem mensagem'}

📅 *Data:* ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    console.log('Sending WhatsApp notification to:', config.whatsapp_notification_number);

    const response = await fetch(`${config.evolution_api_url}/message/sendText/${config.evolution_instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolution_api_key
      },
      body: JSON.stringify({
        number: config.whatsapp_notification_number,
        text: message,
        delay: 1000,
        linkPreview: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Evolution API respondeu com status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('WhatsApp notification sent successfully:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      message: 'Notificação WhatsApp enviada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar notificação WhatsApp';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

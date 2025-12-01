import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to format phone number for WhatsApp
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If doesn't have country code (less than 12 digits), add Brazil code
  if (cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  
  // Validate minimum length
  if (cleaned.length < 12) {
    return null;
  }
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData } = await req.json();
    
    console.log('WhatsApp Notification - Processing lead:', JSON.stringify(leadData, null, 2));

    // Buscar configurações da Evolution API do banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from('chat_configurations')
      .select('evolution_api_url, evolution_api_key, evolution_instance, whatsapp_notification_number, company, whatsapp_lead_welcome_message')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching config:', configError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Erro ao buscar configurações'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!config || !config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance) {
      console.log('Evolution API não configurada completamente');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Evolution API não configurada. Configure em Admin > Configurações do Chat > WhatsApp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = {
      adminNotification: { success: false, message: '' },
      leadMessage: { success: false, message: '' }
    };

    const companyName = config.company || 'Nossa Imobiliária';

    // ===== 1. SEND NOTIFICATION TO ADMIN/BROKER =====
    if (config.whatsapp_notification_number) {
      const adminMessage = `🏠 *NOVO LEAD RECEBIDO*

👤 *Nome:* ${leadData.name}
📧 *Email:* ${leadData.email}
📱 *Telefone:* ${leadData.phone || 'Não informado'}
💬 *Mensagem:* ${leadData.message || 'Sem mensagem'}

📅 *Data:* ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

      console.log('Sending admin notification to:', config.whatsapp_notification_number);

      try {
        const adminResponse = await fetch(`${config.evolution_api_url}/message/sendText/${config.evolution_instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolution_api_key
          },
          body: JSON.stringify({
            number: config.whatsapp_notification_number,
            text: adminMessage,
            delay: 1000,
            linkPreview: false
          })
        });

        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          console.log('Admin notification sent successfully:', adminResult);
          results.adminNotification = { success: true, message: 'Notificação enviada para o administrador' };
        } else {
          const errorText = await adminResponse.text();
          console.error('Admin notification failed:', adminResponse.status, errorText);
          results.adminNotification = { success: false, message: `Erro ${adminResponse.status}: ${errorText}` };
        }
      } catch (adminError) {
        console.error('Error sending admin notification:', adminError);
        results.adminNotification = { success: false, message: adminError instanceof Error ? adminError.message : 'Erro desconhecido' };
      }
    } else {
      console.log('No admin notification number configured');
      results.adminNotification = { success: false, message: 'Número de notificação não configurado' };
    }

    // ===== 2. SEND WELCOME MESSAGE TO LEAD =====
    const leadPhone = formatPhoneNumber(leadData.phone);
    
    if (leadPhone) {
      // Use custom message or default
      const defaultMessage = `Olá {name}! 👋

Recebemos seu interesse em nossos imóveis!

Um de nossos corretores especializados entrará em contato em breve para ajudá-lo a encontrar o imóvel ideal.

Obrigado por nos escolher! 🏠`;

      // Replace placeholders in the message
      const messageTemplate = config.whatsapp_lead_welcome_message || defaultMessage;
      const leadMessage = messageTemplate
        .replace(/\{name\}/gi, leadData.name || 'Cliente')
        .replace(/\{email\}/gi, leadData.email || '')
        .replace(/\{phone\}/gi, leadData.phone || '')
        .replace(/\{company\}/gi, companyName);

      console.log('Sending welcome message to lead:', leadPhone);

      try {
        const leadResponse = await fetch(`${config.evolution_api_url}/message/sendText/${config.evolution_instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolution_api_key
          },
          body: JSON.stringify({
            number: leadPhone,
            text: leadMessage,
            delay: 2000,
            linkPreview: false
          })
        });

        if (leadResponse.ok) {
          const leadResult = await leadResponse.json();
          console.log('Lead welcome message sent successfully:', leadResult);
          results.leadMessage = { success: true, message: 'Mensagem de boas-vindas enviada ao lead' };
        } else {
          const errorText = await leadResponse.text();
          console.error('Lead message failed:', leadResponse.status, errorText);
          results.leadMessage = { success: false, message: `Erro ${leadResponse.status}: ${errorText}` };
        }
      } catch (leadError) {
        console.error('Error sending lead message:', leadError);
        results.leadMessage = { success: false, message: leadError instanceof Error ? leadError.message : 'Erro desconhecido' };
      }
    } else {
      console.log('Lead phone not provided or invalid:', leadData.phone);
      results.leadMessage = { success: false, message: 'Telefone do lead não informado ou inválido' };
    }

    // Return combined results
    const overallSuccess = results.adminNotification.success || results.leadMessage.success;
    
    return new Response(JSON.stringify({ 
      success: overallSuccess,
      results,
      message: overallSuccess ? 'Notificações processadas' : 'Nenhuma notificação enviada'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in whatsapp-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar notificação WhatsApp';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

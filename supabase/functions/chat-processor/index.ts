
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Chat processor - Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();
    console.log('Chat processor - Action:', action, 'Data:', data);

    switch (action) {
      case 'create_chat_session': {
        const { leadData } = data;
        console.log('Criando nova sessão de chat...', leadData);

        // Inserir ou atualizar lead
        const { data: leadResult, error: leadError } = await supabase
          .from('leads')
          .upsert({
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            message: leadData.message,
            status: 'new'
          }, {
            onConflict: 'email'
          })
          .select()
          .single();

        if (leadError) {
          console.error('Erro ao criar/atualizar lead:', leadError);
          throw leadError;
        }

        // Criar ticket de suporte
        const { data: ticketResult, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            lead_id: leadResult.id,
            subject: leadData.subject || 'Chat iniciado',
            description: leadData.message || 'Sessão de chat iniciada',
            status: 'open',
            priority: 'medium'
          })
          .select()
          .single();

        if (ticketError) {
          console.error('Erro ao criar ticket:', ticketError);
          throw ticketError;
        }

        // Criar sessão de chat
        const { data: sessionResult, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            lead_id: leadResult.id,
            status: 'waiting',
            subject: leadData.subject,
            ticket_id: ticketResult.id
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Erro ao criar sessão:', sessionError);
          throw sessionError;
        }

        // Enviar mensagem inicial se fornecida
        if (leadData.message) {
          console.log('Enviando mensagem inicial:', leadData.message);
          
          const { error: messageError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionResult.id,
              sender_type: 'lead',
              sender_id: null, // Para leads, usar null
              message: leadData.message
            });

          if (messageError) {
            console.error('Erro ao enviar mensagem inicial:', messageError);
          }
        }

        const response = {
          ...sessionResult,
          ticket_protocol: ticketResult.protocol_number
        };

        console.log('Sessão criada com sucesso:', response);

        return new Response(
          JSON.stringify({ success: true, session: response }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_message': {
        const { sessionId, message, senderType, senderId } = data;
        
        console.log('Enviando mensagem:', {
          sessionId,
          senderType,
          messageLength: message.length
        });

        // Para leads, sempre usar null como senderId
        const finalSenderId = senderType === 'lead' ? null : senderId;

        const { error } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            sender_type: senderType,
            sender_id: finalSenderId,
            message: message
          });

        if (error) {
          console.error('Erro ao inserir mensagem:', error);
          throw error;
        }

        console.log('Mensagem enviada com sucesso');

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_business_hours': {
        const { data: businessHours, error } = await supabase
          .from('business_hours')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Erro ao verificar horário comercial:', error);
          throw error;
        }

        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);

        const isBusinessHours = businessHours?.some(bh => 
          bh.day_of_week === currentDay &&
          currentTime >= bh.start_time &&
          currentTime <= bh.end_time
        ) || false;

        return new Response(
          JSON.stringify({ isBusinessHours }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        console.error('Ação não reconhecida:', action);
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Erro no chat processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

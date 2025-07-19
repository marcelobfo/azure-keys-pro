
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Chat processor - Request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();
    console.log('Chat processor - Action:', action, 'Data:', data);

    switch (action) {
      case 'create_chat_session':
        return await createChatSession(supabaseClient, data);
      
      case 'send_message':
        return await sendMessage(supabaseClient, data);
      
      case 'check_business_hours':
        return await checkBusinessHours(supabaseClient);
      
      case 'create_support_ticket':
        return await createSupportTicket(supabaseClient, data);
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }
  } catch (error) {
    console.error('Erro no chat processor:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function createChatSession(supabase: any, data: any) {
  const { leadData } = data;
  console.log('Criando sessão de chat para:', leadData);

  try {
    // Verificar se é horário comercial
    const { data: isBusinessHours } = await supabase.rpc('is_business_hours');
    console.log('É horário comercial:', isBusinessHours);

    // Primeiro, criar ou buscar o lead
    let lead;
    const { data: existingLead, error: leadSelectError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', leadData.email)
      .maybeSingle();

    if (leadSelectError) {
      console.error('Erro ao buscar lead existente:', leadSelectError);
    }

    if (existingLead) {
      // Atualizar lead existente
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
          name: leadData.name,
          phone: leadData.phone || existingLead.phone,
          message: leadData.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar lead:', updateError);
        throw updateError;
      }
      lead = updatedLead;
      console.log('Lead atualizado:', lead);
    } else {
      // Criar novo lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          message: leadData.message,
          status: 'new'
        })
        .select()
        .single();

      if (leadError) {
        console.error('Erro ao criar lead:', leadError);
        throw leadError;
      }
      lead = newLead;
      console.log('Novo lead criado:', lead);
    }

    // Criar ticket de suporte
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        lead_id: lead.id,
        subject: leadData.subject || 'Atendimento via chat',
        initial_message: leadData.message || 'Cliente iniciou chat',
        status: isBusinessHours ? 'pending' : 'pending',
        priority: 'normal'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Erro ao criar ticket:', ticketError);
      throw ticketError;
    }
    console.log('Ticket criado:', ticket);

    // Criar sessão de chat
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        lead_id: lead.id,
        ticket_id: ticket.id,
        subject: leadData.subject || 'Atendimento via chat',
        status: isBusinessHours ? 'waiting' : 'waiting'
      })
      .select(`
        *,
        leads!chat_sessions_lead_id_fkey(name, email, phone)
      `)
      .single();

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError);
      throw sessionError;
    }
    console.log('Sessão criada:', session);

    // Enviar mensagem inicial se fornecida
    if (leadData.message) {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          sender_type: 'lead',
          message: leadData.message
        });
      
      if (messageError) {
        console.error('Erro ao criar mensagem inicial:', messageError);
      }
    }

    // Buscar configurações de boas-vindas
    const { data: config } = await supabase
      .from('chat_configurations')
      .select('welcome_message, custom_responses')
      .limit(1)
      .maybeSingle();

    const welcomeMessage = config?.welcome_message || 
      `Olá ${leadData.name}! Obrigado por entrar em contato. Seu protocolo é: ${ticket.protocol_number}`;

    const statusMessage = isBusinessHours 
      ? ' Um de nossos atendentes estará com você em breve.' 
      : ' No momento estamos fora do horário comercial, mas responderemos assim que possível.';

    const finalWelcomeMessage = welcomeMessage + statusMessage;

    // Enviar mensagem de boas-vindas
    const { error: welcomeError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: session.id,
        sender_type: 'bot',
        message: finalWelcomeMessage
      });

    if (welcomeError) {
      console.error('Erro ao enviar mensagem de boas-vindas:', welcomeError);
    }

    console.log('Sessão criada com sucesso');

    return new Response(
      JSON.stringify({ 
        session: {
          ...session,
          ticket_protocol: ticket.protocol_number
        },
        isBusinessHours,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro detalhado ao criar sessão:', error);
    throw error;
  }
}

async function sendMessage(supabase: any, data: any) {
  const { sessionId, message, senderType, senderId } = data;
  console.log('Enviando mensagem:', { sessionId, senderType, messageLength: message?.length });

  try {
    // Inserir mensagem
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender_type: senderType,
        sender_id: senderId,
        message: message
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir mensagem:', error);
      throw error;
    }

    // Atualizar sessão como ativa se necessário
    if (senderType === 'attendant') {
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'active',
          attendant_id: senderId 
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Erro ao atualizar sessão:', updateError);
      }
    }

    console.log('Mensagem enviada com sucesso');

    return new Response(
      JSON.stringify({ 
        message: newMessage,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

async function checkBusinessHours(supabase: any) {
  try {
    const { data: isBusinessHours } = await supabase.rpc('is_business_hours');
    
    // Buscar próximo horário disponível
    const { data: nextBusinessTime } = await supabase
      .from('business_hours')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week');

    return new Response(
      JSON.stringify({ 
        isBusinessHours: isBusinessHours || false,
        nextBusinessTime: nextBusinessTime || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao verificar horários:', error);
    return new Response(
      JSON.stringify({ 
        isBusinessHours: false,
        nextBusinessTime: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
}

async function createSupportTicket(supabase: any, data: any) {
  const { leadId, subject, message, priority } = data;

  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        lead_id: leadId,
        subject: subject,
        initial_message: message,
        priority: priority || 'normal',
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        ticket,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    throw error;
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    console.log('Chat processor action:', action, data);

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

  // Verificar se é horário comercial
  const { data: isBusinessHours } = await supabase.rpc('is_business_hours');
  console.log('É horário comercial:', isBusinessHours);

  // Primeiro, criar ou buscar o lead
  let lead;
  const { data: existingLead } = await supabase
    .from('leads')
    .select('*')
    .eq('email', leadData.email)
    .single();

  if (existingLead) {
    // Atualizar lead existente
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        name: leadData.name,
        phone: leadData.phone,
        message: leadData.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLead.id)
      .select()
      .single();

    if (updateError) throw updateError;
    lead = updatedLead;
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

    if (leadError) throw leadError;
    lead = newLead;
  }

  // Criar ticket de suporte
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      lead_id: lead.id,
      subject: leadData.subject || 'Atendimento via chat',
      initial_message: leadData.message,
      status: isBusinessHours ? 'pending' : 'pending',
      priority: 'normal'
    })
    .select()
    .single();

  if (ticketError) throw ticketError;

  // Criar sessão de chat
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .insert({
      lead_id: lead.id,
      ticket_id: ticket.id,
      subject: leadData.subject,
      status: isBusinessHours ? 'waiting' : 'waiting'
    })
    .select(`
      *,
      lead:leads(name, email, phone)
    `)
    .single();

  if (sessionError) throw sessionError;

  // Enviar mensagem inicial se fornecida
  if (leadData.message) {
    await supabase
      .from('chat_messages')
      .insert({
        session_id: session.id,
        sender_type: 'lead',
        message: leadData.message
      });
  }

  // Enviar mensagem de boas-vindas
  const welcomeMessage = isBusinessHours 
    ? `Olá ${leadData.name}! Obrigado por entrar em contato. Um de nossos atendentes estará com você em breve. Seu protocolo é: ${ticket.protocol_number}`
    : `Olá ${leadData.name}! Obrigado por entrar em contato. No momento nossos atendentes estão offline, mas responderemos assim que possível. Seu protocolo é: ${ticket.protocol_number}`;

  await supabase
    .from('chat_messages')
    .insert({
      session_id: session.id,
      sender_type: 'bot',
      message: welcomeMessage
    });

  console.log('Sessão criada com sucesso:', session);

  return new Response(
    JSON.stringify({ 
      session: {
        ...session,
        ticket_protocol: ticket.protocol_number
      },
      isBusinessHours 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function sendMessage(supabase: any, data: any) {
  const { sessionId, message, senderType, senderId } = data;

  console.log('Enviando mensagem:', { sessionId, message, senderType });

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

  if (error) throw error;

  // Atualizar sessão como ativa se necessário
  if (senderType === 'attendant') {
    await supabase
      .from('chat_sessions')
      .update({ 
        status: 'active',
        attendant_id: senderId 
      })
      .eq('id', sessionId);
  }

  console.log('Mensagem enviada:', newMessage);

  return new Response(
    JSON.stringify({ message: newMessage }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function checkBusinessHours(supabase: any) {
  const { data: isBusinessHours } = await supabase.rpc('is_business_hours');
  
  // Buscar próximo horário disponível
  const { data: nextBusinessTime } = await supabase
    .from('business_hours')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week');

  return new Response(
    JSON.stringify({ 
      isBusinessHours,
      nextBusinessTime: nextBusinessTime || []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function createSupportTicket(supabase: any, data: any) {
  const { leadId, subject, message, priority } = data;

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
    JSON.stringify({ ticket }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
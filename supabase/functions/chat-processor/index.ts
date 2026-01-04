
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para buscar histórico de mensagens da sessão
const getChatHistory = async (supabase: any, sessionId: string, limit: number = 20) => {
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('message, sender_type, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  return messages || [];
};

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

    // Get active chat configuration for AI settings (filtered by tenant_id if provided)
    const getChatConfig = async (tenantId?: string) => {
      let query = supabase
        .from('chat_configurations')
        .select('*')
        .eq('active', true);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data: chatConfig } = await query.single();
      return chatConfig;
    };

    // Search knowledge base for relevant content (filtered by tenant_id if provided)
    const searchKnowledgeBase = async (queryText: string, tenantId?: string) => {
      let query = supabase
        .from('knowledge_base_articles')
        .select('title, content')
        .eq('published', true);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data: articles } = await query
        .textSearch('title,content', queryText, {
          type: 'websearch',
          config: 'portuguese'
        })
        .limit(3);
      
      if (articles && articles.length > 0) {
        return articles.map(article => `**${article.title}**\n${article.content}`).join('\n\n');
      }
      return null;
    };

    switch (action) {
      case 'create_chat_session': {
        const { leadData, tenant_id } = data;
        console.log('Criando nova sessão de chat...', leadData, 'tenant_id:', tenant_id);

        // Inserir ou atualizar lead
        const { data: existingLead } = await supabase
          .from('leads')
          .select('*')
          .eq('email', leadData.email)
          .single();

        let leadResult;
        if (existingLead) {
          // Atualizar lead existente
          const { data, error: updateError } = await supabase
            .from('leads')
            .update({
              name: leadData.name,
              phone: leadData.phone,
              message: leadData.message,
              status: 'new'
            })
            .eq('id', existingLead.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('Erro ao atualizar lead:', updateError);
            throw updateError;
          }
          leadResult = data;
        } else {
          // Criar novo lead with tenant_id
          const insertData: any = {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            message: leadData.message,
            status: 'new'
          };
          
          if (tenant_id) {
            insertData.tenant_id = tenant_id;
          }
          
          const { data, error: insertError } = await supabase
            .from('leads')
            .insert(insertData)
            .select()
            .single();
          
          if (insertError) {
            console.error('Erro ao criar lead:', insertError);
            throw insertError;
          }
          leadResult = data;
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
              sender_id: null,
              message: leadData.message
            });

          if (messageError) {
            console.error('Erro ao enviar mensagem inicial:', messageError);
          }

          // Verificar se há configuração de AI ativa
          const chatConfig = await getChatConfig(tenant_id);

          if (chatConfig?.ai_chat_enabled) {
            console.log('AI Chat habilitado, enviando resposta automática...');
            console.log('Usando configurações:', {
              provider: chatConfig.api_provider,
              model: chatConfig.provider_model,
              temperature: chatConfig.temperature,
              topP: chatConfig.top_p,
              maxTokens: chatConfig.max_tokens,
              knowledgeBase: chatConfig.knowledge_base_enabled
            });
            
            try {
              // Buscar na base de conhecimento se habilitada
              let knowledgeContext = '';
              if (chatConfig.knowledge_base_enabled) {
                console.log('Buscando na base de conhecimento...');
                const kbContent = await searchKnowledgeBase(leadData.message, tenant_id);
                if (kbContent) {
                  knowledgeContext = `\n\nContexto da Base de Conhecimento:\n${kbContent}`;
                  console.log('Conhecimento encontrado:', kbContent.substring(0, 200) + '...');
                }
              }

              // Preparar contexto completo com regras rigorosas
              const systemInstruction = (chatConfig.system_instruction || 
                `Você é uma IA de atendimento imobiliário autônoma da imobiliária premium Maresia Litoral.
                Sua missão é atender clientes em tempo real, trazer imóveis da base de dados e conduzir o usuário dentro do site da Maresia Litoral.
                
                REGRAS CRÍTICAS DE ATENDIMENTO:
                - Você é a assistente virtual oficial da Maresia Litoral
                - NUNCA envie links externos ou mencione sites concorrentes
                - SEMPRE conduza o usuário dentro do domínio atual
                - Sua função principal é ajudar clientes a encontrar imóveis, responder dúvidas e registrar tickets quando necessário
                - Consulte sempre a tabela properties para trazer imóveis reais da base de dados
                - Quando o cliente pedir por imóveis, traga resultados da base de dados com id, título, descrição, preço, localização, tipo e status`
              ) + knowledgeContext;
              
              // Passar contexto estruturado com dados do cliente
              const context = {
                clientName: leadData.name,
                clientEmail: leadData.email,
                clientPhone: leadData.phone,
                subject: leadData.subject,
                initialMessage: leadData.message
              };

              // Buscar histórico de mensagens (vazio para primeira mensagem)
              const chatHistory = await getChatHistory(supabase, sessionResult.id, 20);

              // Sempre usar gemini-chat-enhanced para ter acesso completo aos imóveis
              const { data: response, error: aiError } = await supabase.functions.invoke('gemini-chat-enhanced', {
                body: {
                  message: leadData.message,
                  context: context,
                  sessionId: sessionResult.id,
                  chatHistory: chatHistory,
                  systemInstruction: systemInstruction,
                  temperature: chatConfig.temperature,
                  topP: chatConfig.top_p,
                  maxOutputTokens: chatConfig.max_tokens,
                  model: chatConfig.provider_model || 'gemini-2.5-pro',
                  tenant_id: tenant_id
                }
              });
              const aiResponse = response;

              if (aiResponse?.response) {
                // Inserir resposta do bot
                const { data: aiMessage } = await supabase
                  .from('chat_messages')
                  .insert({
                    session_id: sessionResult.id,
                    sender_type: 'bot',
                    sender_id: null,
                    message: aiResponse.response
                  })
                  .select()
                  .single();
                
                // Broadcast AI message immediately to all listeners
                const broadcastChannel = supabase.channel(`chat-session-${sessionResult.id}`);
                await broadcastChannel.send({
                  type: 'broadcast',
                  event: 'new_message',
                  payload: {
                    id: aiMessage?.id || `ai-msg-${Date.now()}`,
                    session_id: sessionResult.id,
                    message: aiResponse.response,
                    sender_type: 'bot',
                    sender_id: null,
                    timestamp: aiMessage?.timestamp || new Date().toISOString(),
                    created_at: aiMessage?.created_at || new Date().toISOString(),
                    read_status: false
                  }
                });
                
                console.log('Resposta AI enviada:', aiResponse.response);
              } else {
                console.error('Erro na resposta AI:', aiResponse);
              }
            } catch (error) {
              console.error('Erro ao chamar AI:', error);
            }
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
        const { sessionId, message, senderType, senderId, tenant_id } = data;
        
        console.log('Enviando mensagem:', {
          sessionId,
          senderType,
          messageLength: message.length,
          tenant_id
        });

        // Para leads, sempre usar null como senderId
        const finalSenderId = senderType === 'lead' ? null : senderId;

        const { data: messageData, error } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            sender_type: senderType,
            sender_id: finalSenderId,
            message: message,
            status: 'sent'
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir mensagem:', error);
          throw error;
        }

        console.log('Mensagem enviada com sucesso');

        // Broadcast message immediately to all listeners with real message ID
        const broadcastChannel = supabase.channel(`chat-session-${sessionId}`);
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: {
            ...messageData,
            id: messageData.id, // Use real message ID from database
            tempId: null // Clear any temporary ID
          }
        });

        // Se a mensagem é de um lead e AI está habilitada, gerar resposta automática
        if (senderType === 'lead') {
          // Get tenant_id from lead via session if not provided
          let effectiveTenantId = tenant_id;
          if (!effectiveTenantId) {
            const { data: sessionData } = await supabase
              .from('chat_sessions')
              .select('leads!inner(tenant_id)')
              .eq('id', sessionId)
              .single();
            effectiveTenantId = (sessionData?.leads as any)?.tenant_id;
          }
          
          const chatConfig = await getChatConfig(effectiveTenantId);

          // Verificar se a sessão não tem atendente ativo
          const { data: session } = await supabase
            .from('chat_sessions')
            .select('attendant_id')
            .eq('id', sessionId)
            .single();

          if (chatConfig?.ai_chat_enabled && !session?.attendant_id) {
            console.log('Gerando resposta AI automática...');
            console.log('Usando configurações:', {
              provider: chatConfig.api_provider,
              model: chatConfig.provider_model,
              temperature: chatConfig.temperature,
              topP: chatConfig.top_p,
              maxTokens: chatConfig.max_tokens,
              knowledgeBase: chatConfig.knowledge_base_enabled
            });
            
            try {
              // Buscar na base de conhecimento se habilitada
              let knowledgeContext = '';
              if (chatConfig.knowledge_base_enabled) {
                console.log('Buscando na base de conhecimento...');
                const kbContent = await searchKnowledgeBase(message, effectiveTenantId);
                if (kbContent) {
                  knowledgeContext = `\n\nContexto da Base de Conhecimento:\n${kbContent}`;
                  console.log('Conhecimento encontrado:', kbContent.substring(0, 200) + '...');
                }
              }

              // Buscar dados do lead pela sessão
              const { data: sessionWithLead } = await supabase
                .from('chat_sessions')
                .select(`
                  lead_id,
                  subject,
                  leads!inner(name, email, phone, message)
                `)
                .eq('id', sessionId)
                .single();

              // Preparar contexto completo com regras rigorosas
              const systemInstruction = (chatConfig.system_instruction || 
                `Você é uma IA de atendimento imobiliário autônoma da imobiliária premium Maresia Litoral.
                Sua missão é atender clientes em tempo real, trazer imóveis da base de dados e conduzir o usuário dentro do site da Maresia Litoral.
                
                REGRAS CRÍTICAS DE ATENDIMENTO:
                - Você é a assistente virtual oficial da Maresia Litoral
                - NUNCA envie links externos ou mencione sites concorrentes
                - SEMPRE conduza o usuário dentro do domínio atual
                - Sua função principal é ajudar clientes a encontrar imóveis, responder dúvidas e registrar tickets quando necessário
                - Consulte sempre a tabela properties para trazer imóveis reais da base de dados
                - Quando o cliente pedir por imóveis, traga resultados da base de dados com id, título, descrição, preço, localização, tipo e status`
              ) + knowledgeContext;

              // Passar contexto estruturado com dados completos do cliente
              const leadData = sessionWithLead?.leads as { name?: string; email?: string; phone?: string; message?: string } | undefined;
              const context = {
                clientName: leadData?.name,
                clientEmail: leadData?.email,
                clientPhone: leadData?.phone,
                subject: sessionWithLead?.subject,
                initialMessage: leadData?.message
              };

              // Buscar histórico de mensagens anteriores
              const chatHistory = await getChatHistory(supabase, sessionId, 20);

              // Sempre usar gemini-chat-enhanced para ter acesso completo aos imóveis
              const { data: response, error: aiError } = await supabase.functions.invoke('gemini-chat-enhanced', {
                body: {
                  message: message,
                  context: context,
                  sessionId: sessionId,
                  chatHistory: chatHistory,
                  systemInstruction: systemInstruction,
                  temperature: chatConfig.temperature,
                  topP: chatConfig.top_p,
                  maxOutputTokens: chatConfig.max_tokens,
                  model: chatConfig.provider_model || 'gemini-2.5-pro',
                  tenant_id: effectiveTenantId
                }
              });
              const aiResponse = response;

              if (aiResponse?.response) {
                const { data: aiMessage } = await supabase
                  .from('chat_messages')
                  .insert({
                    session_id: sessionId,
                    sender_type: 'bot',
                    sender_id: null,
                    message: aiResponse.response
                  })
                  .select()
                  .single();
                
                // Broadcast AI message immediately to all listeners
                const broadcastChannel = supabase.channel(`chat-session-${sessionId}`);
                await broadcastChannel.send({
                  type: 'broadcast',
                  event: 'new_message',
                  payload: {
                    id: aiMessage?.id || `ai-msg-${Date.now()}`,
                    session_id: sessionId,
                    message: aiResponse.response,
                    sender_type: 'bot',
                    sender_id: null,
                    timestamp: aiMessage?.timestamp || new Date().toISOString(),
                    created_at: aiMessage?.created_at || new Date().toISOString(),
                    read_status: false
                  }
                });
                
                console.log('Resposta AI automática enviada');
              }
            } catch (error) {
              console.error('Erro ao gerar resposta AI:', error);
            }
          }
        }

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

  } catch (error: unknown) {
    console.error('Erro no chat processor:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

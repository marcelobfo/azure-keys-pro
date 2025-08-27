
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

    // Get active chat configuration for AI settings
    const getChatConfig = async () => {
      const { data: chatConfig } = await supabase
        .from('chat_configurations')
        .select('*')
        .eq('active', true)
        .single();
      return chatConfig;
    };

    // Search knowledge base for relevant content
    const searchKnowledgeBase = async (query: string) => {
      const { data: articles } = await supabase
        .from('knowledge_base_articles')
        .select('title, content')
        .eq('published', true)
        .textSearch('title,content', query, {
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
        const { leadData } = data;
        console.log('Criando nova sessão de chat...', leadData);

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
          // Criar novo lead
          const { data, error: insertError } = await supabase
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
          const chatConfig = await getChatConfig();

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
                const kbContent = await searchKnowledgeBase(leadData.message);
                if (kbContent) {
                  knowledgeContext = `\n\nContexto da Base de Conhecimento:\n${kbContent}`;
                  console.log('Conhecimento encontrado:', kbContent.substring(0, 200) + '...');
                }
              }

              // Preparar contexto completo
              const systemInstruction = (chatConfig.system_instruction || 'Você é um assistente imobiliário prestativo.') + knowledgeContext;
              const context = `Cliente ${leadData.name} iniciou um chat sobre: ${leadData.subject}. ${systemInstruction}`;

              // Chamar função AI baseada no provider
              let aiResponse;
              if (chatConfig.api_provider === 'openai') {
                const { data: response, error: aiError } = await supabase.functions.invoke('ai-chat-enhanced', {
                  body: {
                    message: leadData.message,
                    context: context,
                    sessionId: sessionResult.id,
                    temperature: chatConfig.temperature,
                    maxTokens: chatConfig.max_tokens
                  }
                });
                aiResponse = response;
              } else {
                // Default to Gemini
                const { data: response, error: aiError } = await supabase.functions.invoke('gemini-chat', {
                  body: {
                    message: leadData.message,
                    context: context,
                    sessionId: sessionResult.id,
                    systemInstruction: systemInstruction,
                    temperature: chatConfig.temperature,
                    topP: chatConfig.top_p,
                    maxOutputTokens: chatConfig.max_tokens,
                    model: chatConfig.provider_model
                  }
                });
                aiResponse = response;
              }

              if (aiResponse?.response) {
                // Inserir resposta do bot
                await supabase
                  .from('chat_messages')
                  .insert({
                    session_id: sessionResult.id,
                    sender_type: 'bot',
                    sender_id: null,
                    message: aiResponse.response
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

        // Broadcast message immediately to all listeners
        const broadcastChannel = supabase.channel(`chat-session-${sessionId}`);
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: {
            id: `msg-${Date.now()}`,
            session_id: sessionId,
            message: message,
            sender_type: senderType,
            sender_id: finalSenderId,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            read_status: false
          }
        });

        // Se a mensagem é de um lead e AI está habilitada, gerar resposta automática
        if (senderType === 'lead') {
          const chatConfig = await getChatConfig();

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
                const kbContent = await searchKnowledgeBase(message);
                if (kbContent) {
                  knowledgeContext = `\n\nContexto da Base de Conhecimento:\n${kbContent}`;
                  console.log('Conhecimento encontrado:', kbContent.substring(0, 200) + '...');
                }
              }

              // Preparar contexto completo
              const systemInstruction = (chatConfig.system_instruction || 'Você é um assistente imobiliário prestativo. Responda de forma profissional e útil.') + knowledgeContext;

              // Chamar função AI baseada no provider
              let aiResponse;
              if (chatConfig.api_provider === 'openai') {
                const { data: response, error: aiError } = await supabase.functions.invoke('ai-chat-enhanced', {
                  body: {
                    message: message,
                    context: systemInstruction,
                    sessionId: sessionId,
                    temperature: chatConfig.temperature,
                    maxTokens: chatConfig.max_tokens
                  }
                });
                aiResponse = response;
              } else {
                // Default to Gemini
                const { data: response, error: aiError } = await supabase.functions.invoke('gemini-chat', {
                  body: {
                    message: message,
                    context: systemInstruction,
                    sessionId: sessionId,
                    systemInstruction: systemInstruction,
                    temperature: chatConfig.temperature,
                    topP: chatConfig.top_p,
                    maxOutputTokens: chatConfig.max_tokens,
                    model: chatConfig.provider_model
                  }
                });
                aiResponse = response;
              }

              if (aiResponse?.response) {
                await supabase
                  .from('chat_messages')
                  .insert({
                    session_id: sessionId,
                    sender_type: 'bot',
                    sender_id: null,
                    message: aiResponse.response
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

  } catch (error) {
    console.error('Erro no chat processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

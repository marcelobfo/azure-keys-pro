import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: string;
  user_id?: string;
  data: any;
  timestamp: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const payload: WebhookPayload = await req.json();
    console.log('Universal webhook received:', payload);

    // Log the webhook event for analytics
    await logWebhookEvent(supabase, payload);

    // Process specific events
    switch (payload.event) {
      case 'favorite_added':
        await handleFavoriteAdded(supabase, payload);
        break;
      
      case 'favorite_removed':
        await handleFavoriteRemoved(supabase, payload);
        break;
      
      case 'user_registered':
        await handleUserRegistered(supabase, payload);
        break;
      
      case 'lead_created':
        await handleLeadCreated(supabase, payload);
        break;
      
      case 'visit_scheduled':
        await handleVisitScheduled(supabase, payload);
        break;
      
      case 'chat_message':
        await handleChatMessage(supabase, payload);
        break;
      
      case 'property_viewed':
        await handlePropertyViewed(supabase, payload);
        break;
      
      default:
        console.log('Unknown event type:', payload.event);
    }

    // Trigger external webhook if configured
    await triggerExternalWebhook(payload);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function logWebhookEvent(supabase: any, payload: WebhookPayload) {
  try {
    // Create webhook_logs table entry for analytics
    await supabase.from('webhook_logs').insert({
      event_type: payload.event,
      user_id: payload.user_id,
      data: payload.data,
      source: payload.source,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

async function handleFavoriteAdded(supabase: any, payload: WebhookPayload) {
  console.log('Processing favorite added:', payload.data);
  
  // Could trigger notifications to property owners or analytics
  if (payload.data.property_id && payload.user_id) {
    // Get property info
    const { data: property } = await supabase
      .from('properties')
      .select('title, user_id')
      .eq('id', payload.data.property_id)
      .single();

    // Notify property owner if different from user who favorited
    if (property?.user_id && property.user_id !== payload.user_id) {
      await supabase.from('notifications').insert({
        user_id: property.user_id,
        type: 'system',
        title: 'Seu imóvel foi favoritado!',
        message: `Alguém adicionou "${property.title}" aos favoritos`,
        data: { property_id: payload.data.property_id }
      });
    }
  }
}

async function handleFavoriteRemoved(supabase: any, payload: WebhookPayload) {
  console.log('Processing favorite removed:', payload.data);
  // Analytics logging mainly
}

async function handleUserRegistered(supabase: any, payload: WebhookPayload) {
  console.log('Processing user registration:', payload.data);
  
  // Send welcome notification
  if (payload.user_id) {
    await supabase.from('notifications').insert({
      user_id: payload.user_id,
      type: 'system',
      title: 'Bem-vindo!',
      message: 'Sua conta foi criada com sucesso. Explore nossos imóveis!',
      data: { welcome: true }
    });
  }
}

async function handleLeadCreated(supabase: any, payload: WebhookPayload) {
  console.log('Processing lead created:', payload.data);
  
  // This should be handled by existing database triggers
  // But we can add additional analytics or external integrations here
}

async function handleVisitScheduled(supabase: any, payload: WebhookPayload) {
  console.log('Processing visit scheduled:', payload.data);
  
  // Could send confirmation emails or SMS here
}

async function handleChatMessage(supabase: any, payload: WebhookPayload) {
  console.log('Processing chat message:', payload.data);
  
  // Analytics and monitoring
}

async function handlePropertyViewed(supabase: any, payload: WebhookPayload) {
  console.log('Processing property view:', payload.data);
  
  // Update property view analytics
  if (payload.data.property_id) {
    await supabase.rpc('increment_property_views', {
      property_id: payload.data.property_id
    });
  }
}

async function triggerExternalWebhook(payload: WebhookPayload) {
  try {
    // Get webhook URL from site settings
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'external_webhook_url')
      .single();

    if (settings?.value && settings.value.trim() !== '') {
      console.log('Triggering external webhook:', settings.value);
      
      const response = await fetch(settings.value, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('External webhook failed:', response.status, response.statusText);
      } else {
        console.log('External webhook sent successfully');
      }
    }
  } catch (error) {
    console.error('Error triggering external webhook:', error);
  }
}
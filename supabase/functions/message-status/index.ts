import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { messageId, status, sessionId } = await req.json();

    if (!messageId || !status) {
      return new Response(JSON.stringify({ error: 'messageId and status are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Updating message ${messageId} status to ${status}`);

    // Update message status
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'read') {
      updateData.read_at = new Date().toISOString();
      // Also mark as delivered if not already
      updateData.delivered_at = updateData.delivered_at || new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .update(updateData)
      .eq('id', messageId)
      .select();

    if (error) {
      console.error('Error updating message status:', error);
      return new Response(JSON.stringify({ error: 'Failed to update message status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Broadcast status update via realtime
    if (sessionId) {
      const channel = supabase.channel(`chat-${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'message_status_update',
        payload: {
          messageId,
          status,
          delivered_at: updateData.delivered_at,
          read_at: updateData.read_at
        }
      });
    }

    console.log(`Message status updated successfully: ${messageId} -> ${status}`);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in message-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
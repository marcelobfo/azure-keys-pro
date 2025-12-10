import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tenant_id, user_id } = await req.json();

    console.log('OLX Lead Config action:', action, 'tenant:', tenant_id, 'user:', user_id);

    if (!action || !tenant_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: action, tenant_id, user_id' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's OLX access token
    const { data: integration, error: integrationError } = await supabase
      .from('olx_integration')
      .select('access_token')
      .eq('user_id', user_id)
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('OLX integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'OLX integration not found or inactive. Please connect to OLX first.' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current OLX settings
    const { data: settings, error: settingsError } = await supabase
      .from('olx_settings')
      .select('*')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching OLX settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch OLX settings' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings) {
      return new Response(
        JSON.stringify({ error: 'OLX settings not configured for this tenant' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate or use existing webhook token
    const webhookToken = settings.lead_webhook_token || crypto.randomUUID();
    const webhookUrl = `${supabaseUrl}/functions/v1/olx-webhook-lead/${webhookToken}`;

    if (action === 'register') {
      console.log('Registering lead webhook URL with OLX:', webhookUrl);

      // Register with OLX API
      const olxResponse = await fetch('https://apps.olx.com.br/autoservice/v1/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.access_token}`
        },
        body: JSON.stringify({
          url: webhookUrl,
          token: webhookToken
        })
      });

      const responseText = await olxResponse.text();
      console.log('OLX API response status:', olxResponse.status);
      console.log('OLX API response:', responseText);

      if (!olxResponse.ok) {
        let errorMessage = 'Failed to register with OLX';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.reason || errorMessage;
        } catch {}
        
        return new Response(
          JSON.stringify({ error: errorMessage, details: responseText }), 
          { status: olxResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = JSON.parse(responseText);
      console.log('OLX registration result:', result);

      // Save configuration
      const { error: updateError } = await supabase
        .from('olx_settings')
        .update({
          lead_config_id: result.id,
          lead_webhook_token: webhookToken,
          lead_webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant_id);

      if (updateError) {
        console.error('Error updating OLX settings:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save configuration' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          config_id: result.id,
          webhook_url: webhookUrl,
          message: 'Lead webhook registered successfully' 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get') {
      // Get current configuration from OLX
      if (!settings.lead_config_id) {
        return new Response(
          JSON.stringify({ configured: false }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const olxResponse = await fetch(`https://apps.olx.com.br/autoservice/v1/lead/${settings.lead_config_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        }
      });

      if (!olxResponse.ok) {
        // Config might have been deleted on OLX side
        if (olxResponse.status === 404) {
          // Clear local config
          await supabase
            .from('olx_settings')
            .update({
              lead_config_id: null,
              lead_webhook_url: null,
              updated_at: new Date().toISOString()
            })
            .eq('tenant_id', tenant_id);

          return new Response(
            JSON.stringify({ configured: false, message: 'Configuration not found on OLX' }), 
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Failed to fetch configuration from OLX' }), 
          { status: olxResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await olxResponse.json();
      return new Response(
        JSON.stringify({ 
          configured: true,
          config_id: result.id,
          webhook_url: result.url
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'update') {
      if (!settings.lead_config_id) {
        return new Response(
          JSON.stringify({ error: 'No configuration to update. Register first.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new token
      const newToken = crypto.randomUUID();
      const newWebhookUrl = `${supabaseUrl}/functions/v1/olx-webhook-lead/${newToken}`;

      const olxResponse = await fetch(`https://apps.olx.com.br/autoservice/v1/lead/${settings.lead_config_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.access_token}`
        },
        body: JSON.stringify({
          url: newWebhookUrl
        })
      });

      if (!olxResponse.ok) {
        const errorText = await olxResponse.text();
        return new Response(
          JSON.stringify({ error: 'Failed to update configuration on OLX', details: errorText }), 
          { status: olxResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update local settings
      await supabase
        .from('olx_settings')
        .update({
          lead_webhook_token: newToken,
          lead_webhook_url: newWebhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          webhook_url: newWebhookUrl,
          message: 'Configuration updated successfully' 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'delete') {
      if (!settings.lead_config_id) {
        return new Response(
          JSON.stringify({ error: 'No configuration to delete' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const olxResponse = await fetch(`https://apps.olx.com.br/autoservice/v1/lead/${settings.lead_config_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.access_token}`
        }
      });

      if (!olxResponse.ok && olxResponse.status !== 404) {
        const errorText = await olxResponse.text();
        return new Response(
          JSON.stringify({ error: 'Failed to delete configuration on OLX', details: errorText }), 
          { status: olxResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Clear local settings
      await supabase
        .from('olx_settings')
        .update({
          lead_config_id: null,
          lead_webhook_token: null,
          lead_webhook_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Configuration deleted successfully' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: register, get, update, delete' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in OLX lead config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract tenant token from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const tenantToken = pathParts[pathParts.length - 1];

    console.log('Received OLX lead webhook for token:', tenantToken);

    if (!tenantToken || tenantToken === 'olx-webhook-lead') {
      console.error('Missing tenant token in URL');
      return new Response(
        JSON.stringify({ error: 'Missing tenant token' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get optional authorization token from header (sent by OLX)
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('Auth token present:', !!authToken);

    // Find tenant by webhook token
    const { data: settings, error: settingsError } = await supabase
      .from('olx_settings')
      .select('tenant_id, lead_webhook_token')
      .eq('lead_webhook_token', tenantToken)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Database error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings) {
      console.error('Invalid tenant token:', tenantToken);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found tenant:', settings.tenant_id);

    // Parse OLX lead payload
    const olxLead = await req.json();
    console.log('OLX Lead payload:', JSON.stringify(olxLead, null, 2));

    /*
    Expected OLX payload:
    {
      "source": "OLX" or "WhatsApp",
      "adId": "a1234", // ID in integrator system (optional)
      "listId": "12345689", // ID in OLX
      "linkAd": "https://www.olx.com.br/vi/12345689",
      "name": "Cliente Name",
      "email": "email@example.com",
      "phone": "2199999999", // optional
      "message": "Olá, gostaria de saber mais...",
      "createdAt": "2019-02-12T14:30:00.500Z",
      "adsInfo": { ... }, // optional additional info
      "externalId": "123jdanjkdna-danjndaada" // optional unique ID
    }
    */

    // Validate required fields
    if (!olxLead.name || !olxLead.email || !olxLead.message) {
      console.error('Missing required fields:', { 
        name: !!olxLead.name, 
        email: !!olxLead.email, 
        message: !!olxLead.message 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, message' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate by externalId
    if (olxLead.externalId) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('external_id', olxLead.externalId)
        .maybeSingle();
      
      if (existing) {
        console.log('Lead already exists with externalId:', olxLead.externalId);
        return new Response(
          JSON.stringify({ 
            responseId: existing.id,
            message: 'Lead already exists' 
          }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Try to find property_id by olx_ad_id
    let propertyId = null;
    if (olxLead.adId) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('olx_ad_id', olxLead.adId)
        .eq('tenant_id', settings.tenant_id)
        .maybeSingle();
      
      propertyId = property?.id || null;
      console.log('Found property for adId:', olxLead.adId, '-> property_id:', propertyId);
    }

    // Determine source
    const source = olxLead.source === 'WhatsApp' ? 'olx_whatsapp' : 'olx';

    // Insert lead
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: olxLead.name,
        email: olxLead.email,
        phone: olxLead.phone || null,
        message: olxLead.message,
        property_id: propertyId,
        tenant_id: settings.tenant_id,
        source: source,
        external_id: olxLead.externalId || null,
        olx_list_id: olxLead.listId || null,
        olx_ad_id: olxLead.adId || null,
        olx_link: olxLead.linkAd || null,
        status: 'new'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lead' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead inserted successfully:', newLead.id);

    // Try to send WhatsApp notification (async, don't block)
    try {
      const notificationPromise = supabase.functions.invoke('whatsapp-notification', {
        body: { leadData: newLead }
      });
      // Don't await, let it run in background
      notificationPromise.catch(err => console.error('WhatsApp notification error:', err));
    } catch (notifError) {
      console.error('Error invoking notification:', notifError);
    }

    // Success response (2XX required by OLX)
    return new Response(
      JSON.stringify({
        responseId: newLead.id,
        message: 'Lead received successfully'
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing OLX lead:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

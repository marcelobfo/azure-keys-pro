import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let code: string | null = null;
    let user_id: string | null = null;
    let tenant_id: string | null = null;
    let stateParam: string | null = null;

    // Check if this is a GET request (redirect from OLX) or POST request (from frontend)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      stateParam = url.searchParams.get('state');
      
      // Decode state to get tenant_id
      if (stateParam) {
        try {
          const stateData = JSON.parse(atob(stateParam));
          tenant_id = stateData.tenant_id;
          console.log('Decoded state:', stateData);
        } catch (e) {
          console.error('Error decoding state:', e);
        }
      }

      // For GET requests, we need to redirect to frontend with the code
      // The frontend will then call this function via POST with user_id
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://vmlnzfodeubthlhjahpc.lovableproject.com';
      const redirectUrl = `${frontendUrl}/olx-callback?code=${code}&state=${stateParam || ''}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders
        }
      });
    }

    // POST request from frontend
    const body = await req.json();
    code = body.code;
    user_id = body.user_id;
    tenant_id = body.tenant_id;

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Código de autorização e user_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações da OLX para o tenant
    let settingsQuery = supabase.from('olx_settings').select('*');
    
    if (tenant_id) {
      settingsQuery = settingsQuery.eq('tenant_id', tenant_id);
    }
    
    const { data: settings, error: settingsError } = await settingsQuery.limit(1).single();

    if (settingsError || !settings) {
      console.error('OLX settings not found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações da OLX não encontradas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, client_secret, redirect_uri } = settings;

    // Trocar código por access_token
    const tokenResponse = await fetch('https://auth.olx.com.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: `Erro ao obter token: ${tokenData.error}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token, token_type } = tokenData;

    // Salvar ou atualizar token no banco com tenant_id
    const { error: upsertError } = await supabase
      .from('olx_integration')
      .upsert({
        user_id,
        tenant_id,
        access_token,
        token_type: token_type || 'Bearer',
        scope: 'autoupload basic_user_info',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error saving token:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OLX integration saved successfully for user:', user_id, 'tenant:', tenant_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Integração com OLX realizada com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in olx-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

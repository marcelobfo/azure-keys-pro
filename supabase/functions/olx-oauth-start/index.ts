import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações da OLX para o tenant específico
    let query = supabase.from('olx_settings').select('*');
    
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }
    
    const { data: settings, error: settingsError } = await query.limit(1).single();

    if (settingsError || !settings) {
      console.error('OLX settings not found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações da OLX não encontradas. Configure primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, redirect_uri } = settings;
    const scope = 'autoupload basic_user_info';
    
    // Criar state com tenant_id para identificação no callback
    const stateData = {
      tenant_id: tenant_id || null,
      nonce: crypto.randomUUID()
    };
    const state = btoa(JSON.stringify(stateData));

    // Construir URL de autorização
    const authUrl = new URL('https://auth.olx.com.br/oauth');
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('state', state);

    console.log('Generated OAuth URL for tenant:', tenant_id);
    console.log('State:', state);

    return new Response(
      JSON.stringify({ 
        auth_url: authUrl.toString(),
        state 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in olx-oauth-start:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

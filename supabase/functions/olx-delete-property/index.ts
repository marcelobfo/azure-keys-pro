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
    const { property_id, user_id, tenant_id } = await req.json();

    if (!property_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'property_id e user_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar token de acesso do usuário (filtrar por tenant se disponível)
    let integrationQuery = supabase
      .from('olx_integration')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (tenant_id) {
      integrationQuery = integrationQuery.eq('tenant_id', tenant_id);
    }
    
    const { data: integration, error: integrationError } = await integrationQuery.single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integração com OLX não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do imóvel
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('olx_ad_id')
      .eq('id', property_id)
      .single();

    if (propertyError || !property || !property.olx_ad_id) {
      return new Response(
        JSON.stringify({ error: 'Anúncio OLX não encontrado para este imóvel' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar payload de deleção
    const deletePayload = {
      access_token: integration.access_token,
      ad_list: [
        {
          id: property.olx_ad_id,
          operation: 'delete',
        }
      ]
    };

    console.log('Deleting from OLX:', deletePayload);

    // Enviar para OLX
    const olxResponse = await fetch('https://apps.olx.com.br/autoupload/import', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deletePayload),
    });

    const olxResult = await olxResponse.json();
    console.log('OLX Delete Response:', olxResult);

    // Atualizar status do imóvel
    await supabase
      .from('properties')
      .update({
        olx_status: olxResult.statusCode === 0 ? 'deleted' : 'error',
        olx_last_sync: new Date().toISOString(),
        olx_error_message: olxResult.statusCode !== 0 ? olxResult.statusMessage : null,
      })
      .eq('id', property_id);

    return new Response(
      JSON.stringify({
        success: olxResult.statusCode === 0,
        statusCode: olxResult.statusCode,
        statusMessage: olxResult.statusMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in olx-delete-property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

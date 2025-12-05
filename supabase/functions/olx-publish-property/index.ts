import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de tipos de imóvel para categorias OLX
const categoryMap: Record<string, number> = {
  'apartamento': 1020,
  'cobertura': 1020,
  'loft': 1020,
  'studio': 1020,
  'casa': 1040,
  'lote': 1100,
  'terreno': 1100,
};

// Mapeamento de apartment_type
const apartmentTypeMap: Record<string, string> = {
  'apartamento': '1',
  'cobertura': '2',
  'loft': '5',
  'studio': '4',
};

// Mapeamento de features para apartment_features
const apartmentFeaturesMap: Record<string, string> = {
  'ar condicionado': '1',
  'academia': '2',
  'armário': '3',
  'armários': '3',
  'varanda': '4',
  'área de serviço': '5',
  'quarto de serviço': '7',
  'piscina': '8',
  'mobiliado': '12',
};

// Mapeamento de features para home_features
const homeFeaturesMap: Record<string, string> = {
  'ar condicionado': '1',
  'piscina': '2',
  'armário': '3',
  'armários no quarto': '3',
  'varanda': '4',
  'área de serviço': '5',
  'churrasqueira': '6',
  'quarto de serviço': '7',
  'porteiro 24h': '8',
  'armários na cozinha': '9',
  'mobiliado': '10',
};

// Mapeamento de features para complex_features
const complexFeaturesMap: Record<string, string> = {
  'condomínio fechado': '1',
  'elevador': '2',
  'segurança 24h': '3',
  'portaria': '4',
  'portaria 24h': '4',
  'permitido animais': '5',
  'academia': '6',
  'piscina': '7',
  'salão de festas': '8',
};

function mapFeatures(features: string[], featureMap: Record<string, string>): string[] {
  const mapped: string[] = [];
  for (const feature of features || []) {
    const key = feature.toLowerCase();
    if (featureMap[key]) {
      mapped.push(featureMap[key]);
    }
  }
  return [...new Set(mapped)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, user_id, tenant_id, operation = 'insert' } = await req.json();

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
      console.error('OLX integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integração com OLX não encontrada. Conecte sua conta OLX primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações da OLX para telefone padrão (filtrar por tenant se disponível)
    let settingsQuery = supabase.from('olx_settings').select('default_phone');
    
    if (tenant_id) {
      settingsQuery = settingsQuery.eq('tenant_id', tenant_id);
    }
    
    const { data: settings } = await settingsQuery.limit(1).single();

    // Buscar dados do imóvel
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      console.error('Property not found:', propertyError);
      return new Response(
        JSON.stringify({ error: 'Imóvel não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar campos obrigatórios
    if (!property.zipcode) {
      return new Response(
        JSON.stringify({ error: 'CEP é obrigatório para publicar na OLX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!property.images || property.images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos uma imagem é obrigatória para publicar na OLX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar categoria
    const propertyType = property.property_type?.toLowerCase() || 'apartamento';
    const category = categoryMap[propertyType] || 1020;

    // Determinar tipo de operação (venda ou aluguel)
    const type = property.purpose === 'rent' ? 'u' : 's';

    // Determinar preço
    const price = type === 'u' ? (property.rental_price || property.price) : property.price;

    // Montar parâmetros específicos
    const params: Record<string, any> = {
      rooms: String(Math.min(property.bedrooms || 0, 5)),
    };

    if (property.bathrooms) {
      params.bathrooms = String(Math.min(property.bathrooms, 5));
    }

    if (property.garage_spaces !== null && property.garage_spaces !== undefined) {
      params.garage_spaces = String(Math.min(property.garage_spaces, 5));
    }

    if (property.area) {
      params.size = String(Math.round(property.area));
    }

    if (property.iptu_fee) {
      params.iptu = String(Math.round(property.iptu_fee));
    }

    if (property.condo_fee) {
      params.condominio = String(Math.round(property.condo_fee));
    }

    // Adicionar parâmetros específicos por categoria
    if (category === 1020) {
      // Apartamento
      params.apartment_type = apartmentTypeMap[propertyType] || '1';
      const features = mapFeatures(property.features || [], apartmentFeaturesMap);
      if (features.length > 0) {
        params.apartment_features = features;
      }
      const complexFeatures = mapFeatures(property.features || [], complexFeaturesMap);
      if (complexFeatures.length > 0) {
        params.apartment_complex_features = complexFeatures;
      }
    } else if (category === 1040) {
      // Casa
      params.home_type = '1'; // Padrão
      const features = mapFeatures(property.features || [], homeFeaturesMap);
      if (features.length > 0) {
        params.home_features = features;
      }
      const complexFeatures = mapFeatures(property.features || [], complexFeaturesMap);
      if (complexFeatures.length > 0) {
        params.home_complex_features = complexFeatures;
      }
    }

    // Montar anúncio
    const olxAdId = property.olx_ad_id || `prop_${property_id.substring(0, 15)}`;
    
    const adPayload = {
      access_token: integration.access_token,
      ad_list: [
        {
          id: olxAdId,
          operation,
          category,
          subject: property.title.substring(0, 90),
          body: (property.description || property.title).substring(0, 6000),
          phone: parseInt((settings?.default_phone || '').replace(/\D/g, '')) || 0,
          type,
          price: Math.round(price),
          zipcode: property.zipcode.replace(/\D/g, ''),
          params,
          images: property.images.slice(0, 20),
        }
      ]
    };

    console.log('Sending to OLX:', JSON.stringify(adPayload, null, 2));

    // Enviar para OLX
    const olxResponse = await fetch('https://apps.olx.com.br/autoupload/import', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adPayload),
    });

    const olxResult = await olxResponse.json();
    console.log('OLX Response:', olxResult);

    // Atualizar status do imóvel
    let olxStatus = 'pending';
    let errorMessage = null;

    if (olxResult.statusCode === 0) {
      olxStatus = 'published';
    } else if (olxResult.statusCode < 0) {
      olxStatus = 'error';
      errorMessage = olxResult.statusMessage;
      if (olxResult.errors && olxResult.errors.length > 0) {
        errorMessage += ': ' + olxResult.errors.map((e: any) => 
          e.messages?.map((m: any) => m.category).join(', ')
        ).join('; ');
      }
    }

    await supabase
      .from('properties')
      .update({
        olx_ad_id: olxAdId,
        olx_status: olxStatus,
        olx_last_sync: new Date().toISOString(),
        olx_error_message: errorMessage,
      })
      .eq('id', property_id);

    return new Response(
      JSON.stringify({
        success: olxResult.statusCode === 0,
        token: olxResult.token,
        statusCode: olxResult.statusCode,
        statusMessage: olxResult.statusMessage,
        errors: olxResult.errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in olx-publish-property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

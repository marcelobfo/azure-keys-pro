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
    const { property_id, client_name, client_email, client_phone, visit_date, visit_time, notes } = await req.json();

    console.log('Tentando inserir visita:', { property_id, client_name, client_email, client_phone, visit_date, visit_time, notes });

    // Create Supabase client with service_role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate required fields
    if (!client_name || !client_email || !visit_date || !visit_time) {
      console.log('Erro: Campos obrigatórios não fornecidos');
      return new Response(
        JSON.stringify({ error: 'Nome, email, data e horário são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert visit directly using service_role privileges
    const { data, error } = await supabase
      .from('visits')
      .insert({
        property_id: property_id || null,
        client_name: client_name.trim(),
        client_email: client_email.trim().toLowerCase(),
        client_phone: client_phone?.trim() || null,
        visit_date,
        visit_time,
        notes: notes?.trim() || null,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir visita:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Visita inserida com sucesso:', data);

    return new Response(
      JSON.stringify({ data, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
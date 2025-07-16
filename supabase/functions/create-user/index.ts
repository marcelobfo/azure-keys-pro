import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
  )

  try {
    const { email, password, full_name, role, phone } = await req.json()

    // Create the user using Supabase Auth Admin API
    const { data: user, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (userError) {
      // Handle specific error cases
      if (userError.message?.includes('already been registered') || (userError as any).code === 'email_exists') {
        return new Response(
          JSON.stringify({ 
            error: 'Este email já está cadastrado no sistema',
            success: false,
            code: 'email_exists'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict
          }
        );
      }
      
      // Handle other auth errors
      return new Response(
        JSON.stringify({ 
          error: userError.message || 'Erro ao criar usuário',
          success: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Insert the profile with additional information
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.user.id,
        email,
        full_name,
        role,
        phone: phone || null
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request if profile update fails, just log it
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user.user,
        message: 'Usuário criado com sucesso' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
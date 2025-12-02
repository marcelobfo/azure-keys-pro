import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    );

    const { email, password, full_name, role, phone, force_sync } = await req.json();

    console.log('Sync user request:', { email, full_name, role, force_sync });

    // Check if user exists in auth.users
    const { data: listData, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar usuários', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const existingUser = listData.users.find(u => u.email === email);

    if (existingUser) {
      console.log('User exists in auth.users:', existingUser.id);

      // Update password if provided
      if (password) {
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          existingUser.id,
          { password }
        );
        
        if (updateError) {
          console.error('Error updating password:', updateError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar senha', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        console.log('Password updated successfully');
      }

      // Upsert profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: existingUser.id,
          email,
          full_name,
          role,
          phone: phone || null
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar perfil', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      console.log('Profile upserted successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: existingUser,
          message: 'Usuário sincronizado com sucesso',
          synced: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // User doesn't exist - create new user
    console.log('Creating new user...');
    
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message || 'Erro ao criar usuário', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email,
        full_name,
        role,
        phone: phone || null
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: 'Usuário criado com sucesso',
        created: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in sync-user:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

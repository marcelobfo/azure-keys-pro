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

    const { email, password, full_name, role, phone, force_sync, tenant_id, app_role } = await req.json();

    console.log('Sync user request:', { email, full_name, role, force_sync, tenant_id, app_role });

    // Validate app_role if provided - never allow super_admin via API
    const validAppRoles = ['user', 'corretor', 'admin'];
    if (app_role && !validAppRoles.includes(app_role)) {
      console.error('Invalid app_role:', app_role);
      return new Response(
        JSON.stringify({ error: 'Role inválida', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

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

      // Upsert profile with tenant_id if provided
      const profileData: any = {
        id: existingUser.id,
        email,
        full_name,
        role,
        phone: phone || null
      };
      
      if (tenant_id) {
        profileData.tenant_id = tenant_id;
      }

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar perfil', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Create/update user_roles if tenant_id and app_role are provided
      if (tenant_id && app_role) {
        // First check if a role already exists for this user in this tenant
        const { data: existingRole, error: roleCheckError } = await supabaseClient
          .from('user_roles')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('tenant_id', tenant_id)
          .single();

        if (roleCheckError && roleCheckError.code !== 'PGRST116') {
          console.error('Error checking existing role:', roleCheckError);
        }

        if (existingRole) {
          // Update existing role
          const { error: roleUpdateError } = await supabaseClient
            .from('user_roles')
            .update({ role: app_role })
            .eq('id', existingRole.id);

          if (roleUpdateError) {
            console.error('Error updating user role:', roleUpdateError);
          } else {
            console.log('User role updated successfully');
          }
        } else {
          // Create new role
          const { error: roleInsertError } = await supabaseClient
            .from('user_roles')
            .insert({
              user_id: existingUser.id,
              role: app_role,
              tenant_id: tenant_id
            });

          if (roleInsertError) {
            console.error('Error creating user role:', roleInsertError);
          } else {
            console.log('User role created successfully');
          }
        }
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

    // Create profile with tenant_id if provided
    const newProfileData: any = {
      id: newUser.user.id,
      email,
      full_name,
      role,
      phone: phone || null
    };
    
    if (tenant_id) {
      newProfileData.tenant_id = tenant_id;
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert(newProfileData);

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Create user_roles if tenant_id and app_role are provided
    if (tenant_id && app_role) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: app_role,
          tenant_id: tenant_id
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      } else {
        console.log('User role created successfully for new user');
      }
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


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar token de autorização
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização obrigatório' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate token securely using database function
    const { data: tokens, error: tokenError } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('active', true)

    if (tokenError) {
      console.error('Token lookup error:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Erro de autenticação' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify token against all active tokens using secure verification
    let validToken = null
    for (const tokenRecord of tokens || []) {
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_token', { 
          token: token, 
          hash: tokenRecord.token_hash 
        })
      
      if (!verifyError && isValid) {
        validToken = tokenRecord
        break
      }
    }

    if (!validToken) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check token expiration
    if (validToken.expires_at && new Date(validToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update token last used timestamp
    await supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', validToken.id)

    if (req.method === 'GET') {
      // GET /api/leads - Listar leads
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ data: leads }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      // POST /api/leads - Criar lead
      const body = await req.json()
      
      const { name, email, phone, message, property_id } = body

      // Input validation and sanitization
      if (!name || !email) {
        return new Response(
          JSON.stringify({ error: 'Nome e email são obrigatórios' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Formato de email inválido' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Sanitize inputs
      const sanitizedName = name.trim().substring(0, 255)
      const sanitizedEmail = email.trim().toLowerCase().substring(0, 255)
      const sanitizedPhone = phone ? phone.trim().substring(0, 20) : null
      const sanitizedMessage = message ? message.trim().substring(0, 1000) : null

      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          message: sanitizedMessage,
          property_id,
          status: 'new'
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data: lead }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

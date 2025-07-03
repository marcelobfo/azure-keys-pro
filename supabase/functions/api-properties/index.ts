
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

    // Verificar se o token é válido
    const tokenHash = btoa(token)
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('active', true)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Atualizar último uso do token
    await supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    
    if (req.method === 'GET') {
      // GET /api/properties - Listar propriedades
      if (pathParts.length === 3) {
        const { data: properties, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ data: properties }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // GET /api/properties/:id - Obter propriedade específica
      if (pathParts.length === 4) {
        const propertyId = pathParts[3]
        
        const { data: property, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('status', 'available')
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ data: property }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { 
        status: 404, 
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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { email, keyName } = await req.json()

    // Verify admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single()

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get API key
    const { data: config } = await supabase
      .from('api_config')
      .select('key_value')
      .eq('key_name', keyName)
      .single()

    if (!config?.key_value) {
      return new Response(
        JSON.stringify({ success: false, error: 'No API key configured for this service.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let success = false
    let errorMsg = ''

    if (keyName === 'gemini') {
      // Test Gemini by listing models
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${config.key_value}`,
        { method: 'GET' }
      )
      if (res.ok) {
        success = true
      } else {
        const data = await res.json()
        errorMsg = data.error?.message || 'Invalid API key'
      }
    } else {
      errorMsg = `Unknown service: ${keyName}`
    }

    return new Response(
      JSON.stringify({ success, error: errorMsg || undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Test connection error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Connection test failed.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

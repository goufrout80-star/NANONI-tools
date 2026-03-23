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

    const { email, keyName, keyValue } = await req.json()

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

    if (!keyName) {
      return new Response(
        JSON.stringify({ error: 'Key name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert config
    const { error } = await supabase
      .from('api_config')
      .upsert(
        {
          key_name: keyName,
          key_value: keyValue || '',
          updated_at: new Date().toISOString(),
          updated_by: email,
        },
        { onConflict: 'key_name' }
      )

    if (error) throw error

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'save_api_config',
      email,
      details: JSON.stringify({ key_name: keyName }),
      success: true,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Save config error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to save config.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

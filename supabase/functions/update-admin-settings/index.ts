import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { email, key, value } = await req.json()

    if (!email || !key) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert setting
    const { error: upsertError } = await supabase
      .from('admin_settings')
      .upsert(
        {
          key,
          value: value ?? '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (upsertError) {
      throw upsertError
    }

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'admin_settings_update',
      email: email.toLowerCase().trim(),
      details: JSON.stringify({ key, valueLength: (value ?? '').length }),
      success: true,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Update admin settings error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

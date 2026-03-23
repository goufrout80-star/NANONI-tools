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

    const { email, toolName, promptText } = await req.json()

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

    if (!toolName || !promptText) {
      return new Response(
        JSON.stringify({ error: 'Tool name and prompt text required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert prompt
    const { error } = await supabase
      .from('tool_prompts')
      .upsert(
        {
          tool_name: toolName,
          prompt: promptText,
          updated_at: new Date().toISOString(),
          updated_by: email,
        },
        { onConflict: 'tool_name' }
      )

    if (error) throw error

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'save_prompt',
      email,
      details: JSON.stringify({ tool_name: toolName }),
      success: true,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Save prompt error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to save prompt.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

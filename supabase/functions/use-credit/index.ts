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

    const { email, toolName, creditCost = 1 } = await req.json()

    if (!email || !toolName) {
      return new Response(
        JSON.stringify({ error: 'Missing email or toolName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof creditCost !== 'number' || creditCost < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid creditCost' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // Check user has credits
    const { data: user } = await supabase
      .from('waitlist_submissions')
      .select('credits')
      .eq('email', cleanEmail)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if ((user.credits ?? 0) < creditCost) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Need ${creditCost}, have ${user.credits ?? 0}.`, creditsLeft: user.credits ?? 0 }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct credits
    const newCredits = (user.credits ?? creditCost) - creditCost
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({ credits: newCredits })
      .eq('email', cleanEmail)

    if (updateError) {
      throw new Error(`Failed to deduct credit: ${updateError.message}`)
    }

    // Log to tool_usage
    await supabase.from('tool_usage').insert({
      email: cleanEmail,
      tool_name: toolName,
      credits_used: creditCost,
    })

    return new Response(
      JSON.stringify({ success: true, creditsLeft: newCredits }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Use credit error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

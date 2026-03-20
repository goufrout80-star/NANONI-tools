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

    const { email, code } = await req.json()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    // ═══ RATE LIMIT: 5 attempts per email per 15min ═══
    const fifteenMinAgo = new Date(
      Date.now() - 15 * 60 * 1000
    ).toISOString()

    const { count: attempts } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', email.toLowerCase())
      .eq('action', 'verify_attempt')
      .gte('created_at', fifteenMinAgo)

    if ((attempts || 0) >= 5) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many attempts. Try again in 15 minutes.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ VALIDATE INPUTS ═══
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const codeRegex = /^NNN \d{4} \d{4}$/

    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!code || !codeRegex.test(code.trim().toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanCode = code.trim().toUpperCase()

    // ═══ TRACK ATTEMPT ═══
    await supabase.from('rate_limit_tracking').insert({
      identifier: cleanEmail,
      action: 'verify_attempt'
    })

    // ═══ FIND PENDING ═══
    const { data: pending } = await supabase
      .from('waitlist_pending')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (!pending) {
      await supabase.from('audit_log').insert({
        action: 'verify_code',
        email: cleanEmail,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
        error_message: 'No pending verification'
      })
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ CHECK EXPIRY ═══
    if (new Date() > new Date(pending.code_expires_at)) {
      await supabase
        .from('waitlist_pending')
        .delete()
        .eq('email', cleanEmail)

      return new Response(
        JSON.stringify({ error: 'CODE_EXPIRED' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ CHECK CODE ═══
    if (cleanCode !== pending.verification_code.trim().toUpperCase()) {
      await supabase.from('audit_log').insert({
        action: 'verify_code',
        email: cleanEmail,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
        error_message: 'Wrong code'
      })
      return new Response(
        JSON.stringify({ error: 'WRONG_CODE' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ MOVE TO CONFIRMED ═══
    const { error: insertError } = await supabase
      .from('waitlist_submissions')
      .insert([{
        name: pending.name,
        email: pending.email,
        role: pending.role,
        source: pending.source,
        verified: true,
        verified_at: new Date().toISOString()
      }])

    if (insertError && insertError.code !== '23505') {
      throw insertError
    }

    // ═══ CLEAN UP PENDING ═══
    await supabase
      .from('waitlist_pending')
      .delete()
      .eq('email', cleanEmail)

    // ═══ GET COUNT ═══
    const { count } = await supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact', head: true })

    // ═══ AUDIT LOG ═══
    await supabase.from('audit_log').insert({
      action: 'verify_code',
      email: cleanEmail,
      ip_address: ip,
      user_agent: userAgent,
      success: true
    })

    return new Response(
      JSON.stringify({ success: true, count: count || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Verify error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

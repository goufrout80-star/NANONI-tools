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

    // ═══ RATE LIMIT: 5 attempts per email per 15min ═══
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: attempts } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', cleanEmail)
      .eq('action', 'login_verify')
      .gte('created_at', fifteenMinAgo)

    if ((attempts || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: 'TOO_MANY_ATTEMPTS' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ TRACK ATTEMPT ═══
    await supabase.from('rate_limit_tracking').insert({
      identifier: cleanEmail,
      action: 'login_verify'
    })

    // ═══ FIND PENDING LOGIN ═══
    const { data: pending } = await supabase
      .from('login_pending')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (!pending) {
      return new Response(
        JSON.stringify({ error: 'No pending login. Request a new code.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ CHECK EXPIRY ═══
    if (new Date() > new Date(pending.code_expires_at)) {
      await supabase.from('login_pending').delete().eq('email', cleanEmail)
      return new Response(
        JSON.stringify({ error: 'CODE_EXPIRED' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ CHECK CODE ═══
    if (cleanCode !== pending.verification_code.trim().toUpperCase()) {
      const used = (attempts || 0) + 1
      const remaining = Math.max(0, 5 - used)

      await supabase.from('audit_log').insert({
        action: 'login_verify',
        email: cleanEmail,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
        error_message: 'Wrong code'
      })

      return new Response(
        JSON.stringify({ error: 'WRONG_CODE', attemptsRemaining: remaining }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ SUCCESS — CLEAN UP ═══
    await supabase.from('login_pending').delete().eq('email', cleanEmail)

    // ═══ AUDIT LOG ═══
    await supabase.from('audit_log').insert({
      action: 'login_verify',
      email: cleanEmail,
      ip_address: ip,
      user_agent: userAgent,
      success: true,
    })

    return new Response(
      JSON.stringify({ status: 'success', email: cleanEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Login verify error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

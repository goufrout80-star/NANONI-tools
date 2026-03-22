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

    const { email, captchaToken } = await req.json()
    const ip = req.headers.get('x-forwarded-for')
      || req.headers.get('x-real-ip')
      || 'unknown'

    // ═══ VERIFY hCAPTCHA ═══
    if (!captchaToken) {
      return new Response(
        JSON.stringify({ error: 'Captcha required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const captchaRes = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `response=${captchaToken}&secret=${Deno.env.get('HCAPTCHA_SECRET_KEY')}`
    })
    const captchaData = await captchaRes.json()
    if (!captchaData.success) {
      return new Response(
        JSON.stringify({ error: 'Captcha verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ VALIDATE EMAIL ═══
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // ═══ RATE LIMIT: 3 sends per email per 15min ═══
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: recentSends } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', cleanEmail)
      .eq('action', 'login_send')
      .gte('created_at', fifteenMinAgo)

    if ((recentSends || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ CHECK: is email on the verified waitlist? ═══
    const { data: submission } = await supabase
      .from('waitlist_submissions')
      .select('email, name')
      .eq('email', cleanEmail)
      .single()

    if (!submission) {
      // Check if still pending verification
      const { data: pending } = await supabase
        .from('waitlist_pending')
        .select('email')
        .eq('email', cleanEmail)
        .single()

      if (pending) {
        return new Response(
          JSON.stringify({ status: 'pending' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ status: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ GENERATE LOGIN CODE ═══
    const digits = () => String(Math.floor(1000 + Math.random() * 9000))
    const code = `NNN ${digits()} ${digits()}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // ═══ UPSERT INTO login_pending ═══
    await supabase
      .from('login_pending')
      .upsert({
        email: cleanEmail,
        verification_code: code,
        code_expires_at: expiresAt,
      }, { onConflict: 'email' })

    // ═══ TRACK RATE LIMIT ═══
    await supabase.from('rate_limit_tracking').insert({
      identifier: cleanEmail,
      action: 'login_send'
    })

    // ═══ SEND EMAIL VIA RESEND ═══
    const cleanName = submission.name || 'there'
    const [prefix, p1, p2] = code.split(' ')
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>Sign in — NANONI Studio</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background-color:#0B0B0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased}
    .wrapper{background-color:#0B0B0F;padding:48px 24px;width:100%}
    .container{max-width:560px;margin:0 auto;background:#111116;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden}
    .header{padding:32px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.06)}
    .header-top{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px}
    .logo-nanoni{color:#FF3D00}
    .logo-studio{color:#A0A0A0;font-weight:400}
    .header-gradient-line{height:2px;background:linear-gradient(to right,#FF3D00,#7A6FFF,rgba(122,111,255,0));border-radius:999px}
    .hero-banner{background:linear-gradient(135deg,rgba(255,61,0,0.08) 0%,rgba(122,111,255,0.08) 100%);border-bottom:1px solid rgba(255,255,255,0.04);padding:36px 40px;text-align:center}
    .hero-badge{display:inline-block;background:rgba(122,111,255,0.12);border:1px solid rgba(122,111,255,0.25);border-radius:999px;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#7A6FFF;margin-bottom:16px}
    .hero-title{font-size:26px;font-weight:800;color:#F5F0EB;line-height:1.2;margin-bottom:8px;letter-spacing:-0.5px}
    .hero-subtitle{font-size:15px;color:#A0A0A0;line-height:1.5}
    .content{padding:36px 40px}
    .step-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7A6FFF;margin-bottom:12px}
    .instruction{font-size:15px;color:#A0A0A0;line-height:1.7;margin-bottom:28px}
    .code-wrapper{background:#0B0B0F;border:1px solid rgba(255,61,0,0.25);border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:12px}
    .code-label{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#7A6FFF;margin-bottom:20px}
    .code-display{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px}
    .code-prefix{font-size:42px;font-weight:900;color:#FF3D00;letter-spacing:4px;font-family:'Courier New',monospace}
    .code-separator{width:1px;height:40px;background:rgba(255,255,255,0.1);display:inline-block}
    .code-numbers{font-size:42px;font-weight:900;color:#F5F0EB;letter-spacing:8px;font-family:'Courier New',monospace}
    .code-expiry{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#A0A0A0;margin-top:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:999px;padding:5px 14px}
    .expiry-dot{width:6px;height:6px;border-radius:50%;background:#FF3D00;display:inline-block}
    .security-note{background:rgba(122,111,255,0.05);border:1px solid rgba(122,111,255,0.1);border-radius:12px;padding:16px 20px;margin-top:24px;display:flex;gap:12px;align-items:flex-start}
    .security-text{font-size:13px;color:#A0A0A0;line-height:1.6}
    .security-text strong{color:#7A6FFF;font-weight:600}
    .footer{padding:28px 40px;text-align:center}
    .footer-divider{height:1px;background:rgba(255,255,255,0.06);margin-bottom:24px}
    .footer-copy{font-size:12px;color:rgba(255,255,255,0.2);margin-bottom:4px}
    .footer-email{font-size:11px;color:rgba(255,255,255,0.12)}
    @media(max-width:480px){.wrapper{padding:24px 16px}.header,.hero-banner,.content,.footer{padding:24px}.hero-title{font-size:22px}.code-prefix,.code-numbers{font-size:28px}}
  </style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <div class="header-top">
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#0B0B0F"/>
          <path d="M6 6L6 26L10 26L10 13L22 26L26 26L26 6L22 6L22 19L10 6Z" fill="#FF3D00"/>
        </svg>
        <span class="logo-text"><span class="logo-nanoni">NANONI</span><span class="logo-studio"> Studio</span></span>
      </div>
      <div class="header-gradient-line"></div>
    </div>

    <div class="hero-banner">
      <div class="hero-badge">Sign In</div>
      <h1 class="hero-title">Welcome back, <span style="color:#FF3D00">${cleanName}</span></h1>
      <p class="hero-subtitle">Use the code below to sign in to your NANONI Studio account.</p>
    </div>

    <div class="content">
      <p class="step-label">Your Login Code</p>
      <p class="instruction">Copy this code and paste it on the login page at <strong style="color:#F5F0EB">nanoni.studio/login</strong>. The code is valid for <strong style="color:#FF3D00">10 minutes only.</strong></p>

      <div class="code-wrapper">
        <p class="code-label">Login Verification Code</p>
        <div class="code-display">
          <span class="code-prefix">${prefix}</span>
          <span class="code-separator"></span>
          <span class="code-numbers">${p1}&nbsp;${p2}</span>
        </div>
        <div class="code-expiry">
          <span class="expiry-dot"></span>
          Expires in 10 minutes
        </div>
      </div>

      <div class="security-note">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="flex-shrink:0;margin-top:1px" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="12" height="9" rx="2" stroke="#7A6FFF" stroke-width="1.5"/>
          <path d="M6 8V5.5a3 3 0 016 0V8" stroke="#7A6FFF" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p class="security-text"><strong>Never share this code.</strong> NANONI Studio will never ask for your login code via phone, chat, or any other channel. If you did not request this — simply ignore this email.</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-divider"></div>
      <p class="footer-copy">&copy; 2026 NANONI Studio. All rights reserved.</p>
      <p class="footer-email">noreply@nanoni.studio</p>
    </div>
  </div>
</div>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NANONI Studio <noreply@nanoni.studio>',
        to: cleanEmail,
        subject: `${code} \u00b7 Sign in to NANONI Studio`,
        html,
      }),
    })

    if (!resendRes.ok) {
      throw new Error('Failed to send email')
    }

    // ═══ AUDIT LOG ═══
    await supabase.from('audit_log').insert({
      action: 'login_send_code',
      email: cleanEmail,
      ip_address: ip,
      success: true,
    })

    return new Response(
      JSON.stringify({ status: 'sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Login send error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

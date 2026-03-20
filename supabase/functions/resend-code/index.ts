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

    const { email } = await req.json()
    const cleanEmail = email.toLowerCase().trim()

    // ═══ RATE LIMIT: 2 resends per email per hour ═══
    const oneHourAgo = new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString()

    const { count: resends } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', cleanEmail)
      .eq('action', 'resend')
      .gte('created_at', oneHourAgo)

    if ((resends || 0) >= 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many resend requests. Try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: pending } = await supabase
      .from('waitlist_pending')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (!pending) {
      return new Response(
        JSON.stringify({ error: 'No pending verification.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══ NEW CODE ═══
    const bytes = crypto.getRandomValues(new Uint8Array(4))
    const num = new DataView(bytes.buffer).getUint32(0)
    const codeNum = (num % 100000000)
      .toString().padStart(8, '0')
    const newCode = `NNN ${codeNum.slice(0,4)} ${codeNum.slice(4)}` 
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await supabase
      .from('waitlist_pending')
      .update({
        verification_code: newCode,
        code_expires_at: newExpiry.toISOString()
      })
      .eq('email', cleanEmail)

    await supabase.from('rate_limit_tracking').insert({
      identifier: cleanEmail,
      action: 'resend'
    })

    // ═══ SEND EMAIL VIA RESEND ═══
    const [prefix, p1, p2] = newCode.split(' ')
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New code — NANONI Studio</title>
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
    .social-link{display:inline-block;font-size:12px;color:#A0A0A0;text-decoration:none;margin:0 8px}
    .footer-tagline{font-size:13px;color:rgba(255,255,255,0.3);font-style:italic;margin-bottom:16px}
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
      <div class="hero-badge">New Verification Code</div>
      <h1 class="hero-title">Here's your new code, <span style="color:#FF3D00">${pending.name}</span></h1>
      <p class="hero-subtitle">Your previous code expired. Use this new code to complete your waitlist verification.</p>
    </div>

    <div class="content">
      <p class="step-label">Step 1 of 1 — Verify</p>
      <p class="instruction">Copy this code and paste it into the verification popup on <strong style="color:#F5F0EB">nanoni.studio</strong>. The code is valid for <strong style="color:#FF3D00">10 minutes only.</strong></p>

      <div class="code-wrapper">
        <p class="code-label">Your New Verification Code</p>
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
        <p class="security-text"><strong>Never share this code.</strong> NANONI Studio will never ask for your verification code via phone, chat, or any other channel. If you did not request this — simply ignore this email.</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-divider"></div>
      <p class="footer-tagline">"Design Smarter. Brand Faster. Create Everything."</p>
      <div style="margin-bottom:16px">
        <a class="social-link" href="https://instagram.com/nanonistudio">Instagram</a>
        <a class="social-link" href="https://twitter.com/nanonistudio">Twitter / X</a>
        <a class="social-link" href="https://linkedin.com/company/nanonistudio">LinkedIn</a>
      </div>
      <p class="footer-copy">© 2026 NANONI Studio. All rights reserved.</p>
      <p class="footer-email">noreply@nanoni.studio</p>
    </div>
  </div>

  <p style="text-align:center;margin-top:20px;font-size:12px;color:rgba(255,255,255,0.15)">You received this because you signed up at nanoni.studio</p>
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
        subject: `${newCode} · New code — NANONI Studio`,
        html,
      }),
    })

    if (!resendRes.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Resend error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

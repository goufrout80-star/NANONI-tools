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

    const { adminEmail, toEmail, subject, message } = await req.json()

    if (!adminEmail || !toEmail || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', adminEmail.toLowerCase().trim())
      .single()

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0F;font-family:'Inter','Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:8px;">
      <span style="font-size:22px;font-weight:800;color:#FF3D00;">NANONI</span>
      <span style="font-size:22px;font-weight:400;color:#A0A0A0;"> Studio</span>
    </div>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#FF3D00,#7A6FFF,transparent);margin-bottom:40px;border-radius:1px;"></div>

    <div style="background:#111116;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:40px 32px;">
      <p style="color:#F0E8DE;font-size:15px;line-height:1.8;margin:0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>

    <p style="text-align:center;color:#555;font-size:12px;margin-top:32px;">
      &copy; 2026 NANONI Studio. All rights reserved.
    </p>
  </div>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NANONI Studio <hello@nanoni.studio>',
        to: toEmail.toLowerCase().trim(),
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      throw new Error('Failed to send email')
    }

    // Log audit
    await supabase.from('audit_log').insert({
      action: 'send_manual_email',
      email: adminEmail.toLowerCase().trim(),
      success: true,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Send manual email error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

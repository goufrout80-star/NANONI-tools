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

    const { email, adminEmail } = await req.json()

    if (!email || !adminEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing email or adminEmail' }),
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

    const cleanEmail = email.toLowerCase().trim()

    // Update waitlist_submissions
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        credits: 50,
      })
      .eq('email', cleanEmail)

    if (updateError) {
      throw new Error(`Failed to approve: ${updateError.message}`)
    }

    // Get user name for email
    const { data: userData } = await supabase
      .from('waitlist_submissions')
      .select('name')
      .eq('email', cleanEmail)
      .single()

    const userName = userData?.name || 'there'

    // Send approval email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
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

    <div style="background:#111116;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>
      <h1 style="color:#F0E8DE;font-size:28px;font-weight:800;margin:0 0 12px;">You're Approved!</h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hey ${userName}, great news! Your early access to NANONI Studio has been approved.
      </p>

      <div style="background:rgba(255,61,0,0.08);border:1px solid rgba(255,61,0,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#F0E8DE;font-size:14px;margin:0;font-weight:600;">
          You have <span style="color:#FF3D00;font-size:20px;">50</span> free credits to try Face Swap
        </p>
        <p style="color:#A0A0A0;font-size:12px;margin:8px 0 0;">Powered by NNN v1</p>
      </div>

      <a href="https://nanoni.studio/login?email=${encodeURIComponent(cleanEmail)}"
         style="display:inline-block;background:#FF3D00;color:#fff;font-size:16px;font-weight:700;padding:14px 40px;border-radius:12px;text-decoration:none;margin-top:8px;">
        Start Using NANONI Studio
      </a>
    </div>

    <p style="text-align:center;color:#555;font-size:12px;margin-top:32px;">
      &copy; 2026 NANONI Studio. All rights reserved.
    </p>
  </div>
</body>
</html>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NANONI Studio <noreply@nanoni.studio>',
          to: cleanEmail,
          subject: "You're in! NANONI Studio Early Access 🎉",
          html,
        }),
      })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      action: 'approve_user',
      email: cleanEmail,
      success: true,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Approve user error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

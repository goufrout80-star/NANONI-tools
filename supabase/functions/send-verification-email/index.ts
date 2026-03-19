import { serve } from 'https://deno.land/std@0.168.0/http/server.ts' 
 
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') 
 
serve(async (req) => { 
  if (req.method === 'OPTIONS') { 
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers':  
          'authorization, x-client-info, apikey, content-type', 
      } 
    }) 
  } 
 
  try { 
    const { name, email, code } = await req.json() 
    const [prefix, part1, part2] = code.split(' ') 
 
    const html = ` 
<!DOCTYPE html> 
<html> 
<head> 
  <meta charset="utf-8"> 
  <style> 
    body {  
      background: #0B0B0F;  
      font-family: Arial, sans-serif; 
      margin: 0; padding: 40px 20px; 
    } 
    .container { 
      max-width: 560px; margin: 0 auto; 
      background: #111116; 
      border-radius: 16px; 
      border: 1px solid rgba(255,255,255,0.06); 
      overflow: hidden; 
    } 
    .header { 
      padding: 32px 40px 24px; 
      border-bottom: 1px solid rgba(255,255,255,0.06); 
    } 
    .logo-nanoni {  
      color: #FF3D00; font-size: 20px;  
      font-weight: 800; letter-spacing: -0.5px; 
    } 
    .logo-studio {  
      color: #A0A0A0; font-size: 20px; 
      font-weight: 400; 
    } 
    .header-line { 
      height: 2px; 
      background: linear-gradient( 
        to right, #FF3D00, #7A6FFF, transparent 
      ); 
      margin-top: 16px; 
      border-radius: 999px; 
    } 
    .content { padding: 40px; } 
    .greeting {  
      color: #A0A0A0; font-size: 15px;  
      margin: 0 0 8px; 
    } 
    .heading { 
      color: #F5F0EB; font-size: 28px; 
      font-weight: 700; margin: 0 0 16px; 
    } 
    .subtext { 
      color: #A0A0A0; font-size: 15px; 
      line-height: 1.6; margin: 0 0 24px; 
    } 
    .code-box { 
      background: #0B0B0F; 
      border: 1px solid rgba(255,61,0,0.2); 
      border-radius: 12px; 
      padding: 28px; 
      text-align: center; 
      margin: 0 0 24px; 
    } 
    .code-label { 
      color: #7A6FFF; font-size: 11px; 
      font-weight: 600; letter-spacing: 2px; 
      text-transform: uppercase; 
      margin: 0 0 16px; 
    } 
    .code-value { 
      font-size: 36px; font-weight: 800; 
      letter-spacing: 6px; margin: 0 0 12px; 
    } 
    .code-nnn { color: #FF3D00; } 
    .code-digits { color: #F5F0EB; } 
    .code-expiry { 
      color: #A0A0A0; font-size: 12px; margin: 0; 
    } 
    .info-section { 
      padding: 24px 40px; 
      background: rgba(122,111,255,0.05); 
      border-top: 1px solid rgba(122,111,255,0.1); 
      border-bottom: 1px solid rgba(122,111,255,0.1); 
    } 
    .info-title { 
      color: #7A6FFF; font-size: 11px; 
      font-weight: 600; letter-spacing: 1.5px; 
      text-transform: uppercase; margin: 0 0 8px; 
    } 
    .info-text { 
      color: #A0A0A0; font-size: 14px; 
      line-height: 1.6; margin: 0; 
    } 
    .footer { padding: 24px 40px 32px; } 
    .footer-divider { 
      height: 1px; 
      background: rgba(255,255,255,0.06); 
      margin-bottom: 20px; 
    } 
    .footer-text { 
      color: rgba(255,255,255,0.2); 
      font-size: 12px; text-align: center; 
      margin: 0 0 4px; 
    } 
    .footer-email { 
      color: rgba(255,255,255,0.1); 
      font-size: 11px; text-align: center; margin: 0; 
    } 
  </style> 
</head> 
<body> 
  <div class="container"> 
    <div class="header"> 
      <span class="logo-nanoni">NANONI</span> 
      <span class="logo-studio"> Studio</span> 
      <div class="header-line"></div> 
    </div> 
    <div class="content"> 
      <p class="greeting">Hey ${name} 👋</p> 
      <h1 class="heading">Verify your email address</h1> 
      <p class="subtext"> 
        You're one step away from joining the NANONI  
        Studio waitlist. Enter this code to confirm  
        your spot: 
      </p> 
      <div class="code-box"> 
        <p class="code-label">YOUR VERIFICATION CODE</p> 
        <p class="code-value"> 
          <span class="code-nnn">${prefix}</span> 
          <span class="code-digits"> ${part1} ${part2}</span> 
        </p> 
        <p class="code-expiry"> 
          ⏱ This code expires in 10 minutes 
        </p> 
      </div> 
      <p class="subtext"> 
        If you didn't request this, you can safely  
        ignore this email. 
      </p> 
    </div> 
    <div class="info-section"> 
      <p class="info-title">What is NANONI Studio?</p> 
      <p class="info-text"> 
        19 AI-powered creative tools in one unified  
        platform — Face Swap, Brand DNA, PostFlow,  
        Ad Pack Generator, and more. Built for agencies,  
        creators, and brands. Powered by Google Gemini. 
      </p> 
    </div> 
    <div class="footer"> 
      <div class="footer-divider"></div> 
      <p class="footer-text"> 
        © 2026 NANONI Studio. All rights reserved. 
      </p> 
      <p class="footer-email">noreply@nanoni.studio</p> 
    </div> 
  </div> 
</body> 
</html>` 
 
    const res = await fetch('https://api.resend.com/emails', { 
      method: 'POST', 
      headers: { 
        'Authorization': `Bearer ${RESEND_API_KEY}`, 
        'Content-Type': 'application/json', 
      }, 
      body: JSON.stringify({ 
        from: 'NANONI Studio <noreply@nanoni.studio>', 
        to: email, 
        subject: `${code} — Your NANONI Studio verification code`, 
        html, 
      }), 
    }) 
 
    if (!res.ok) { 
      throw new Error('Failed to send email') 
    } 
 
    return new Response( 
      JSON.stringify({ success: true }), 
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*', 
        } 
      } 
    ) 
  } catch (err) { 
    return new Response( 
      JSON.stringify({ error: 'Failed to send email' }), 
      {  
        status: 500, 
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*', 
        } 
      } 
    ) 
  } 
})
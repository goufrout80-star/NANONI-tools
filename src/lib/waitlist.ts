import { supabase } from './supabase' 
import { generateNNNCode, getCodeExpiry } from './generateCode' 
 
// STEP 1: Submit form → save pending + send email 
export async function submitWaitlist(data: { 
  name: string 
  email: string 
  role: string 
  source: string 
}) { 
  // Check already verified 
  const { data: existing } = await supabase 
    .from('waitlist_submissions') 
    .select('email') 
    .eq('email', data.email) 
    .single() 
 
  if (existing) { 
    throw new Error('This email is already on the waitlist!') 
  } 
 
  const code = generateNNNCode() 
  const expiresAt = getCodeExpiry() 
 
  // Save to pending 
  const { error: pendingError } = await supabase 
    .from('waitlist_pending') 
    .upsert([{ 
      name: data.name, 
      email: data.email, 
      role: data.role, 
      source: data.source, 
      verification_code: code, 
      code_expires_at: expiresAt.toISOString() 
    }], { onConflict: 'email' }) 
 
  if (pendingError) throw pendingError 
 
  // Call Supabase Edge Function to send email 
  const { error: emailError } = await supabase 
    .functions.invoke('send-verification-email', { 
      body: { name: data.name, email: data.email, code } 
    }) 
 
  if (emailError) throw emailError 
 
  return { success: true } 
} 
 
// STEP 2: Verify code 
export async function verifyCode( 
  email: string,  
  code: string 
) { 
  const { data: pending, error } = await supabase 
    .from('waitlist_pending') 
    .select('*') 
    .eq('email', email) 
    .single() 
 
  if (error || !pending) { 
    throw new Error('No verification found for this email.') 
  } 
 
  // Check expiry 
  if (new Date() > new Date(pending.code_expires_at)) { 
    await supabase 
      .from('waitlist_pending') 
      .delete() 
      .eq('email', email) 
    throw new Error('CODE_EXPIRED') 
  } 
 
  // Check code 
  if (code.trim().toUpperCase() !==  
      pending.verification_code.trim().toUpperCase()) { 
    throw new Error('WRONG_CODE') 
  } 
 
  // Move to confirmed 
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
 
  if (insertError) throw insertError 
 
  // Clean up pending 
  await supabase 
    .from('waitlist_pending') 
    .delete() 
    .eq('email', email) 
 
  // Get count 
  const { count } = await supabase 
    .from('waitlist_submissions') 
    .select('*', { count: 'exact', head: true }) 
 
  return { success: true, count: count || 0 } 
} 
 
// STEP 3: Resend code 
export async function resendCode(email: string) { 
  const { data: pending } = await supabase 
    .from('waitlist_pending') 
    .select('*') 
    .eq('email', email) 
    .single() 
 
  if (!pending) { 
    throw new Error('No pending verification found.') 
  } 
 
  const newCode = generateNNNCode() 
  const newExpiry = getCodeExpiry() 
 
  await supabase 
    .from('waitlist_pending') 
    .update({ 
      verification_code: newCode, 
      code_expires_at: newExpiry.toISOString() 
    }) 
    .eq('email', email) 
 
  await supabase.functions.invoke( 
    'send-verification-email', { 
      body: {  
        name: pending.name,  
        email,  
        code: newCode  
      } 
    } 
  ) 
 
  return { success: true } 
} 
 
// GET count 
export async function getWaitlistCount() { 
  const { count } = await supabase 
    .from('waitlist_submissions') 
    .select('*', { count: 'exact', head: true }) 
  return count || 0 
}
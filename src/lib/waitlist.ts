import { supabase } from './supabase'
import { WaitlistSchema, VerificationSchema } from './validation'

// ═══════════════════════════════════════════════════════════════
// SECURE WAITLIST API — ALL LOGIC IN EDGE FUNCTIONS
// Client only validates and calls Edge Functions
// No direct database access from client
// ═══════════════════════════════════════════════════════════════

// STEP 1: Submit form → Edge Function handles everything
export async function submitWaitlist(rawData: unknown) {
  // ✅ Validate with Zod first (client-side validation)
  const data = WaitlistSchema.parse(rawData)

  // ✅ Call Edge Function — NOT direct DB
  const { error } = await supabase.functions
    .invoke('submit-waitlist', { body: data })

  if (error) {
    // Only throw for rate limiting - all other errors return success
    // This prevents email enumeration attacks
    if (error.message?.includes('429') || error.message?.includes('Too many')) {
      throw new Error('Too many requests. Please wait and try again.')
    }
    // For ALL other errors (including duplicate email):
    // Return success silently to prevent revealing if email exists
    // User gets "check your email" message either way
  }
  
  // Always show success to prevent email enumeration
  return { success: true }
}

// STEP 2: Verify code → Edge Function validates
export async function verifyCode(
  email: string, 
  code: string
) {
  // ✅ Validate format client-side
  VerificationSchema.parse({ email, code })

  // ✅ Call Edge Function for server-side verification
  const { data, error } = await supabase.functions
    .invoke('verify-code', { body: { email, code } })

  if (error) {
    const msg = error.message || 'Something went wrong'
    
    // Handle specific error cases
    if (msg.includes('WRONG_CODE')) 
      throw new Error('WRONG_CODE')
    if (msg.includes('CODE_EXPIRED')) 
      throw new Error('CODE_EXPIRED')
    if (msg.includes('429') || msg.includes('Too many')) 
      throw new Error('TOO_MANY_ATTEMPTS')
    if (msg.includes('401') || msg.includes('Invalid')) 
      throw new Error('INVALID_CODE')
    
    throw new Error(msg)
  }

  return data
}

// STEP 3: Resend code → Edge Function handles
export async function resendCode(email: string) {
  // ✅ Call Edge Function
  const { error } = await supabase.functions
    .invoke('resend-code', { body: { email } })

  if (error) {
    const msg = error.message || 'Failed to resend code'
    
    if (msg.includes('429') || msg.includes('Too many')) 
      throw new Error('TOO_MANY_RESENDS')
    if (msg.includes('404') || msg.includes('No pending')) 
      throw new Error('NO_PENDING_VERIFICATION')
    
    throw error
  }

  return { success: true }
}

// GET count — This is safe (RLS allows count but not row access)
export async function getWaitlistCount() {
  const { count } = await supabase
    .from('waitlist_submissions')
    .select('*', { count: 'exact', head: true })
  return count || 0
}
import { supabase } from './supabase'

// ═══════════════════════════════════════════════════════════════
// LOGIN API — calls Edge Functions for login flow
// ═══════════════════════════════════════════════════════════════

export type SendCodeResult = 
  | { status: 'sent' }
  | { status: 'not_found' }
  | { status: 'pending' }

export async function sendLoginCode(
  email: string,
  captchaToken: string
): Promise<SendCodeResult> {
  const { data, error } = await supabase.functions
    .invoke('send-login-code', { body: { email, captchaToken } })

  if (error) {
    const msg = error.message || ''
    if (msg.includes('429') || msg.includes('Too many'))
      throw new Error('Too many requests. Please wait and try again.')
    if (msg.includes('Captcha'))
      throw new Error('Captcha verification failed. Please try again.')
    throw new Error(msg || 'Something went wrong.')
  }

  return data as SendCodeResult
}

export interface VerifyLoginResult {
  status: 'success'
  email: string
}

export interface VerifyLoginError {
  error: string
  attemptsRemaining?: number
}

export async function verifyLoginCode(
  email: string,
  code: string
): Promise<VerifyLoginResult> {
  const { data, error } = await supabase.functions
    .invoke('verify-login-code', { body: { email, code } })

  if (error) {
    const msg = error.message || ''

    if (msg.includes('WRONG_CODE')) {
      // Try to parse attemptsRemaining from the response
      let remaining = undefined
      try {
        const parsed = JSON.parse(msg)
        remaining = parsed.attemptsRemaining
      } catch {
        // Try extracting from the error context
      }
      const err = new Error('WRONG_CODE') as any
      err.attemptsRemaining = remaining
      throw err
    }
    if (msg.includes('CODE_EXPIRED'))
      throw new Error('CODE_EXPIRED')
    if (msg.includes('TOO_MANY_ATTEMPTS'))
      throw new Error('TOO_MANY_ATTEMPTS')
    if (msg.includes('429'))
      throw new Error('TOO_MANY_ATTEMPTS')

    throw new Error(msg || 'Verification failed.')
  }

  return data as VerifyLoginResult
}

// ═══ SESSION MANAGEMENT ═══

const SESSION_KEY = 'nanoni_session'

interface Session {
  email: string
  loginAt: number
  expiresAt: number | null // null = browser close
}

export function setSession(email: string, rememberMe: boolean) {
  const session: Session = {
    email,
    loginAt: Date.now(),
    expiresAt: rememberMe ? Date.now() + 2 * 24 * 60 * 60 * 1000 : null,
  }

  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function getSession(): Session | null {
  const raw =
    localStorage.getItem(SESSION_KEY) ||
    sessionStorage.getItem(SESSION_KEY)

  if (!raw) return null

  try {
    const session: Session = JSON.parse(raw)

    // Check expiry for localStorage sessions
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

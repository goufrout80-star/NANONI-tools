import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'user'

interface AuthSession {
  email: string
  name: string
  role: UserRole
  credits: number
  tier: 'free' | 'pro'
  tutorialCompleted: boolean
  sessionExpiry: number
}

interface AuthContextType {
  session: AuthSession | null
  loading: boolean
  login: (email: string, rememberMe: boolean) => Promise<void>
  logout: () => void
  isAdmin: () => boolean
  isAuthenticated: () => boolean
  refreshCredits: () => Promise<void>
  updateSession: (updates: Partial<AuthSession>) => void
  completeTutorial: () => Promise<void>
}

const SESSION_KEY = 'nanoni_session'
const ADMIN_EMAIL = 'mmmmorad123@gmail.com'
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Load session on mount
  useEffect(() => {
    const stored =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY)

    if (!stored) {
      setLoading(false)
      return
    }

    try {
      const parsed: AuthSession = JSON.parse(stored)

      // Check expiry
      if (parsed.sessionExpiry && Date.now() > parsed.sessionExpiry) {
        localStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(SESSION_KEY)
        setLoading(false)
        return
      }

      setSession(parsed)
    } catch {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
    }

    setLoading(false)
  }, [])

  const persistSession = useCallback((s: AuthSession, rememberMe: boolean) => {
    const json = JSON.stringify(s)
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, json)
      sessionStorage.removeItem(SESSION_KEY)
    } else {
      sessionStorage.setItem(SESSION_KEY, json)
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  const login = useCallback(async (email: string, rememberMe: boolean) => {
    const cleanEmail = email.toLowerCase().trim()
    const isAdminUser = cleanEmail === ADMIN_EMAIL

    let name = ''
    let credits = 10
    let tier: 'free' | 'pro' = 'free'
    let tutorialCompleted = false

    if (isAdminUser) {
      // Check admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('name')
        .eq('email', cleanEmail)
        .single()

      name = adminData?.name || 'Admin'
      tutorialCompleted = true // Admin skips tutorial

      // Also check waitlist for credits
      const { data: wsData } = await supabase
        .from('waitlist_submissions')
        .select('name, credits, tier, tutorial_completed')
        .eq('email', cleanEmail)
        .single()

      if (wsData) {
        name = wsData.name || name
        credits = wsData.credits ?? 10
        tier = (wsData.tier as 'free' | 'pro') || 'free'
      }
    } else {
      const { data: wsData } = await supabase
        .from('waitlist_submissions')
        .select('name, credits, tier, tutorial_completed')
        .eq('email', cleanEmail)
        .single()

      name = wsData?.name || ''
      credits = wsData?.credits ?? 10
      tier = (wsData?.tier as 'free' | 'pro') || 'free'
      tutorialCompleted = wsData?.tutorial_completed ?? false
    }

    // Update last_login
    await supabase
      .from('waitlist_submissions')
      .update({ last_login: new Date().toISOString() })
      .eq('email', cleanEmail)

    const newSession: AuthSession = {
      email: cleanEmail,
      name,
      role: isAdminUser ? 'admin' : 'user',
      credits,
      tier,
      tutorialCompleted,
      sessionExpiry: Date.now() + TWO_DAYS_MS,
    }

    setSession(newSession)
    persistSession(newSession, rememberMe)
  }, [persistSession])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const isAdmin = useCallback(() => {
    return session?.role === 'admin'
  }, [session])

  const isAuthenticated = useCallback(() => {
    if (!session) return false
    if (session.sessionExpiry && Date.now() > session.sessionExpiry) {
      logout()
      return false
    }
    return true
  }, [session, logout])

  const refreshCredits = useCallback(async () => {
    if (!session) return

    const { data } = await supabase
      .from('waitlist_submissions')
      .select('credits')
      .eq('email', session.email)
      .single()

    if (data) {
      const updated = { ...session, credits: data.credits ?? 0 }
      setSession(updated)
      const stored = localStorage.getItem(SESSION_KEY)
      persistSession(updated, !!stored)
    }
  }, [session, persistSession])

  const updateSession = useCallback((updates: Partial<AuthSession>) => {
    if (!session) return
    const updated = { ...session, ...updates }
    setSession(updated)
    const stored = localStorage.getItem(SESSION_KEY)
    persistSession(updated, !!stored)
  }, [session, persistSession])

  const completeTutorial = useCallback(async () => {
    if (!session) return

    await supabase
      .from('waitlist_submissions')
      .update({ tutorial_completed: true })
      .eq('email', session.email)

    updateSession({ tutorialCompleted: true })
  }, [session, updateSession])

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        logout,
        isAdmin,
        isAuthenticated,
        refreshCredits,
        updateSession,
        completeTutorial,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

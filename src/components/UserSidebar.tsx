import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sun, Moon, LogOut, Home, Camera, Settings, LayoutGrid, Sparkles, Wand2, Clock } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/hooks/useSidebar'
import { supabase } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/dashboard', tutorialId: undefined },
  { label: 'Tools', icon: LayoutGrid, path: '/dashboard/tools', tutorialId: 'tools-nav' },
  { label: 'Face Swap', icon: Camera, path: '/dashboard/faceswap', tutorialId: undefined },
  { label: 'AI Generate', icon: Sparkles, path: '/dashboard/ai-generate', tutorialId: undefined },
  { label: 'Vibe Swap', icon: Wand2, path: '/dashboard/vibe-swap', tutorialId: undefined },
  { label: 'History', icon: Clock, path: '/dashboard/history', tutorialId: undefined },
  { label: 'Settings', icon: Settings, path: '/dashboard/settings', tutorialId: 'settings-nav' },
]


export function UserSidebar() {
  const { isExpanded, setExpanded, toggle } = useSidebar()
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [light, setLight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nanoni-theme') === 'light'
    }
    return false
  })

  const [historyCount, setHistoryCount] = useState<number | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', light)
    localStorage.setItem('nanoni-theme', light ? 'light' : 'dark')
  }, [light])

  useEffect(() => {
    if (session?.email) loadHistoryCount()
  }, [session?.email])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const loadHistoryCount = async () => {
    if (!session?.email) return
    try {
      const { count } = await supabase
        .from('generation_history')
        .select('*', { count: 'exact', head: true })
        .eq('email', session.email.toLowerCase().trim())
      if (count !== null) setHistoryCount(count)
    } catch { /* ignore */ }
  }

  const sidebarWidth = isMobile ? (isExpanded ? 240 : 0) : (isExpanded ? 240 : 56)

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {isMobile && isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-[45]" onClick={() => setExpanded(false)} />
      )}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF3D00] via-[#7A6FFF] to-transparent" />

        {/* Logo */}
        <div className="flex items-center h-[76px] px-3 shrink-0">
          <Link to="/dashboard" className="group flex items-center gap-2 min-w-0">
            <motion.img
              src="/logo.svg"
              alt="NANONI logo"
              animate={{ width: isExpanded ? 32 : 28, height: isExpanded ? 32 : 28 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(255,61,0,0.5)] flex-shrink-0"
            />
            {isExpanded && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm text-foreground whitespace-nowrap">
                NANONI Studio
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-1 px-2 pt-4 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, path, tutorialId }) => {
            const active = isActive(path)
            const isHistory = path === '/dashboard/history'
            return (
              <Link
                key={path}
                to={path}
                onClick={() => isMobile && setExpanded(false)}
                data-tutorial={tutorialId}
                className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-all duration-200 group relative
                  ${active
                    ? 'bg-orange/10 text-orange border border-orange/20'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange' : 'group-hover:text-orange/70'}`} />
                {isExpanded && <span className="text-[13px] font-medium whitespace-nowrap flex-1">{label}</span>}
                {isExpanded && isHistory && historyCount !== null && historyCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-soft-gray/60 flex-shrink-0">
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
                {!isExpanded && isHistory && historyCount !== null && historyCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange text-white text-[8px] font-black flex items-center justify-center">
                    {historyCount > 9 ? '9+' : historyCount}
                  </span>
                )}
                {active && !isExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-orange rounded-r" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom */}
        <div className="px-2 pb-3 space-y-2 border-t border-sidebar-border pt-3">
          {/* Credits pill */}
          {isExpanded && session && (
            <div className="px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-soft-gray/60">Credits</span>
                <span className="text-xs font-bold text-orange">{Math.min(session.credits, 9999)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-purple transition-all duration-500"
                  style={{ width: `${Math.min(100, (session.credits / 10) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-soft-gray/60 truncate">{session.name || session.email}</p>
            </div>
          )}

          {!isExpanded && session && (
            <div className="flex justify-center py-1">
              <span className="text-[10px] font-bold text-orange bg-orange/10 px-1.5 py-0.5 rounded-full border border-orange/20">
                {Math.min(session.credits, 9999)}
              </span>
            </div>
          )}

          <button
            onClick={() => setLight((v) => !v)}
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-purple hover:border-purple/50 transition-colors flex items-center justify-center gap-2"
          >
            {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isExpanded && <span className="text-[12px] font-medium">{light ? 'Dark' : 'Light'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-red-500 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {isExpanded && <span className="text-[12px] font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {!isMobile && (
        <motion.button
          type="button"
          onClick={toggle}
          initial={false}
          animate={{ left: isExpanded ? 224 : 40 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-1/2 -translate-y-1/2 z-[55] w-8 h-14 rounded-xl border border-purple/45 bg-purple/25 backdrop-blur flex items-center justify-center text-purple hover:text-white hover:border-purple hover:bg-purple/45 transition-colors"
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </motion.button>
      )}

    </>
  )
}

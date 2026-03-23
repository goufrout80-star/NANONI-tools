import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sun, Moon, LogOut, LayoutDashboard, Clock, Users, Layers, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/hooks/useSidebar'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Waitlist', icon: Clock, path: '/admin/waitlist' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Tools', icon: Layers, path: '/admin/tools' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export function AdminSidebar() {
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarWidth = isMobile ? (isExpanded ? 240 : 0) : (isExpanded ? 240 : 56)

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
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
        {/* Gradient top line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF3D00] via-[#7A6FFF] to-transparent" />

        {/* Logo area */}
        <div className="flex items-center h-[76px] px-3 shrink-0">
          <Link to="/admin" className="group flex items-center gap-2 min-w-0">
            <motion.img
              src="/logo.svg"
              alt="NANONI logo"
              animate={{ width: isExpanded ? 32 : 28, height: isExpanded ? 32 : 28 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(255,61,0,0.5)] flex-shrink-0"
            />
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 min-w-0"
              >
                <span className="font-bold text-sm text-foreground whitespace-nowrap">NANONI Studio</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange/20 text-orange border border-orange/30 whitespace-nowrap">
                  Admin
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-1 px-2 pt-4">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                onClick={() => isMobile && setExpanded(false)}
                className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-all duration-200 group relative
                  ${active
                    ? 'bg-orange/10 text-orange border border-orange/20'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange' : 'group-hover:text-orange/70'}`} />
                {isExpanded && (
                  <span className="text-[13px] font-medium whitespace-nowrap">{label}</span>
                )}
                {active && !isExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-orange rounded-r" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom section */}
        <div className="px-2 pb-3 space-y-2 border-t border-sidebar-border pt-3">
          {/* Admin email */}
          {isExpanded && session && (
            <div className="px-3 py-2">
              <p className="text-[11px] text-soft-gray/60 truncate">{session.email}</p>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setLight((v) => !v)}
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-purple hover:border-purple/50 transition-colors flex items-center justify-center gap-2"
          >
            {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isExpanded && <span className="text-[12px] font-medium">{light ? 'Dark' : 'Light'}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full h-10 rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80 hover:text-red-500 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {isExpanded && <span className="text-[12px] font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Toggle button (desktop) */}
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

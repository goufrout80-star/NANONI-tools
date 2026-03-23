import { UserSidebar } from './UserSidebar'
import { useSidebar } from '@/hooks/useSidebar'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface UserLayoutProps {
  children: React.ReactNode
  title: string
}

export function UserLayout({ children, title }: UserLayoutProps) {
  const { isExpanded, setExpanded } = useSidebar()
  const { session } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const marginLeft = isMobile ? 0 : (isExpanded ? 240 : 56)

  return (
    <div className="flex min-h-screen w-full bg-background">
      <UserSidebar />
      <div
        className="flex-1 transition-all duration-300 min-w-0"
        style={{
          marginLeft,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setExpanded(true)} className="p-1.5 text-soft-gray hover:text-foreground transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2" data-tutorial="credits">
              <span className="text-xs font-bold text-orange bg-orange/10 px-2.5 py-1 rounded-full border border-orange/20">
                {session?.credits ?? 0} credits
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange to-purple flex items-center justify-center text-white text-xs font-bold">
              {(session?.name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

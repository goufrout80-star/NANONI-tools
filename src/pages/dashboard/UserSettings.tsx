import { useState, useEffect } from 'react'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, CreditCard, Clock, LogOut, Loader2, ChevronRight } from 'lucide-react'

interface UsageEntry {
  id: string
  tool_name: string
  credits_used: number
  created_at: string
}

export default function UserSettings() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [loadingUsage, setLoadingUsage] = useState(true)

  useEffect(() => {
    if (!session?.email) return

    supabase
      .from('tool_usage')
      .select('*')
      .eq('email', session.email)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setUsage(data || [])
        setLoadingUsage(false)
      })
  }, [session?.email])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const comingSoon = () => {
    toast({ title: 'Coming Soon!', description: "We're working on this feature." })
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <UserLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-white/5 bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-orange" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Profile</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-soft-gray">Name</span>
              <span className="text-sm text-foreground font-medium">{session?.name || '—'}</span>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="rounded-xl border border-white/5 bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-4 h-4 text-purple" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Email</h3>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-soft-gray">Email address</span>
            <span className="text-sm text-foreground font-medium">{session?.email || '—'}</span>
          </div>
        </div>

        {/* Credits Section */}
        <div className="rounded-xl border border-white/5 bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Credits</h3>
          </div>

          <div className="flex items-center justify-between py-2 mb-4">
            <span className="text-sm text-soft-gray">Remaining</span>
            <span className="text-lg font-black text-orange">{session?.credits ?? 0}</span>
          </div>

          {/* Usage History */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-soft-gray" />
              <span className="text-xs font-semibold text-soft-gray uppercase tracking-wider">Usage History</span>
            </div>

            {loadingUsage ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-soft-gray" />
              </div>
            ) : usage.length === 0 ? (
              <p className="text-xs text-soft-gray/60 text-center py-4">No usage yet. Try Face Swap!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {usage.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange" />
                      <span className="text-sm text-foreground capitalize">{entry.tool_name.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-red-400 font-semibold">-{entry.credits_used}</span>
                      <span className="text-xs text-soft-gray/60">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Other Settings (Coming Soon) */}
        <div className="rounded-xl border border-white/5 bg-card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Other Settings</h3>
          {['Notifications', 'Language', 'Data Export'].map((item) => (
            <button
              key={item}
              onClick={comingSoon}
              className="w-full flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 text-sm text-soft-gray hover:text-foreground transition-colors group"
            >
              <span>{item}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-soft-gray/60 border border-white/5">Soon</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-5">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4">Danger Zone</h3>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </UserLayout>
  )
}

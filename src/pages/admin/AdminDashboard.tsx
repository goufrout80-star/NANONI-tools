import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Users, Clock, Zap, CreditCard, TrendingUp, Mail, Check, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Stats {
  totalApproved: number
  totalPending: number
  faceSwapToday: number
  totalCreditsUsed: number
  newThisWeek: number
}

interface WaitlistUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  approved: boolean
}

// ═══ Animated Counter ═══
function AnimatedCounter({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    ref.current = 0
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = Math.round(eased * end)
      setCount(current)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])

  return <>{count}</>
}

const statCards = [
  { key: 'totalApproved', label: 'Approved Users', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { key: 'totalPending', label: 'Pending Waitlist', icon: Clock, color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/20' },
  { key: 'faceSwapToday', label: 'Face Swap Today', icon: Zap, color: 'text-purple', bg: 'bg-purple/10', border: 'border-purple/20' },
  { key: 'totalCreditsUsed', label: 'Credits Used', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'newThisWeek', label: 'New This Week', icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
]

export default function AdminDashboard() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats>({ totalApproved: 0, totalPending: 0, faceSwapToday: 0, totalCreditsUsed: 0, newThisWeek: 0 })
  const [waitlist, setWaitlist] = useState<WaitlistUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    if (!session) return

    try {
      // Fetch stats
      const { data: statsData } = await supabase.functions.invoke('get-admin-stats', {
        body: { adminEmail: session.email },
      })
      if (statsData) setStats(statsData)

      // Fetch recent waitlist
      const { data: waitlistData } = await supabase
        .from('waitlist_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (waitlistData) setWaitlist(waitlistData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [session])

  const handleApprove = async (email: string) => {
    if (!session) return
    setActionLoading(email)
    try {
      const { error } = await supabase.functions.invoke('approve-user', {
        body: { email, adminEmail: session.email },
      })
      if (error) throw error
      toast({ title: 'User approved', description: `${email} has been approved and notified.` })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to approve user.', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (email: string) => {
    if (!session) return
    setActionLoading(email)
    try {
      const { error } = await supabase.functions.invoke('reject-user', {
        body: { email, adminEmail: session.email },
      })
      if (error) throw error
      toast({ title: 'User rejected', description: `${email} has been removed.` })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to reject user.', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon, color, bg, border }, idx) => (
          <div
            key={key}
            className={`relative overflow-hidden rounded-xl border ${border} ${bg} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
            style={{ animation: `fadeIn 0.5s ease-out ${idx * 80}ms forwards`, opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <TrendingUp className={`w-4 h-4 ${color} opacity-50`} />
            </div>
            <p className="text-3xl font-black text-foreground mb-1">
              {loading ? '—' : <AnimatedCounter end={stats[key as keyof Stats]} />}
            </p>
            <p className="text-xs text-soft-gray font-medium">{label}</p>
            {/* Glow effect */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${bg} blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
          </div>
        ))}
      </div>

      {/* Recent Waitlist Table */}
      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent Waitlist</h2>
          <span className="text-xs text-soft-gray">Auto-refreshes every 30s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-soft-gray uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Name</th>
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Role</th>
                <th className="text-left px-5 py-3 font-semibold">Applied</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-orange mx-auto" />
                  </td>
                </tr>
              ) : waitlist.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-soft-gray text-sm">
                    No waitlist entries yet.
                  </td>
                </tr>
              ) : (
                waitlist.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {user.approved ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Approved
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange/10 text-orange border border-orange/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {!user.approved && (
                          <>
                            <button
                              onClick={() => handleApprove(user.email)}
                              disabled={actionLoading === user.email}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {actionLoading === user.email ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(user.email)}
                              disabled={actionLoading === user.email}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AdminLayout>
  )
}

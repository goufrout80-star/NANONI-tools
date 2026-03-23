import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Search, Plus, ShieldOff, Mail, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApprovedUser {
  id: string
  name: string
  email: string
  role: string
  credits: number
  last_login: string | null
  approved_at: string
}

export default function AdminUsers() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [addCreditsModal, setAddCreditsModal] = useState<{ email: string; name: string } | null>(null)
  const [emailModal, setEmailModal] = useState<{ email: string; name: string } | null>(null)
  const [creditsToAdd, setCreditsToAdd] = useState(10)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const perPage = 10

  const fetchUsers = async () => {
    if (!session) return

    let query = supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact' })
      .eq('approved', true)
      .order('approved_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query.range(page * perPage, (page + 1) * perPage - 1)

    const { data, count } = await query
    setUsers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [session, search, page])

  const handleAddCredits = async () => {
    if (!addCreditsModal || !session) return
    setActionLoading(true)

    const { data: user } = await supabase
      .from('waitlist_submissions')
      .select('credits')
      .eq('email', addCreditsModal.email)
      .single()

    const newCredits = (user?.credits ?? 0) + creditsToAdd
    await supabase
      .from('waitlist_submissions')
      .update({ credits: newCredits })
      .eq('email', addCreditsModal.email)

    toast({ title: 'Credits added', description: `Added ${creditsToAdd} credits to ${addCreditsModal.name}.` })
    setAddCreditsModal(null)
    setCreditsToAdd(10)
    setActionLoading(false)
    fetchUsers()
  }

  const handleRevoke = async (email: string) => {
    if (!session) return
    setActionLoading(true)
    await supabase
      .from('waitlist_submissions')
      .update({ approved: false })
      .eq('email', email)

    toast({ title: 'Access revoked', description: `${email} access removed.` })
    setActionLoading(false)
    fetchUsers()
  }

  const handleSendEmail = async () => {
    if (!emailModal || !session || !emailSubject || !emailMessage) return
    setActionLoading(true)
    try {
      await supabase.functions.invoke('send-manual-email', {
        body: {
          adminEmail: session.email,
          toEmail: emailModal.email,
          subject: emailSubject,
          message: emailMessage,
        },
      })
      toast({ title: 'Email sent', description: `Email sent to ${emailModal.name}.` })
      setEmailModal(null)
      setEmailSubject('')
      setEmailMessage('')
    } catch {
      toast({ title: 'Error', description: 'Failed to send email.', variant: 'destructive' })
    }
    setActionLoading(false)
  }

  const totalPages = Math.ceil(total / perPage)
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <AdminLayout title="Users Management">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search approved users..."
            className="w-full bg-card border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-soft-gray/40 focus:border-orange/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-soft-gray uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Name</th>
                <th className="px-5 py-3 text-left font-semibold">Email</th>
                <th className="px-5 py-3 text-left font-semibold">Role</th>
                <th className="px-5 py-3 text-left font-semibold">Credits Left</th>
                <th className="px-5 py-3 text-left font-semibold">Last Login</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-soft-gray text-sm">No approved users yet.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 capitalize">{user.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${(user.credits ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {user.credits ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{formatDate(user.last_login)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setAddCreditsModal({ email: user.email, name: user.name })}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"
                          title="Add Credits"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRevoke(user.email)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                          title="Revoke Access"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEmailModal({ email: user.email, name: user.name })}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <span className="text-xs text-soft-gray">
              Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded-lg bg-card border border-white/5 text-soft-gray hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg bg-card border border-white/5 text-soft-gray hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Credits Modal */}
      {addCreditsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setAddCreditsModal(null)}>
          <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Add Credits</h3>
            <p className="text-sm text-soft-gray mb-4">Adding credits for <span className="text-foreground font-medium">{addCreditsModal.name}</span></p>
            <input
              type="number"
              min={1}
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
              className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-3 text-foreground text-lg font-bold text-center mb-4 focus:border-orange/50 focus:outline-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setAddCreditsModal(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-soft-gray hover:text-foreground transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleAddCredits} disabled={actionLoading || creditsToAdd <= 0} className="flex-1 py-2.5 rounded-lg bg-orange text-white font-semibold text-sm hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${creditsToAdd} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEmailModal(null)}>
          <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Send Email</h3>
            <p className="text-sm text-soft-gray mb-4">To: <span className="text-foreground">{emailModal.email}</span></p>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-3 text-foreground text-sm mb-3 focus:border-orange/50 focus:outline-none placeholder:text-soft-gray/40"
            />
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Message..."
              rows={5}
              className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-3 text-foreground text-sm mb-4 focus:border-orange/50 focus:outline-none placeholder:text-soft-gray/40 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setEmailModal(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-soft-gray hover:text-foreground transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleSendEmail} disabled={actionLoading || !emailSubject || !emailMessage} className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

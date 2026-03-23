import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Search, Check, X, Mail, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WaitlistUser {
  id: string
  name: string
  email: string
  role: string
  source: string
  created_at: string
  approved: boolean
  credits: number
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminWaitlist() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<WaitlistUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const perPage = 10

  const fetchUsers = async () => {
    if (!session) return

    let query = supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('approved', false)
    if (filter === 'approved') query = query.eq('approved', true)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query.range(page * perPage, (page + 1) * perPage - 1)

    const { data, count } = await query

    setUsers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [session, filter, search, page])

  const handleApprove = async (email: string) => {
    if (!session) return
    setActionLoading(email)
    try {
      await supabase.functions.invoke('approve-user', {
        body: { email, adminEmail: session.email },
      })
      toast({ title: 'Approved', description: `${email} approved and notified.` })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Failed to approve.', variant: 'destructive' })
    }
    setActionLoading(null)
  }

  const handleReject = async (email: string) => {
    if (!session) return
    setActionLoading(email)
    try {
      await supabase.functions.invoke('reject-user', {
        body: { email, adminEmail: session.email },
      })
      toast({ title: 'Rejected', description: `${email} removed.` })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' })
    }
    setActionLoading(null)
  }

  const handleBulkApprove = async () => {
    if (!session || selected.size === 0) return
    setActionLoading('bulk')
    for (const email of selected) {
      await supabase.functions.invoke('approve-user', {
        body: { email, adminEmail: session.email },
      })
    }
    toast({ title: 'Bulk approved', description: `${selected.size} users approved.` })
    setSelected(new Set())
    setActionLoading(null)
    fetchUsers()
  }

  const handleBulkReject = async () => {
    if (!session || selected.size === 0) return
    setActionLoading('bulk')
    for (const email of selected) {
      await supabase.functions.invoke('reject-user', {
        body: { email, adminEmail: session.email },
      })
    }
    toast({ title: 'Bulk rejected', description: `${selected.size} users removed.` })
    setSelected(new Set())
    setActionLoading(null)
    fetchUsers()
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Source', 'Applied', 'Status', 'Credits']
    const rows = users.map((u) => [
      u.name, u.email, u.role, u.source || '',
      new Date(u.created_at).toLocaleDateString(),
      u.approved ? 'Approved' : 'Pending',
      u.credits?.toString() || '0',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (email: string) => {
    const next = new Set(selected)
    if (next.has(email)) next.delete(email)
    else next.add(email)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(users.map((u) => u.email)))
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <AdminLayout title="Waitlist Management">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by name or email..."
            className="w-full bg-card border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-soft-gray/40 focus:border-orange/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0) }}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all border
                ${filter === f
                  ? 'bg-orange/10 text-orange border-orange/30'
                  : 'bg-card text-soft-gray border-white/5 hover:text-foreground hover:border-white/10'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-lg bg-card border border-white/5 text-soft-gray hover:text-foreground hover:border-white/10 transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-orange/5 border border-orange/20">
          <span className="text-sm text-orange font-semibold">{selected.size} selected</span>
          <button
            onClick={handleBulkApprove}
            disabled={actionLoading === 'bulk'}
            className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'bulk' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve All'}
          </button>
          <button
            onClick={handleBulkReject}
            disabled={actionLoading === 'bulk'}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            Reject All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-xs text-soft-gray uppercase tracking-wider">
                <th className="px-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === users.length && users.length > 0}
                    onChange={toggleAll}
                    className="rounded border-white/20 accent-orange"
                  />
                </th>
                <th className="px-5 py-3 text-left font-semibold">Name</th>
                <th className="px-5 py-3 text-left font-semibold">Email</th>
                <th className="px-5 py-3 text-left font-semibold">Role</th>
                <th className="px-5 py-3 text-left font-semibold">Source</th>
                <th className="px-5 py-3 text-left font-semibold">Applied</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Credits</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-orange mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-soft-gray text-sm">No entries found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(user.email)}
                        onChange={() => toggleSelect(user.email)}
                        className="rounded border-white/20 accent-orange"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple/10 text-purple border border-purple/20 capitalize">{user.role}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray capitalize">{user.source || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-soft-gray">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {user.approved ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Approved</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange/10 text-orange border border-orange/20">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground font-semibold">{user.credits ?? 0}</td>
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
                              {actionLoading === user.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
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
                        <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors" title="Send Email">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <span className="text-xs text-soft-gray">
              Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-card border border-white/5 text-soft-gray hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-card border border-white/5 text-soft-gray hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

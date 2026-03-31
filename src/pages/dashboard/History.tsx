import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Download, X, ExternalLink, Image as ImageIcon,
  Clock, ChevronRight, Camera, Sparkles, Wand2,
} from 'lucide-react'

type FilterType = 'all' | 'face_swap' | 'ai_generate' | 'vibe_swap'

interface HistoryItem {
  id: string
  email: string
  tool_name: string
  result_path: string | null
  cloudinary_url: string | null
  source_path: string | null
  target_path: string | null
  resolution: string | null
  model_tier: string | null
  status: string
  credits_used: number | null
  created_at: string
  resultUrl?: string
  sourceUrl?: string
  targetUrl?: string
}

const TOOL_META: Record<string, { label: string; color: string; textColor: string; icon: any }> = {
  face_swap: {
    label: 'Face Swap',
    color: 'bg-orange/10 border-orange/30',
    textColor: 'text-orange',
    icon: Camera,
  },
  ai_generate: {
    label: 'AI Generate',
    color: 'bg-purple/10 border-purple/30',
    textColor: 'text-purple',
    icon: Sparkles,
  },
  vibe_swap: {
    label: 'Vibe Swap',
    color: 'bg-teal-500/10 border-teal-500/30',
    textColor: 'text-teal-400',
    icon: Wand2,
  },
}

const MODEL_LABELS: Record<string, string> = {
  nnn1: 'NNN v1',
  nnn1_pro: 'NNN v1 Pro',
  nnn1_pro_max: 'NNN v1 Pro Max',
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'face_swap', label: 'Face Swap' },
  { id: 'ai_generate', label: 'AI Generate' },
  { id: 'vibe_swap', label: 'Vibe Swap' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  useEffect(() => {
    if (session?.email) fetchHistory()
  }, [session?.email])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('generation_history')
        .select('*')
        .eq('email', session!.email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[History] fetch error:', error)
        setItems([])
        setLoading(false)
        return
      }

      const rows = data || []
      // Resolve signed URLs for all items
      const resolved: HistoryItem[] = await Promise.all(
        rows.map(async (item) => {
          let resultUrl = item.cloudinary_url || ''
          let sourceUrl = ''
          let targetUrl = ''

          // result_path → signed URL (if not cloudinary)
          if (!resultUrl && item.result_path && item.status === 'completed') {
            const { data: u } = await supabase.storage
              .from('nanoni-assets')
              .createSignedUrl(item.result_path, 3600)
            resultUrl = u?.signedUrl || ''
          }

          // source signed URL
          if (item.source_path) {
            const { data: u } = await supabase.storage
              .from('nanoni-assets')
              .createSignedUrl(item.source_path, 3600)
            sourceUrl = u?.signedUrl || ''
          }

          // target signed URL
          if (item.target_path) {
            const { data: u } = await supabase.storage
              .from('nanoni-assets')
              .createSignedUrl(item.target_path, 3600)
            targetUrl = u?.signedUrl || ''
          }

          return { ...item, resultUrl, sourceUrl, targetUrl }
        })
      )

      setItems(resolved)
    } catch (err) {
      console.error('[History] exception:', err)
      setItems([])
    }
    setLoading(false)
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.tool_name === filter)

  const downloadImage = async (url: string, toolName: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `nanoni-${toolName}-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // ── SKELETON ──
  if (loading) {
    return (
      <UserLayout title="Generation History">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-1">Generation History</h2>
            <p className="text-sm text-soft-gray">All your generated images</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.04] animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded bg-white/5 w-2/3" />
                  <div className="h-2.5 rounded bg-white/5 w-1/2" />
                  <div className="h-2.5 rounded bg-white/5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </UserLayout>
    )
  }

  // ── EMPTY STATE ──
  if (items.length === 0) {
    return (
      <UserLayout title="Generation History">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-1">Generation History</h2>
            <p className="text-sm text-soft-gray">All your generated images</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="32" height="24" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
                <circle cx="13" cy="18" r="3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
                <path d="M4 26l8-6 6 5 5-4 13 10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground mb-1">No generations yet</p>
              <p className="text-sm text-soft-gray/60">Start creating with Face Swap, AI Generate, or Vibe Swap</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange text-white font-bold text-sm hover:bg-orange/90 transition-colors"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout title="Generation History">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-foreground">Generation History</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-soft-gray border border-white/10">
                {items.length} total
              </span>
            </div>
            <p className="text-sm text-soft-gray">All your generated images, sorted by newest first</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? items.length : items.filter((i) => i.tool_name === f.id).length
            const meta = f.id !== 'all' ? TOOL_META[f.id] : null
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filter === f.id
                    ? meta
                      ? `${meta.color} ${meta.textColor}`
                      : 'bg-orange/10 border-orange/30 text-orange'
                    : 'bg-white/[0.03] border-white/10 text-soft-gray/60 hover:text-foreground hover:border-white/20'
                }`}
              >
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  filter === f.id ? 'bg-white/10' : 'bg-white/5'
                }`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-16 gap-3">
                <ImageIcon className="w-10 h-10 text-soft-gray/20" />
                <p className="text-sm text-soft-gray/40">No {filter.replace('_', ' ')} generations yet</p>
              </div>
            ) : (
              filtered.map((item) => {
                const meta = TOOL_META[item.tool_name] || TOOL_META.face_swap
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSelectedItem(item)}
                    className="rounded-2xl overflow-hidden cursor-pointer group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,61,0,0.4)'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(255,61,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden bg-white/[0.02]">
                      {item.resultUrl ? (
                        <img
                          src={item.resultUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'failed' ? 'bg-red-400' : 'bg-white/15 animate-pulse'
                          }`} />
                        </div>
                      )}
                      {/* Status dot overlay */}
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-black/30 ${
                        item.status === 'completed' ? 'bg-emerald-400' :
                        item.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                    </div>

                    {/* Bottom content */}
                    <div className="p-3 space-y-1.5">
                      {/* Row 1: badge + time */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${meta.color} ${meta.textColor}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-soft-gray/40">{timeAgo(item.created_at)}</span>
                      </div>

                      {/* Row 2: model · resolution */}
                      {(item.model_tier || item.resolution) && (
                        <p className="text-[10px] text-soft-gray/50">
                          {[
                            item.model_tier ? MODEL_LABELS[item.model_tier] || item.model_tier : null,
                            item.resolution,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {/* Row 3: credits */}
                      {item.credits_used != null && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-orange" />
                          <span className="text-[10px] font-bold text-orange">{item.credits_used} {item.credits_used === 1 ? 'credit' : 'credits'}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative w-full pointer-events-auto flex flex-col md:flex-row gap-0 overflow-hidden"
                style={{
                  maxWidth: 900,
                  background: '#111116',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  maxHeight: '90vh',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF3D00] via-[#7A6FFF] to-transparent z-10" />

                {/* Close button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* LEFT COLUMN — Image */}
                <div className="flex-[6] p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-white/8 overflow-y-auto">
                  <p className="text-xs font-bold text-soft-gray/50 uppercase tracking-widest">Result</p>

                  {selectedItem.resultUrl ? (
                    <>
                      <div
                        className="rounded-xl overflow-hidden border border-white/10 cursor-pointer group relative"
                        onClick={() => window.open(selectedItem.resultUrl!, '_blank')}
                      >
                        <img
                          src={selectedItem.resultUrl}
                          alt="Result"
                          className="w-full object-contain max-h-[420px]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-black/60">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => downloadImage(selectedItem.resultUrl!, selectedItem.tool_name)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{ background: 'linear-gradient(135deg,#FF3D00,#FF6B35)' }}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => window.open(selectedItem.resultUrl!, '_blank')}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-soft-gray border border-white/10 hover:border-white/25 hover:text-foreground transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Full Size
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                          selectedItem.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                        }`} />
                        <p className="text-xs text-soft-gray/50 capitalize">{selectedItem.status}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN — Info */}
                <div className="flex-[4] p-6 flex flex-col gap-5 overflow-y-auto">

                  {/* Generation Info */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-soft-gray/50 mb-3">Generation Info</p>
                    <div className="space-y-2.5">
                      {/* Tool */}
                      {(() => {
                        const meta = TOOL_META[selectedItem.tool_name] || TOOL_META.face_swap
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-soft-gray/50">Tool</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.color} ${meta.textColor}`}>
                              {meta.label}
                            </span>
                          </div>
                        )
                      })()}

                      {/* Model */}
                      {selectedItem.model_tier && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-soft-gray/50">Model</span>
                          <span className="text-[11px] font-semibold text-foreground">
                            {MODEL_LABELS[selectedItem.model_tier] || selectedItem.model_tier}
                          </span>
                        </div>
                      )}

                      {/* Resolution */}
                      {selectedItem.resolution && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-soft-gray/50">Resolution</span>
                          <span className="text-[11px] font-semibold text-foreground">{selectedItem.resolution}</span>
                        </div>
                      )}

                      {/* Credits */}
                      {selectedItem.credits_used != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-soft-gray/50">Credits used</span>
                          <span className="text-[11px] font-bold text-orange flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {selectedItem.credits_used} {selectedItem.credits_used === 1 ? 'credit' : 'credits'}
                          </span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-soft-gray/50">Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            selectedItem.status === 'completed' ? 'bg-emerald-400' :
                            selectedItem.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                          <span className={`text-[11px] font-semibold capitalize ${
                            selectedItem.status === 'completed' ? 'text-emerald-400' :
                            selectedItem.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                          }`}>{selectedItem.status}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-soft-gray/50">Date</span>
                        <span className="text-[11px] text-soft-gray/70">
                          {formatDate(selectedItem.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  {(selectedItem.sourceUrl || selectedItem.targetUrl) && (
                    <div className="h-px bg-white/6" />
                  )}

                  {/* Input Images */}
                  {(selectedItem.sourceUrl || selectedItem.targetUrl) && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[2px] text-soft-gray/50 mb-3">Input Images</p>
                      <div className="flex gap-3 flex-wrap">
                        {selectedItem.sourceUrl && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/[0.02]">
                              <img src={selectedItem.sourceUrl} alt="Source" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-soft-gray/40">Source</span>
                          </div>
                        )}
                        {selectedItem.targetUrl && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/[0.02]">
                              <img src={selectedItem.targetUrl} alt="Target" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-soft-gray/40">
                              {selectedItem.tool_name === 'ai_generate' ? 'Reference' : 'Target'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Divider + close button */}
                  <div className="mt-auto pt-4 border-t border-white/6">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-soft-gray/60 border border-white/8 hover:border-white/20 hover:text-foreground transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </UserLayout>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import {
  Upload, Download, X, AlertCircle, Zap, Sparkles, Plus,
  Square, RectangleHorizontal, RectangleVertical, Maximize2,
  ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon
} from 'lucide-react'

type Resolution = '1K' | '2K' | '4K'
type ModelTier = 'nnn1' | 'nnn1_pro' | 'nnn1_pro_max'

const RESOLUTIONS: { id: Resolution; label: string; est: string }[] = [
  { id: '1K', label: '1K', est: '~10s' },
  { id: '2K', label: '2K', est: '~20s' },
  { id: '4K', label: '4K', est: '~40s' },
]

const ASPECT_RATIOS = [
  { id: '', label: 'Auto' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' },
  { id: '3:2', label: '3:2' },
  { id: '2:3', label: '2:3' },
  { id: '21:9', label: '21:9' },
  { id: '9:21', label: '9:21' },
]

const STYLE_PRESETS = [
  'Cinematic', 'Anime', 'Realistic', 'Fantasy',
  'Cyberpunk', 'Vintage', 'Minimal', 'Abstract',
]

const CREDIT_COST: Record<string, Record<Resolution, number>> = {
  nnn1:        { '1K': 3,  '2K': 5,  '4K': 8  },
  nnn1_pro:    { '1K': 6,  '2K': 10, '4K': 16 },
  nnn1_pro_max:{ '1K': 12, '2K': 20, '4K': 32 },
}

const MAX_PROMPT_LENGTH = 1000
const MAX_REF_IMAGES = 5

export default function AIGenerate() {
  const { session, updateSession } = useAuth()
  const { toast } = useToast()

  const [prompt, setPrompt] = useState('')
  const [refImages, setRefImages] = useState<{ file: File; preview: string }[]>([])
  const refInputRef = useRef<HTMLInputElement>(null)

  const [resolution, setResolution] = useState<Resolution>('1K')
  const [aspectRatio, setAspectRatio] = useState('')
  const [modelTier, setModelTier] = useState<ModelTier>('nnn1')

  const [processing, setProcessing] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Fullscreen modal
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1.0)
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const creditCost = CREDIT_COST[modelTier]?.[resolution] ?? 3
  const notEnoughCredits = (session?.credits ?? 0) < creditCost
  const noCredits = notEnoughCredits
  const canGenerate = prompt.trim().length > 0 && !processing && !noCredits

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      refImages.forEach((r) => URL.revokeObjectURL(r.preview))
    }
  }, [])

  // Keyboard controls for fullscreen
  useEffect(() => {
    if (!fullscreenImage) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreen()
      else if (e.key === '+' || e.key === '=') setImageZoom((z) => Math.min(z + 0.25, 3.0))
      else if (e.key === '-') setImageZoom((z) => Math.max(z - 0.25, 0.5))
      else if (e.key === '0') { setImageZoom(1.0); setImagePan({ x: 0, y: 0 }) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fullscreenImage])

  const openFullscreen = (url: string) => {
    setFullscreenImage(url)
    setImageZoom(1.0)
    setImagePan({ x: 0, y: 0 })
  }

  const closeFullscreen = () => {
    setFullscreenImage(null)
    setImageZoom(1.0)
    setImagePan({ x: 0, y: 0 })
  }

  const handleAddRefImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image.', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB per image.', variant: 'destructive' })
      return
    }
    if (refImages.length >= MAX_REF_IMAGES) {
      toast({ title: 'Limit reached', description: `Max ${MAX_REF_IMAGES} reference images.`, variant: 'destructive' })
      return
    }
    const preview = URL.createObjectURL(file)
    setRefImages((prev) => [...prev, { file, preview }])
  }, [refImages, toast])

  const removeRefImage = (idx: number) => {
    setRefImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const addStylePreset = (preset: string) => {
    const keyword = preset.toLowerCase()
    if (prompt.toLowerCase().includes(keyword)) return
    setPrompt((prev) => prev ? `${prev}, ${keyword} style` : `${keyword} style`)
  }

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const downloadResult = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nanoni-aigenerate-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl, '_blank')
    }
  }

  const handleGenerate = async () => {
    if (!canGenerate || !session) return
    setProcessing(true)
    setResultImage(null)
    setErrorMsg('')

    try {
      const refBase64s: string[] = []
      for (const ref of refImages) {
        const b64 = await toBase64(ref.file)
        refBase64s.push(b64)
      }

      const { data, error: fnError } = await supabase.functions.invoke('ai-generate', {
        body: {
          email: session.email,
          prompt: prompt.trim(),
          referenceImages: refBase64s,
          resolution,
          aspectRatio: aspectRatio || undefined,
          modelTier,
        },
      })

      if (fnError || !data?.success) {
        setErrorMsg(data?.error || 'Generation failed. Please try again.')
        if (data?.creditsLeft !== undefined) updateSession({ credits: data.creditsLeft })
      } else {
        const img = data.images?.[0]
        if (img) {
          setResultImage(`data:image/png;base64,${img}`)
          if (data.creditsLeft !== undefined) updateSession({ credits: data.creditsLeft })
          toast({ title: 'Image generated!' })
        } else {
          setErrorMsg('No image generated. Try a different prompt.')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <UserLayout title="AI Generate">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-foreground">AI Generate</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Text to Image
              </span>
            </div>
            <p className="text-sm text-soft-gray">Describe any image and let AI bring it to life.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-orange" />
            <span className="text-soft-gray">{creditCost} {creditCost === 1 ? 'credit' : 'credits'} per generation</span>
            <span className={`font-bold ${(session?.credits ?? 0) < creditCost ? 'text-orange' : 'text-foreground'}`}>
              · {session?.credits ?? 0} remaining
            </span>
          </div>
        </div>

        {/* No Credits Warning */}
        {noCredits && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Not enough credits</p>
              <p className="text-xs text-soft-gray mt-1">
                Contact <a href="mailto:hello@nanoni.studio" className="text-orange hover:underline">hello@nanoni.studio</a> for more credits.
              </p>
            </div>
          </div>
        )}

        {/* ═══ MAIN 3-COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_30%_35%] gap-5">

          {/* ═══ LEFT COLUMN — Prompt + References ═══ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Prompt</h3>
            </div>

            {/* Prompt Textarea */}
            <div className="rounded-xl border border-white/8 bg-card p-1">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                  rows={8}
                  placeholder={"Describe the image you want to create...\n\ne.g. A cyberpunk street at night with neon signs, cinematic lighting, ultra realistic"}
                  className="w-full rounded-lg px-4 pt-4 pb-8 text-sm text-foreground placeholder-soft-gray/40 outline-none resize-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    fontFamily: 'Inter',
                    fontSize: 14,
                    minHeight: 160,
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid #FF3D00'; e.target.style.boxShadow = '0 0 0 3px rgba(255,61,0,0.08)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-soft-gray/40">
                  {prompt.length} / {MAX_PROMPT_LENGTH}
                </span>
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <p className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold mb-2">Style Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => addStylePreset(preset)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/10 bg-white/5 text-soft-gray hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Images */}
            <div className="rounded-xl border border-white/8 bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold">Reference Images</p>
                <span className="text-[10px] text-soft-gray/50">{refImages.length}/{MAX_REF_IMAGES}</span>
              </div>
              <p className="text-[11px] text-soft-gray/50 mb-3">Add up to 5 images to guide the AI style</p>
              <div className="flex flex-wrap gap-2">
                {refImages.map((ref, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group"
                  >
                    <img src={ref.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeRefImage(idx)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </motion.div>
                ))}
                {refImages.length < MAX_REF_IMAGES && (
                  <button
                    onClick={() => refInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-emerald-500/30 flex items-center justify-center text-soft-gray/40 hover:text-emerald-400 transition-all bg-white/[0.02]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <input
                ref={refInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(handleAddRefImage)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{errorMsg}</p>
              </motion.div>
            )}
          </div>

          {/* ═══ CENTER COLUMN — Controls ═══ */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Generate
              </span>
            </div>

            {/* Model Tier */}
            <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Model Tier</label>
              <div className="grid grid-cols-2 gap-2">
                {/* NNN v1 */}
                <button
                  onClick={() => setModelTier('nnn1')}
                  className={`relative p-3 rounded-lg border transition-all ${
                    modelTier === 'nnn1'
                      ? 'bg-orange/10 border-orange shadow-lg shadow-orange/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-xs font-bold mb-0.5 ${modelTier === 'nnn1' ? 'text-orange' : 'text-foreground'}`}>NNN v1</p>
                    <p className="text-[9px] text-soft-gray/60 mb-2">Fast & efficient</p>
                    <div className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-soft-gray">
                      {CREDIT_COST.nnn1[resolution]} cr
                    </div>
                  </div>
                </button>

                {/* NNN v1 Pro */}
                <button
                  onClick={() => setModelTier('nnn1_pro')}
                  className={`relative p-3 rounded-lg border transition-all ${
                    modelTier === 'nnn1_pro'
                      ? 'bg-purple/10 border-purple shadow-lg shadow-purple/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-xs font-bold mb-0.5 ${modelTier === 'nnn1_pro' ? 'text-purple' : 'text-foreground'}`}>NNN v1 Pro</p>
                    <p className="text-[9px] text-soft-gray/60 mb-2">Higher quality</p>
                    <div className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-soft-gray">
                      {CREDIT_COST.nnn1_pro[resolution]} cr
                    </div>
                  </div>
                </button>

                {/* NNN v1 Pro Max */}
                <button
                  onClick={() => setModelTier('nnn1_pro_max')}
                  style={modelTier === 'nnn1_pro_max'
                    ? { background: 'rgba(122,111,255,0.15)', border: '2px solid #7A6FFF', boxShadow: '0 0 20px rgba(122,111,255,0.2)' }
                    : { background: 'rgba(122,111,255,0.08)', border: '1px solid rgba(122,111,255,0.25)' }
                  }
                  className="relative p-3 rounded-lg transition-all hover:shadow-[0_0_16px_rgba(122,111,255,0.2)] hover:border-[#7A6FFF]"
                >
                  <div className="absolute top-1 right-1">
                    <span style={{ background: 'linear-gradient(135deg,#7A6FFF,#9B8FFF)' }} className="px-2 py-0.5 rounded-full text-[7px] font-black text-white">PREMIUM</span>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold mb-0.5 ${modelTier === 'nnn1_pro_max' ? 'text-[#7A6FFF]' : 'text-white'}`}>NNN v1 Pro Max</p>
                    <p className="text-[9px] text-soft-gray/60 mb-2">Best results</p>
                    <div className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold text-[#7A6FFF]" style={{ background: 'rgba(122,111,255,0.15)', border: '1px solid rgba(122,111,255,0.3)' }}>
                      {CREDIT_COST.nnn1_pro_max[resolution]} cr
                    </div>
                  </div>
                </button>

                {/* NNN v1 Pro Ultra — Coming Soon */}
                <div
                  style={{ opacity: 0.45, cursor: 'not-allowed', background: 'rgba(122,111,255,0.05)', border: '1px solid rgba(122,111,255,0.15)' }}
                  className="relative p-3 rounded-lg"
                >
                  <div className="absolute top-1 right-1">
                    <span style={{ background: 'rgba(122,111,255,0.25)', border: '1px solid rgba(122,111,255,0.4)' }} className="px-2 py-0.5 rounded-full text-[7px] font-black text-[#9B8FFF]">SOON</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold mb-0.5 text-[#7A6FFF]/60">NNN v1 Pro Ultra</p>
                    <p className="text-[9px] text-soft-gray/40 mb-2">Coming Soon</p>
                    <div className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold text-soft-gray/30" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      — cr
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution */}
            <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Resolution</label>
              <div className="flex gap-2">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setResolution(r.id)}
                    className={`flex-1 py-2 rounded-lg text-center transition-all ${
                      resolution === r.id
                        ? 'bg-orange text-white font-bold shadow-lg shadow-orange/20'
                        : 'bg-white/5 text-soft-gray hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{r.label}</span>
                    <p className="text-[9px] mt-0.5 opacity-60">{r.est}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Aspect Ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-orange text-white border-orange shadow-lg shadow-orange/20'
                        : 'bg-white/5 border-white/10 text-soft-gray hover:bg-white/10'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credits + Generate */}
            <div className="space-y-3 pt-1">
              <div
                style={{
                  background: notEnoughCredits ? 'rgba(239,68,68,0.08)' : 'rgba(255,61,0,0.08)',
                  border: `1px solid ${notEnoughCredits ? 'rgba(239,68,68,0.25)' : 'rgba(255,61,0,0.2)'}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-soft-gray">This generation will cost:</span>
                  <span className="text-xs font-black" style={{ color: notEnoughCredits ? '#ef4444' : '#FF3D00' }}>
                    ⚡ {creditCost} credits
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px]" style={{ color: notEnoughCredits ? '#ef4444' : 'rgba(255,61,0,0.7)' }}>
                    {resolution} · {modelTier === 'nnn1' ? 'NNN v1' : modelTier === 'nnn1_pro' ? 'NNN v1 Pro' : 'NNN v1 Pro Max'}
                  </span>
                  <span className={`text-[10px] font-bold ${notEnoughCredits ? 'text-red-400' : 'text-soft-gray'}`}>
                    {notEnoughCredits ? 'Not enough credits' : `${session?.credits ?? 0} remaining`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                  canGenerate
                    ? 'bg-orange text-white hover:bg-orange/90 shadow-lg shadow-orange/20 hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-white/5 text-soft-gray/40 cursor-not-allowed'
                }`}
              >
                {processing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                    <span className="text-xs font-normal opacity-70">— {creditCost} {creditCost === 1 ? 'credit' : 'credits'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — Result ═══ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Result</h3>
            </div>

            {/* Result area */}
            <AnimatePresence mode="wait">
              {processing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-white/8 bg-card aspect-square flex flex-col items-center justify-center gap-4"
                >
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Generating...</p>
                    <p className="text-xs text-soft-gray/50 mt-1">This may take 10–40 seconds</p>
                  </div>
                </motion.div>
              ) : resultImage ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl group cursor-zoom-in"
                    onClick={() => openFullscreen(resultImage)}
                  >
                    <img src={resultImage} alt="Generated" className="w-full object-contain max-h-[400px]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-end p-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/60">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadResult(resultImage)}
                    className="w-full py-2.5 bg-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange/90 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border-2 border-dashed border-white/8 aspect-square flex flex-col items-center justify-center gap-3 bg-card/30"
                >
                  <div className="p-4 rounded-2xl bg-emerald-500/10">
                    <ImageIcon className="w-8 h-8 text-emerald-400/50" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-soft-gray/50">Your image will appear here</p>
                    <p className="text-[11px] text-soft-gray/30 mt-1">Enter a prompt and click Generate</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══ FULLSCREEN MODAL ═══ */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ background: 'rgba(0,0,0,0.95)' }}
            onClick={closeFullscreen}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-semibold text-white">Generated Image</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setImageZoom((z) => Math.max(z - 0.25, 0.5))} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setImageZoom((z) => Math.min(z + 0.25, 3.0))} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => { setImageZoom(1.0); setImagePan({ x: 0, y: 0 }) }} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); downloadResult(fullscreenImage) }} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-orange/15 hover:border-orange/30 transition-colors"><Download className="w-4 h-4" /></button>
                <button onClick={closeFullscreen} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Image */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                if (imageZoom > 1.0) {
                  setIsDragging(true)
                  setDragStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y })
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && imageZoom > 1.0) {
                  setImagePan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              style={{ cursor: imageZoom > 1.0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <motion.img
                src={fullscreenImage}
                alt="Fullscreen"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  transform: `scale(${imageZoom}) translate(${imagePan.x / imageZoom}px, ${imagePan.y / imageZoom}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            </div>

            {/* Zoom indicator */}
            <div
              className="absolute bottom-4 left-5 text-xs text-white/50 bg-black/40 px-2 py-1 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {Math.round(imageZoom * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </UserLayout>
  )
}

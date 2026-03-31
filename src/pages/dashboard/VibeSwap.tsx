import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import {
  Upload, Download, X, AlertCircle, Zap, Sparkles, Trash2,
  Square, RectangleHorizontal, RectangleVertical, Maximize2,
  ZoomIn, ZoomOut, RotateCcw, Info, Image as ImageIcon
} from 'lucide-react'
import GenerationAnimation from '@/components/GenerationAnimation'

type Resolution = '1K' | '2K' | '4K'
type ModelTier = 'nnn1' | 'nnn1_pro' | 'nnn1_pro_max'
type TemplateTab = 'gallery' | 'upload'

interface VibeTemplate {
  id: string
  name: string
  url: string
  storage_path?: string
  created_at: string
}

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
]

const CREDIT_COST: Record<string, Record<Resolution, number>> = {
  nnn1:        { '1K': 3,  '2K': 5,  '4K': 8  },
  nnn1_pro:    { '1K': 6,  '2K': 10, '4K': 16 },
  nnn1_pro_max:{ '1K': 12, '2K': 20, '4K': 32 },
}

export default function VibeSwap() {
  const { session, updateSession } = useAuth()
  const { toast } = useToast()

  // User photo
  const [userFile, setUserFile] = useState<File | null>(null)
  const [userPreview, setUserPreview] = useState<string | null>(null)
  const [detectedRatio, setDetectedRatio] = useState<string | null>(null)
  const userRef = useRef<HTMLInputElement>(null)

  // Template state
  const [templateTab, setTemplateTab] = useState<TemplateTab>('gallery')
  const [templates, setTemplates] = useState<VibeTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<VibeTemplate | null>(null)
  const [templateUploadRef] = useState(() => ({ current: null as HTMLInputElement | null }))

  // Controls
  const [resolution, setResolution] = useState<Resolution>('1K')
  const [aspectRatio, setAspectRatio] = useState('') // '' = auto from photo
  const [overrideAspect, setOverrideAspect] = useState(false)
  const [modelTier, setModelTier] = useState<ModelTier>('nnn1')

  // Processing
  const [processing, setProcessing] = useState(false)
  const [animComplete, setAnimComplete] = useState(false)
  const [animError, setAnimError] = useState(false)
  const [animRefunded, setAnimRefunded] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)

  // Fullscreen
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1.0)
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const creditCost = CREDIT_COST[modelTier]?.[resolution] ?? 3
  const notEnoughCredits = (session?.credits ?? 0) < creditCost
  const noCredits = notEnoughCredits
  const canGenerate = !!userPreview && !!selectedTemplate && !processing && !noCredits

  useEffect(() => {
    if (session?.email) loadTemplates()
  }, [session?.email])

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

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data, error } = await supabase.functions.invoke('manage-vibe-templates', {
        body: { action: 'list', email: session!.email },
      })
      console.log('[VibeSwap] loadTemplates response:', { data, error })
      if (error) {
        console.error('[VibeSwap] loadTemplates error:', error)
      } else if (data?.templates) {
        setTemplates(data.templates)
      } else {
        console.warn('[VibeSwap] loadTemplates: no templates field in response', data)
        setTemplates([])
      }
    } catch (err) {
      console.error('[VibeSwap] loadTemplates exception:', err)
    }
    setLoadingTemplates(false)
  }

  const detectImageRatio = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const ratio = img.width / img.height
        URL.revokeObjectURL(url)
        if (ratio > 1.7) resolve('16:9')
        else if (ratio > 1.4) resolve('4:3')
        else if (ratio > 1.1) resolve('3:2')
        else if (ratio > 0.95) resolve('1:1')
        else if (ratio > 0.7) resolve('4:5')
        else if (ratio > 0.6) resolve('3:4')
        else if (ratio > 0.5) resolve('2:3')
        else resolve('9:16')
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve('1:1') }
      img.src = url
    })
  }

  const handleImageSet = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max file size is 10MB.', variant: 'destructive' })
      return
    }
    if (userPreview) URL.revokeObjectURL(userPreview)
    const url = URL.createObjectURL(file)
    setUserFile(file)
    setUserPreview(url)
    resetResult()

    const ratio = await detectImageRatio(file)
    setDetectedRatio(ratio)
  }, [userPreview, toast])

  const clearImage = () => {
    setUserFile(null)
    if (userPreview) URL.revokeObjectURL(userPreview)
    setUserPreview(null)
    setDetectedRatio(null)
    resetResult()
  }

  const resetResult = () => {
    setResultImage(null)
    setAnimComplete(false)
    setAnimError(false)
    setAnimRefunded(false)
    setErrorMessage('')
  }

  const handleUploadTemplate = async (file: File) => {
    if (templates.length >= 10) {
      toast({ title: 'Limit reached', description: 'Max 10 vibe templates. Delete one first.', variant: 'destructive' })
      return
    }
    console.log('[VibeSwap] Starting template upload:', file.name, file.type, file.size)
    try {
      const reader = new FileReader()
      const b64: string = await new Promise((res, rej) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          console.log('[VibeSwap] Base64 ready, length:', base64.length)
          res(base64)
        }
        reader.onerror = (e) => {
          console.error('[VibeSwap] FileReader error:', e)
          rej(e)
        }
        reader.readAsDataURL(file)
      })

      console.log('[VibeSwap] Calling manage-vibe-templates upload...')
      const { data, error } = await supabase.functions.invoke('manage-vibe-templates', {
        body: {
          action: 'upload',
          email: session!.email,
          imageBase64: b64,
          imageMime: file.type,
          imageName: file.name,
        },
      })
      console.log('[VibeSwap] Upload response:', { data, error })

      if (error) {
        console.error('[VibeSwap] Upload invoke error:', error)
        toast({ title: 'Upload failed', description: error.message || 'Unknown error', variant: 'destructive' })
        return
      }

      if (data?.error) {
        console.error('[VibeSwap] Upload function error:', data.error, data.details)
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
        return
      }

      if (data?.template) {
        console.log('[VibeSwap] Upload success, refreshing gallery...')
        toast({ title: 'Vibe template saved!' })
        setTemplateTab('gallery')
        // Full refresh to ensure signed URL is fresh
        await loadTemplates()
      } else {
        console.warn('[VibeSwap] Upload response missing template field:', data)
        toast({ title: 'Upload may have failed', description: 'Refreshing gallery...', variant: 'destructive' })
        await loadTemplates()
      }
    } catch (err: any) {
      console.error('[VibeSwap] Upload exception:', err)
      toast({ title: 'Upload failed', description: err?.message || 'Something went wrong', variant: 'destructive' })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await supabase.functions.invoke('manage-vibe-templates', {
        body: { action: 'delete', email: session!.email, templateId: id },
      })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedTemplate?.id === id) setSelectedTemplate(null)
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleGenerate = async () => {
    if (!canGenerate || !session || !userFile || !selectedTemplate) return

    setProcessing(true)
    setAnimComplete(false)
    setAnimError(false)
    setAnimRefunded(false)
    setErrorMessage('')
    setResultImage(null)

    try {
      const userB64 = await toBase64(userFile)

      const { data, error: fnError } = await supabase.functions.invoke('vibe-swap', {
        body: {
          email: session.email,
          userPhotoBase64: userB64,
          userMime: userFile.type,
          templateUrl: selectedTemplate.url,
          resolution,
          modelTier,
          aspectRatio: overrideAspect ? (aspectRatio || undefined) : 'auto',
        },
      })

      if (fnError || !data?.success) {
        setAnimError(true)
        setAnimRefunded(!!data?.refunded)
        setErrorMessage(data?.error || 'Vibe swap failed. Please try again.')
        if (data?.creditsLeft !== undefined) updateSession({ credits: data.creditsLeft })
      } else {
        const img = data.images?.[0]
        if (img) {
          setResultImage(`data:image/png;base64,${img}`)
          setAnimComplete(true)
          if (data.creditsLeft !== undefined) updateSession({ credits: data.creditsLeft })
        } else {
          setAnimError(true)
          setAnimRefunded(!!data?.refunded)
          setErrorMessage('No image generated.')
        }
      }
    } catch (err: any) {
      setAnimError(true)
      setErrorMessage(err.message || 'Something went wrong.')
    } finally {
      setProcessing(false)
    }
  }

  const downloadResult = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nanoni-vibeswap-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl, '_blank')
    }
  }

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

  return (
    <UserLayout title="Vibe Swap">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-foreground">Vibe Swap</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Style Transfer
              </span>
            </div>
            <p className="text-sm text-soft-gray">Transfer any era, theme or aesthetic onto your photo — identity preserved.</p>
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
        <div className="relative grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-5">

          {/* Generation overlay */}
          <GenerationAnimation
            isProcessing={processing}
            isComplete={animComplete}
            isError={animError}
            errorMessage={errorMessage}
            isRefunded={animRefunded}
            resultImage={resultImage}
            sourcePreview={userPreview}
            targetPreview={selectedTemplate?.url}
            onDownload={() => resultImage && downloadResult(resultImage)}
            onRetry={resetResult}
            onClose={resetResult}
            onFullscreen={openFullscreen}
          />

          {/* ═══ LEFT COLUMN — User Photo ═══ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Photo</h3>
            </div>

            <div className="relative w-full">
              {userPreview ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl overflow-hidden border border-white/10 bg-card group"
                >
                  <img src={userPreview} alt="Your photo" className="w-full aspect-[4/5] object-cover" />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* Detected ratio pill */}
                  {detectedRatio && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-purple border border-purple/30" style={{ background: 'rgba(122,111,255,0.15)' }}>
                        Detected: {detectedRatio}
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div
                  onClick={() => userRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleImageSet(file)
                  }}
                  className="rounded-xl border-2 border-dashed border-white/10 hover:border-teal-500/30 aspect-[4/5] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-card/30 hover:bg-teal-500/5 group"
                >
                  <div className="p-4 rounded-2xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                    <Upload className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-foreground">Drop your photo here</p>
                    <p className="text-[11px] text-soft-gray mt-1">or click to browse</p>
                  </div>
                  <p className="text-[9px] text-soft-gray/30">JPG, PNG, WebP · Max 10MB</p>
                </div>
              )}
              <input
                ref={userRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageSet(file)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Aspect ratio info */}
            <div className="rounded-xl border border-white/5 bg-card/50 p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-soft-gray/60 leading-relaxed">
                Aspect ratio is automatically detected from your uploaded photo and preserved in the output.
              </p>
            </div>
          </div>

          {/* ═══ CENTER COLUMN — Controls ═══ */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Vibe Swap
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold">Aspect Ratio</label>
                <button
                  onClick={() => setOverrideAspect((v) => !v)}
                  className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                    overrideAspect
                      ? 'border-orange/30 bg-orange/10 text-orange'
                      : 'border-white/10 bg-white/5 text-soft-gray/50 hover:text-soft-gray'
                  }`}
                >
                  {overrideAspect ? 'Override ON' : 'Override OFF'}
                </button>
              </div>
              {!overrideAspect ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)' }}>
                  <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <p className="text-[11px] text-teal-400/80">
                    Auto{detectedRatio ? ` — detected ${detectedRatio} from your photo` : ' (detected from photo)'}
                  </p>
                </div>
              ) : (
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
              )}
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
                <Sparkles className="w-5 h-5" />
                Generate Vibe Swap
                <span className="text-xs font-normal opacity-70">— {creditCost} {creditCost === 1 ? 'credit' : 'credits'}</span>
              </button>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — Vibe Templates ═══ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Vibe Style</h3>
            </div>
            <p className="text-[11px] text-soft-gray/50">Choose the era or style to apply to your photo</p>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-card border border-white/5">
              {(['gallery', 'upload'] as TemplateTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTemplateTab(tab)}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all capitalize ${
                    templateTab === tab
                      ? 'bg-orange text-white shadow-sm'
                      : 'text-soft-gray/60 hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Gallery */}
            {templateTab === 'gallery' && (
              <div className="space-y-2">
                {loadingTemplates ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-card/50 p-8 text-center">
                    <ImageIcon className="w-8 h-8 text-soft-gray/20 mx-auto mb-2" />
                    <p className="text-sm text-soft-gray/40">No vibe templates yet</p>
                    <p className="text-[11px] text-soft-gray/30 mt-1">Upload a style reference in the Upload tab</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedTemplate?.id === t.id
                            ? 'border-orange shadow-lg shadow-orange/20'
                            : 'border-transparent hover:border-white/20'
                        }`}
                        onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                      >
                        <img src={t.url} alt={t.name} className="w-full aspect-square object-cover" />
                        {selectedTemplate?.id === t.id && (
                          <div className="absolute inset-0 bg-orange/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-orange flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id) }}
                          className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-soft-gray/30 text-right">{templates.length}/10 slots used</p>
              </div>
            )}

            {/* Upload */}
            {templateTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/jpeg,image/png,image/webp'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleUploadTemplate(file)
                    }
                    input.click()
                  }}
                  className="rounded-xl border-2 border-dashed border-white/10 hover:border-orange/30 aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-card/30 hover:bg-orange/5 group"
                >
                  <div className="p-3 rounded-2xl bg-orange/10 group-hover:bg-orange/20 transition-colors">
                    <Upload className="w-5 h-5 text-orange" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-foreground">Upload Vibe Template</p>
                    <p className="text-[11px] text-soft-gray mt-1">A style/era/theme reference image</p>
                  </div>
                  <p className="text-[9px] text-soft-gray/30">JPG, PNG, WebP · Max 10MB</p>
                </div>
                <p className="text-[10px] text-soft-gray/40 text-center">
                  {templates.length}/10 slots used · {10 - templates.length} remaining
                </p>
              </div>
            )}
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
            <div
              className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-semibold text-white">Generation Result</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setImageZoom((z) => Math.max(z - 0.25, 0.5))} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setImageZoom((z) => Math.min(z + 0.25, 3.0))} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => { setImageZoom(1.0); setImagePan({ x: 0, y: 0 }) }} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); downloadResult(fullscreenImage) }} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-orange/15 hover:border-orange/30 transition-colors"><Download className="w-4 h-4" /></button>
                <button onClick={closeFullscreen} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div
              className="flex-1 flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => { if (imageZoom > 1.0) { setIsDragging(true); setDragStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y }) } }}
              onMouseMove={(e) => { if (isDragging && imageZoom > 1.0) setImagePan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }) }}
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
            <div className="absolute bottom-4 left-5 text-xs text-white/50 bg-black/40 px-2 py-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
              {Math.round(imageZoom * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </UserLayout>
  )
}

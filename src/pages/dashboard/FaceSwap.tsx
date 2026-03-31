import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import GenerationAnimation from '@/components/GenerationAnimation'
import FaceSwapTutorial from '@/components/FaceSwapTutorial'
import {
  Upload, Download, X, AlertCircle, Zap, Sparkles, Plus,
  Trash2, Clock, Image as ImageIcon, ChevronDown, Settings2,
  Square, RectangleHorizontal, RectangleVertical, Maximize2
} from 'lucide-react'

type SwapMode = 'default' | 'face_only' | 'head_swap' | 'exact_face' | 'face_hair'
type Resolution = '1K' | '2K' | '4K'
type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | 'original'
type TargetTab = 'templates' | 'upload'

interface UserTemplate {
  id: string
  name: string
  storage_path: string
  url: string | null
  created_at: string
}

interface HistoryItem {
  id: string
  tool_name: string
  result_path: string
  resolution: string
  status: string
  error_message: string | null
  created_at: string
  resultUrl?: string
}

const SWAP_MODES: { id: SwapMode; label: string; desc: string }[] = [
  { id: 'default', label: 'Default', desc: 'Full face swap with natural blending' },
  { id: 'face_only', label: 'Face Only', desc: 'Swap only the face, keep everything else' },
  { id: 'head_swap', label: 'Head Swap', desc: 'Replace the entire head region' },
  { id: 'exact_face', label: 'Exact Face', desc: 'Precise facial feature transfer' },
  { id: 'face_hair', label: 'Face + Hair', desc: 'Swap face and hairstyle together' },
]

const RESOLUTIONS: { id: Resolution; label: string; est: string }[] = [
  { id: '1K', label: '1K', est: '~10s' },
  { id: '2K', label: '2K', est: '~20s' },
  { id: '4K', label: '4K', est: '~40s' },
]

const ASPECT_RATIOS: { id: AspectRatio; label: string; icon: any }[] = [
  { id: '1:1', label: '1:1', icon: Square },
  { id: '4:3', label: '4:3', icon: RectangleHorizontal },
  { id: '16:9', label: '16:9', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16', icon: RectangleVertical },
  { id: 'original', label: 'Auto', icon: Maximize2 },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function FaceSwap() {
  const { session, updateSession } = useAuth()
  const { toast } = useToast()

  // Source (left column)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
  const sourceRef = useRef<HTMLInputElement>(null)

  // Target (right column)
  const [targetTab, setTargetTab] = useState<TargetTab>('templates')
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [targetPreview, setTargetPreview] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null)
  const [saveToTemplates, setSaveToTemplates] = useState(false)
  const targetRef = useRef<HTMLInputElement>(null)
  const templateUploadRef = useRef<HTMLInputElement>(null)

  // Templates
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  // Controls (center)
  const [resolution, setResolution] = useState<Resolution>('1K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original')
  const [swapMode, setSwapMode] = useState<SwapMode>('default')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showModeDropdown, setShowModeDropdown] = useState(false)

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [animComplete, setAnimComplete] = useState(false)
  const [animError, setAnimError] = useState(false)
  const [animRefunded, setAnimRefunded] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)

  // History
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyModalItem, setHistoryModalItem] = useState<HistoryItem | null>(null)

  const noCredits = (session?.credits ?? 0) <= 0
  const hasSource = !!sourcePreview
  const hasTarget = !!targetPreview || !!selectedTemplate
  const canGenerate = hasSource && hasTarget && !processing && !noCredits

  // Load templates and history on mount
  useEffect(() => {
    if (session?.email) {
      loadTemplates()
      loadHistory()
    }
  }, [session?.email])

  // Ctrl+V paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue
          if (!sourcePreview) handleImageSet(file, 'source')
          else if (!targetPreview && !selectedTemplate) handleImageSet(file, 'target')
          else toast({ title: 'Both slots full', description: 'Clear an image first.' })
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [sourcePreview, targetPreview, selectedTemplate])

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data } = await supabase.functions.invoke('manage-templates', {
        body: { action: 'list', email: session!.email },
      })
      if (data?.templates) setTemplates(data.templates)
    } catch { /* ignore */ }
    setLoadingTemplates(false)
  }

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('generation_history')
        .select('*')
        .eq('email', session!.email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        // Get signed URLs for results
        const items: HistoryItem[] = []
        for (const item of data) {
          let resultUrl = ''
          if (item.result_path && item.status === 'completed') {
            const { data: urlData } = await supabase.storage
              .from('nanoni-assets')
              .createSignedUrl(item.result_path, 3600)
            resultUrl = urlData?.signedUrl || ''
          }
          items.push({ ...item, resultUrl })
        }
        setHistory(items)
      }
    } catch { /* ignore */ }
  }

  const handleImageSet = useCallback((file: File, type: 'source' | 'target') => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max file size is 10MB.', variant: 'destructive' })
      return
    }
    const url = URL.createObjectURL(file)
    if (type === 'source') {
      setSourceFile(file)
      setSourcePreview(url)
    } else {
      setTargetFile(file)
      setTargetPreview(url)
      setSelectedTemplate(null)
    }
    resetResult()
  }, [toast])

  const clearImage = (type: 'source' | 'target') => {
    if (type === 'source') {
      setSourceFile(null)
      if (sourcePreview) URL.revokeObjectURL(sourcePreview)
      setSourcePreview(null)
    } else {
      setTargetFile(null)
      if (targetPreview) URL.revokeObjectURL(targetPreview)
      setTargetPreview(null)
      setSelectedTemplate(null)
    }
    resetResult()
  }

  const resetResult = () => {
    setResultImage(null)
    setAnimComplete(false)
    setAnimError(false)
    setAnimRefunded(false)
    setErrorMessage('')
  }

  const handleDrop = (e: React.DragEvent, type: 'source' | 'target') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageSet(file, type)
  }

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
      }
      reader.readAsDataURL(blob)
    })
  }

  // Upload template
  const handleUploadTemplate = async (file: File) => {
    if (templates.length >= 10) {
      toast({ title: 'Limit reached', description: 'Max 10 templates. Delete one first.', variant: 'destructive' })
      return
    }
    try {
      const b64 = await toBase64(file)
      const { data } = await supabase.functions.invoke('manage-templates', {
        body: {
          action: 'upload',
          email: session!.email,
          imageBase64: b64,
          imageMime: file.type,
          imageName: file.name,
        },
      })
      if (data?.template) {
        setTemplates((prev) => [data.template, ...prev])
        toast({ title: 'Template saved' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await supabase.functions.invoke('manage-templates', {
        body: { action: 'delete', email: session!.email, templateId: id },
      })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedTemplate?.id === id) setSelectedTemplate(null)
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  // ── GENERATE ──
  const handleGenerate = async () => {
    if (!sourceFile || !session || (!targetFile && !selectedTemplate)) return
    if (noCredits) return

    setProcessing(true)
    setAnimComplete(false)
    setAnimError(false)
    setAnimRefunded(false)
    setErrorMessage('')
    setResultImage(null)

    try {
      // Add logging for debugging
      console.log('Sending to face-swap:', {
        hasEmail: !!session.email,
        hasSource: !!sourceFile,
        hasTarget: !!targetFile,
        hasTemplate: !!selectedTemplate,
        resolution,
        swapMode,
        aspectRatio
      })

      const sourceB64 = await toBase64(sourceFile)
      let targetB64: string | undefined
      let targetPath: string | undefined

      if (targetFile) {
        targetB64 = await toBase64(targetFile)
      } else if (selectedTemplate) {
        // Convert template URL to base64 if needed
        if (selectedTemplate.url) {
          targetB64 = await urlToBase64(selectedTemplate.url)
        } else {
          targetPath = selectedTemplate.storage_path
        }
      }

      // Save uploaded target as template if checked
      if (saveToTemplates && targetFile && templates.length < 10) {
        handleUploadTemplate(targetFile)
      }

      const { data, error: fnError } = await supabase.functions.invoke('face-swap', {
        body: {
          email: session.email,
          sourceImageBase64: sourceB64,
          targetImageBase64: targetB64,
          targetTemplatePath: targetPath,
          targetCloudinaryUrl: selectedTemplate?.url || undefined,
          sourceMime: sourceFile.type,
          targetMime: targetFile?.type,
          resolution,
          aspectRatio: aspectRatio === 'original' ? undefined : aspectRatio,
          swapMode,
        },
      })

      if (fnError || !data?.success) {
        setAnimError(true)
        setAnimRefunded(!!data?.refunded)
        setErrorMessage(data?.error || 'Face swap failed. Please try again.')
        if (data?.creditsLeft !== undefined) {
          updateSession({ credits: data.creditsLeft })
        }
      } else {
        const img = data.images?.[0]
        if (img) {
          setResultImage(`data:image/png;base64,${img}`)
          setAnimComplete(true)
          if (data.creditsLeft !== undefined) {
            updateSession({ credits: data.creditsLeft })
          }
          // Refresh history
          loadHistory()
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

  const handleDownload = () => {
    if (!resultImage) return
    const a = document.createElement('a')
    a.href = resultImage
    a.download = `nanoni-faceswap-${Date.now()}.png`
    a.click()
  }

  const handleRetry = () => {
    resetResult()
  }

  const handleCloseAnimation = () => {
    resetResult()
  }

  // ── Upload Zone Component ──
  const UploadZone = ({
    type,
    label,
    preview,
    inputRef,
    showPaste = true,
  }: {
    type: 'source' | 'target'
    label: string
    preview: string | null
    inputRef: React.RefObject<HTMLInputElement | null>
    showPaste?: boolean
  }) => (
    <div className="relative w-full">
      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden border border-white/10 bg-card group"
        >
          <img src={preview} alt={label} className="w-full aspect-[4/5] object-cover" />
          <button
            onClick={() => clearImage(type)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, type)}
          className="rounded-xl border-2 border-dashed border-white/10 hover:border-orange/30 aspect-[4/5] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-card/30 hover:bg-orange/5 group"
        >
          <div className="p-4 rounded-2xl bg-orange/10 group-hover:bg-orange/20 transition-colors">
            <Upload className="w-6 h-6 text-orange" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-foreground">Drop your photo here</p>
            <p className="text-[11px] text-soft-gray mt-1">or click to browse</p>
          </div>
          {showPaste && (
            <p className="text-[10px] text-soft-gray/40">
              Paste with <span className="text-orange">Ctrl+V</span>
            </p>
          )}
          <p className="text-[9px] text-soft-gray/30">JPG, PNG, WebP · Max 10MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageSet(file, type)
          e.target.value = ''
        }}
      />
    </div>
  )

  return (
    <UserLayout title="Face Swap">
      <FaceSwapTutorial />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-foreground">Face Swap</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple/20 text-purple border border-purple/30">NNN v1</span>
            </div>
            <p className="text-sm text-soft-gray">Swap faces with AI — upload a source face and choose a target.</p>
          </div>
          <div data-tutorial="credits-indicator" className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-orange" />
            <span className="text-soft-gray">1 credit per generation</span>
            <span className={`font-bold ${(session?.credits ?? 0) < 3 ? 'text-orange' : 'text-foreground'}`}>
              · {session?.credits ?? 0} remaining
            </span>
          </div>
        </div>

        {/* No Credits Warning */}
        {noCredits && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">No credits remaining</p>
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
            sourcePreview={sourcePreview}
            targetPreview={targetPreview || selectedTemplate?.url}
            onDownload={handleDownload}
            onRetry={handleRetry}
            onClose={handleCloseAnimation}
          />

          {/* ═══ LEFT COLUMN — Source Face ═══ */}
          <div data-tutorial="source-face" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Face</h3>
            </div>
            <UploadZone
              type="source"
              label="Source Face"
              preview={sourcePreview}
              inputRef={sourceRef as React.RefObject<HTMLInputElement | null>}
            />
          </div>

          {/* ═══ CENTER COLUMN — Controls ═══ */}
          <div className="space-y-5">
            {/* Model badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-purple/10 text-purple border border-purple/20">
                NNN v1
              </span>
            </div>

            {/* Resolution */}
            <div data-tutorial="resolution" className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
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
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((ar) => {
                  const Icon = ar.icon
                  return (
                    <button
                      key={ar.id}
                      onClick={() => setAspectRatio(ar.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                        aspectRatio === ar.id
                          ? 'bg-orange/10 text-orange border border-orange/30'
                          : 'bg-white/5 text-soft-gray hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold">{ar.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Swap Mode */}
            <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Swap Mode</label>
              <div className="relative">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{SWAP_MODES.find((m) => m.id === swapMode)?.label}</p>
                    <p className="text-[10px] text-soft-gray">{SWAP_MODES.find((m) => m.id === swapMode)?.desc}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-soft-gray transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showModeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#111116] shadow-xl z-20 overflow-hidden"
                    >
                      {SWAP_MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSwapMode(m.id); setShowModeDropdown(false) }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors ${
                            swapMode === m.id ? 'bg-orange/5 border-l-2 border-orange' : ''
                          }`}
                        >
                          <p className={`text-sm font-medium ${swapMode === m.id ? 'text-orange' : 'text-foreground'}`}>{m.label}</p>
                          <p className="text-[10px] text-soft-gray">{m.desc}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-soft-gray/50 hover:text-soft-gray transition-colors uppercase tracking-wider font-bold"
            >
              <Settings2 className="w-3 h-3" />
              Advanced Options
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-white/5 bg-card p-4 space-y-2">
                    <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Prompt Editor</label>
                    <p className="text-[10px] text-soft-gray/50">Edit prompts from Admin Settings panel.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Credits + Generate button */}
            <div className="space-y-3 pt-2">
              <div data-tutorial="credits-indicator-center" className="flex items-center justify-between text-xs px-1">
                <span className="text-soft-gray">Cost: <span className="text-orange font-bold">1 credit</span></span>
                <span className={`font-bold ${(session?.credits ?? 0) < 3 ? 'text-orange' : 'text-soft-gray'}`}>
                  {session?.credits ?? 0} credits left
                </span>
              </div>

              <button
                data-tutorial="generate-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full h-14 bg-gradient-to-r from-orange to-[#ff6a33] text-white font-black rounded-xl hover:scale-[1.02] hover:shadow-xl hover:shadow-orange/30 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3 text-base shadow-lg shadow-orange/20"
              >
                <Sparkles className="w-5 h-5" />
                Generate Face Swap
                <span className="text-xs font-normal opacity-70">— 1 credit</span>
              </button>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — Target Selector ═══ */}
          <div data-tutorial="target-selector" className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Target Image</h3>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(['templates', 'upload'] as TargetTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTargetTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${
                    targetTab === tab ? 'bg-orange text-white' : 'text-soft-gray hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Templates Tab */}
            {targetTab === 'templates' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => { setSelectedTemplate(t); setTargetFile(null); setTargetPreview(null); resetResult() }}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                        selectedTemplate?.id === t.id
                          ? 'border-orange shadow-lg shadow-orange/20'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      {t.url ? (
                        <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-soft-gray/30" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id) }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      {selectedTemplate?.id === t.id && (
                        <div className="absolute inset-0 bg-orange/10 border-2 border-orange rounded-lg" />
                      )}
                    </div>
                  ))}

                  {/* Add new template slot */}
                  {templates.length < 10 && (
                    <div
                      onClick={() => templateUploadRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-orange/30 flex items-center justify-center cursor-pointer hover:bg-orange/5 transition-all"
                    >
                      <Plus className="w-5 h-5 text-soft-gray/40" />
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-soft-gray/40 text-center">
                  {templates.length}/10 slots used
                </p>

                <input
                  ref={templateUploadRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadTemplate(file)
                    if (e.target) e.target.value = ''
                  }}
                />
              </div>
            )}

            {/* Upload Tab */}
            {targetTab === 'upload' && (
              <div className="space-y-3">
                <UploadZone
                  type="target"
                  label="Target Image"
                  preview={targetPreview}
                  inputRef={targetRef as React.RefObject<HTMLInputElement | null>}
                  showPaste={!sourcePreview}
                />
                {targetFile && (
                  <label className="flex items-center gap-2 text-xs text-soft-gray cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToTemplates}
                      onChange={(e) => setSaveToTemplates(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-orange focus:ring-orange"
                    />
                    Save to templates
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ GENERATION HISTORY ═══ */}
        {history.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-soft-gray" />
              Recent Generations
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => item.status === 'completed' && setHistoryModalItem(item)}
                  className={`flex-shrink-0 w-40 rounded-xl border overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] ${
                    item.status === 'failed'
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-white/5 bg-card hover:border-white/10'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-white/5">
                    {item.resultUrl ? (
                      <img src={item.resultUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.status === 'failed' ? (
                          <AlertCircle className="w-6 h-6 text-red-400/40" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-soft-gray/20" />
                        )}
                      </div>
                    )}

                    {/* Download on hover */}
                    {item.resultUrl && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className={`absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : item.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.status}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold text-orange uppercase">Face Swap</span>
                      <span className="text-[9px] text-soft-gray/40">{item.resolution}</span>
                    </div>
                    <p className="text-[10px] text-soft-gray/60">{timeAgo(item.created_at)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ HISTORY MODAL ═══ */}
        <AnimatePresence>
          {historyModalItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setHistoryModalItem(null)}
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-2xl w-full rounded-2xl border border-white/10 bg-[#111116] p-4 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Generation Result</h3>
                  <button onClick={() => setHistoryModalItem(null)} className="p-1.5 rounded-full hover:bg-white/10 text-soft-gray">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {historyModalItem.resultUrl && (
                  <img src={historyModalItem.resultUrl} alt="Result" className="w-full rounded-xl object-contain max-h-[60vh]" />
                )}

                <div className="flex gap-2">
                  <a
                    href={historyModalItem.resultUrl}
                    download={`nanoni-${historyModalItem.id}.png`}
                    className="flex-1 py-2.5 bg-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange/90 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <button
                    onClick={() => {
                      if (historyModalItem.resultUrl) {
                        setSelectedTemplate(null)
                        setTargetPreview(historyModalItem.resultUrl)
                        setTargetTab('upload')
                        setHistoryModalItem(null)
                      }
                    }}
                    className="flex-1 py-2.5 border border-white/10 text-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-sm"
                  >
                    <ImageIcon className="w-4 h-4" /> Use as Template
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  )
}

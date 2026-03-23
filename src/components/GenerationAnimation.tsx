import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, RotateCcw, X, CheckCircle, AlertCircle, Coins } from 'lucide-react'

const STAGES = [
  'Analyzing faces...',
  'Mapping features...',
  'Blending...',
  'Enhancing...',
  'Finalizing...',
]

interface GenerationAnimationProps {
  isProcessing: boolean
  isComplete: boolean
  isError: boolean
  errorMessage?: string
  isRefunded: boolean
  resultImage?: string | null
  sourcePreview?: string | null
  targetPreview?: string | null
  onDownload?: () => void
  onRetry?: () => void
  onClose?: () => void
}

// Particle system using canvas
function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number
    size: number; alpha: number; color: string; life: number; maxLife: number
  }>>([])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    // Spawn particles
    if (active && Math.random() < 0.3) {
      const angle = Math.random() * Math.PI * 2
      const dist = 60 + Math.random() * 40
      particlesRef.current.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 1 + Math.random() * 3,
        alpha: 0.8,
        color: Math.random() > 0.5 ? '#FF3D00' : '#7A6FFF',
        life: 0,
        maxLife: 60 + Math.random() * 60,
      })
    }

    // Update & draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.life++
      p.x += p.vx
      p.y += p.vy
      p.alpha = Math.max(0, 0.8 * (1 - p.life / p.maxLife))

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.fill()
      ctx.globalAlpha = 1

      return p.life < p.maxLife
    })

    // Glow rings
    if (active) {
      const t = Date.now() / 1000
      for (let i = 0; i < 2; i++) {
        const phase = (t * 0.5 + i * 0.5) % 1
        const radius = 30 + phase * 100
        const alpha = 0.3 * (1 - phase)
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = i === 0 ? '#FF3D00' : '#7A6FFF'
        ctx.lineWidth = 2
        ctx.globalAlpha = alpha
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(2, 2)
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animate])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// Confetti burst for completion
function ConfettiBurst() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (i / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 80 + Math.random() * 120,
    size: 4 + Math.random() * 6,
    color: Math.random() > 0.5 ? '#FF3D00' : '#7A6FFF',
    delay: Math.random() * 0.2,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: `calc(50% + ${Math.cos(p.angle) * p.distance}px)`,
            y: `calc(50% + ${Math.sin(p.angle) * p.distance}px)`,
            scale: 1,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  )
}

export default function GenerationAnimation({
  isProcessing,
  isComplete,
  isError,
  errorMessage,
  isRefunded,
  resultImage,
  sourcePreview,
  targetPreview,
  onDownload,
  onRetry,
  onClose,
}: GenerationAnimationProps) {
  const [stage, setStage] = useState(0)
  const [showRefund, setShowRefund] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Stage progression
  useEffect(() => {
    if (!isProcessing) { setStage(0); return }
    const interval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [isProcessing])

  // Timer
  useEffect(() => {
    if (!isProcessing) { setElapsed(0); return }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [isProcessing])

  // Refund animation
  useEffect(() => {
    if (isError && isRefunded) {
      const timer = setTimeout(() => setShowRefund(true), 1500)
      const hide = setTimeout(() => setShowRefund(false), 4500)
      return () => { clearTimeout(timer); clearTimeout(hide) }
    }
    setShowRefund(false)
  }, [isError, isRefunded])

  const isVisible = isProcessing || isComplete || isError

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0B0B0F]/90 backdrop-blur-md rounded-2xl" />

          {/* Close button */}
          {(isComplete || isError) && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-soft-gray hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* ─── PROCESSING STATE ─── */}
          {isProcessing && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex flex-col items-center z-10 w-full max-w-sm px-6"
            >
              <ParticleCanvas active />

              {/* Orbiting thumbnails */}
              <div className="relative w-40 h-40 mb-6">
                {/* NNN Logo center */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-purple flex items-center justify-center shadow-lg shadow-orange/20">
                    <span className="text-white font-black text-lg tracking-tight">N</span>
                  </div>
                </motion.div>

                {/* Source thumbnail orbit */}
                {sourcePreview && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full overflow-hidden border-2 border-orange shadow-lg">
                      <img src={sourcePreview} alt="" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                )}

                {/* Target thumbnail orbit */}
                {targetPreview && (
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full overflow-hidden border-2 border-purple shadow-lg">
                      <img src={targetPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                )}

                {/* Scanning line */}
                <motion.div
                  animate={{ y: [-70, 70, -70] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-orange/60 to-transparent"
                />
              </div>

              {/* Stage text */}
              <div className="text-center mb-4">
                <motion.p
                  className="text-xs text-soft-gray/60 mb-2 font-mono"
                >
                  NNN v1 Processing...
                </motion.p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm font-semibold text-foreground"
                  >
                    {STAGES[stage]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Timer */}
              <p className="text-[11px] text-soft-gray/40 font-mono">{elapsed}s elapsed</p>

              {/* Stage dots */}
              <div className="flex gap-1.5 mt-4">
                {STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      i <= stage ? 'bg-orange scale-110' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── COMPLETE STATE ─── */}
          {isComplete && resultImage && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative flex flex-col items-center z-10 w-full max-w-sm px-6"
            >
              <ConfettiBurst />

              {/* Flash */}
              <motion.div
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-white rounded-2xl"
              />

              {/* Result image */}
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-4"
              >
                <img src={resultImage} alt="Result" className="w-full object-contain max-h-[300px]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 mb-4"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold text-green-400">Generation Complete!</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onDownload}
                className="w-full py-3 bg-gradient-to-r from-orange to-[#ff6a33] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-orange/20"
              >
                <Download className="w-5 h-5" />
                Download Result
              </motion.button>
            </motion.div>
          )}

          {/* ─── ERROR STATE ─── */}
          {isError && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex flex-col items-center z-10 w-full max-w-sm px-6"
            >
              {/* Red pulse */}
              <motion.div
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 1 }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-red-500"
              />

              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />

              <p className="text-lg font-bold text-red-400 mb-2">Generation Failed</p>
              <p className="text-sm text-soft-gray text-center mb-6">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>

              {/* Refund badge */}
              <AnimatePresence>
                {showRefund && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-500/10 border border-green-500/30 mb-6"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                    >
                      <Coins className="w-4 h-4 text-green-400" />
                    </motion.div>
                    <span className="text-sm font-bold text-green-400">Credit refunded</span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs text-green-400/60"
                    >
                      +1
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={onRetry}
                className="w-full py-3 bg-white/5 border border-white/10 text-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

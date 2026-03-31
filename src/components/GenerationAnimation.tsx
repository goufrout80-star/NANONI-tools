import { useState, useEffect } from 'react'
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

// Background particles
function BackgroundParticles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random(),
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0.1 + Math.random() * 0.1,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Confetti burst for completion
function ConfettiBurst() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 80 + Math.random() * 120,
    size: 3 + Math.random() * 5,
    color: '#FF3D00',
    delay: Math.random() * 0.15,
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
          <div className="absolute inset-0 bg-[rgba(11,11,15,0.92)] backdrop-blur-md rounded-2xl" />
          
          {/* Background particles */}
          <BackgroundParticles />
          
          {/* Blurred blobs */}
          <div className="absolute left-[10%] top-[30%] w-[200px] h-[200px] rounded-full bg-[rgba(255,61,0,0.06)] blur-[200px] pointer-events-none" />
          <div className="absolute right-[10%] bottom-[30%] w-[200px] h-[200px] rounded-full bg-[rgba(122,111,255,0.05)] blur-[200px] pointer-events-none" />

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
              className="relative flex flex-col items-center z-10 w-full max-w-md px-6"
            >
              {/* Main container with input images */}
              <div className="relative flex items-center justify-center mb-8">
                {/* Source image (left) */}
                {sourcePreview && (
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-white shadow-lg"
                    style={{ transform: 'translateX(-80px)' }}
                  >
                    <img src={sourcePreview} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                )}

                {/* Connecting line (source to logo) */}
                <svg className="absolute left-0" width="80" height="2" style={{ transform: 'translateX(-80px)' }}>
                  <motion.line
                    x1="52"
                    y1="1"
                    x2="80"
                    y2="1"
                    stroke="rgba(255,61,0,0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -8] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </svg>

                {/* Logo center with animations */}
                <div className="relative w-16 h-16">
                  {/* Radar pulse rings */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-[rgba(255,61,0,0.4)]"
                      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                      animate={{
                        width: ['0px', '120px'],
                        height: ['0px', '120px'],
                        opacity: [0.8, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.66,
                        ease: 'easeOut',
                      }}
                    />
                  ))}

                  {/* Logo with scanline and flash */}
                  <div className="relative w-16 h-16 overflow-hidden rounded-lg">
                    <img
                      src="/logo.svg"
                      alt="NNN"
                      className="w-full h-full object-contain"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    
                    {/* Orange flash sweep */}
                    <motion.div
                      className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(255,61,0,0.9)] to-transparent"
                      style={{ transform: 'translateY(-50%)' }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        repeatDelay: 1.6,
                        ease: 'easeInOut',
                      }}
                    />

                    {/* Scanline sweep */}
                    <motion.div
                      className="absolute left-0 w-full h-[1px] bg-[rgba(255,61,0,0.6)]"
                      animate={{ y: ['0%', '100%'] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: 'linear',
                      }}
                    />
                  </div>
                </div>

                {/* Connecting line (logo to target) */}
                <svg className="absolute right-0" width="80" height="2" style={{ transform: 'translateX(80px)' }}>
                  <motion.line
                    x1="0"
                    y1="1"
                    x2="28"
                    y2="1"
                    stroke="rgba(255,61,0,0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -8] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </svg>

                {/* Target image (right) */}
                {targetPreview && (
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute right-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-white shadow-lg"
                    style={{ transform: 'translateX(80px)' }}
                  >
                    <img src={targetPreview} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                )}
              </div>

              {/* Status text */}
              <div className="text-center mb-3">
                <p className="text-[10px] text-[#7A6FFF] font-[Stardom] tracking-[3px] mb-2">NNN v1</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-base font-bold text-white"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {STAGES[stage]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Timer */}
              <p className="text-xs text-[#A0A0A0] mb-4" style={{ fontFamily: 'Inter' }}>{elapsed}s elapsed</p>

              {/* Progress dots */}
              <div className="flex gap-2">
                {STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= stage ? 'bg-[#FF3D00]' : 'bg-[rgba(255,255,255,0.2)]'
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

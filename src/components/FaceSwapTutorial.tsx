import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const TUTORIAL_KEY = 'nanoni_faceswap_tutorial_seen'

interface Step {
  target: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    target: '[data-tutorial="source-face"]',
    title: 'Upload Your Source Photo',
    description: 'Upload your source photo here — this is the face that will be swapped.',
  },
  {
    target: '[data-tutorial="target-selector"]',
    title: 'Choose a Target Image',
    description: 'Choose or upload a target image — save up to 10 as reusable templates.',
  },
  {
    target: '[data-tutorial="resolution"]',
    title: 'Choose Output Quality',
    description: 'Choose your output quality — higher resolution uses more processing time.',
  },
  {
    target: '[data-tutorial="credits-indicator"]',
    title: 'Credits System',
    description: 'Each generation costs 1 credit — failed generations are automatically refunded.',
  },
  {
    target: '[data-tutorial="generate-btn"]',
    title: 'Generate!',
    description: "Hit Generate when you're ready — your result will appear below!",
  },
]

export default function FaceSwapTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const el = document.querySelector(STEPS[step].target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setSpotlightRect(rect)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step, visible])

  const finish = () => {
    setVisible(false)
    localStorage.setItem(TUTORIAL_KEY, 'true')
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  const back = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!visible) return null

  const pad = 8
  const clipPath = spotlightRect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px,
        ${spotlightRect.left - pad}px ${spotlightRect.bottom + pad}px,
        ${spotlightRect.right + pad}px ${spotlightRect.bottom + pad}px,
        ${spotlightRect.right + pad}px ${spotlightRect.top - pad}px,
        ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px
      )`
    : undefined

  // Tooltip position
  const tooltipStyle: React.CSSProperties = {}
  if (spotlightRect) {
    const below = spotlightRect.bottom + pad + 16
    const above = spotlightRect.top - pad - 16
    if (below + 160 < window.innerHeight) {
      tooltipStyle.top = below
    } else {
      tooltipStyle.bottom = window.innerHeight - above
    }
    tooltipStyle.left = Math.max(16, Math.min(spotlightRect.left, window.innerWidth - 320))
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight hole */}
        <div
          className="absolute inset-0 bg-black/70 transition-all duration-500"
          style={{ clipPath }}
        />

        {/* Spotlight border glow */}
        {spotlightRect && (
          <motion.div
            layoutId="spotlight-border"
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute border-2 border-orange/60 rounded-xl shadow-[0_0_20px_rgba(255,61,0,0.3)] pointer-events-none"
            style={{
              left: spotlightRect.left - pad,
              top: spotlightRect.top - pad,
              width: spotlightRect.width + pad * 2,
              height: spotlightRect.height + pad * 2,
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-10 w-[300px] p-4 rounded-xl bg-[#1a1a22]/90 backdrop-blur-xl border border-orange/20 shadow-2xl"
          style={tooltipStyle}
        >
          <p className="text-sm font-bold text-foreground mb-1">{STEPS[step].title}</p>
          <p className="text-xs text-soft-gray leading-relaxed mb-4">{STEPS[step].description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? 'bg-orange scale-110' : i < step ? 'bg-orange/40' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={back}
                  className="text-xs text-soft-gray hover:text-foreground transition-colors px-2 py-1"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="text-xs font-bold text-white bg-orange hover:bg-orange/90 px-3 py-1.5 rounded-lg transition-colors"
              >
                {step === STEPS.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Skip button */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-xs text-soft-gray/60 hover:text-foreground transition-colors px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <X className="w-3 h-3" />
          Skip
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

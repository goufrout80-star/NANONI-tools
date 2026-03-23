import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { X, ArrowRight, ArrowLeft, Sparkles, Zap, CreditCard, Settings, Rocket } from 'lucide-react'

interface TutorialStep {
  title: string
  description: string
  icon: React.ReactNode
  targetSelector?: string
  position: 'center' | 'top' | 'bottom'
}

const steps: TutorialStep[] = [
  {
    title: 'Welcome to NANONI Studio!',
    description: 'Your creative AI workspace is ready. Let us show you around — it only takes a moment.',
    icon: <Sparkles className="w-6 h-6 text-orange" />,
    position: 'center',
  },
  {
    title: 'Your Tools',
    description: 'Access all your AI creative tools from the Tools page. Face Swap is live now — more tools are coming soon!',
    icon: <Zap className="w-6 h-6 text-purple" />,
    targetSelector: '[data-tutorial="tools-nav"]',
    position: 'bottom',
  },
  {
    title: 'Credits System',
    description: 'Each tool use costs 1 credit. You start with 10 free credits. Check your balance in the sidebar or header.',
    icon: <CreditCard className="w-6 h-6 text-green-400" />,
    targetSelector: '[data-tutorial="credits"]',
    position: 'bottom',
  },
  {
    title: 'Settings & Profile',
    description: 'View your usage history, manage your account, and check your credit balance anytime.',
    icon: <Settings className="w-6 h-6 text-soft-gray" />,
    targetSelector: '[data-tutorial="settings-nav"]',
    position: 'bottom',
  },
  {
    title: "You're All Set!",
    description: "That's everything you need to know. Head to Face Swap and create your first masterpiece!",
    icon: <Rocket className="w-6 h-6 text-orange" />,
    position: 'center',
  },
]

export function TutorialOverlay() {
  const { session, completeTutorial } = useAuth()
  const [current, setCurrent] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)

  // Show tutorial only for users who haven't completed it
  useEffect(() => {
    if (session && !session.tutorialCompleted) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [session])

  // Update spotlight position
  useEffect(() => {
    if (!visible) return

    const step = steps[current]
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        const rect = el.getBoundingClientRect()
        setSpotlightRect(rect)
      } else {
        setSpotlightRect(null)
      }
    } else {
      setSpotlightRect(null)
    }
  }, [current, visible])

  const handleNext = useCallback(() => {
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      handleFinish()
    }
  }, [current])

  const handlePrev = useCallback(() => {
    if (current > 0) setCurrent((c) => c - 1)
  }, [current])

  const handleFinish = useCallback(() => {
    setVisible(false)
    completeTutorial()
  }, [completeTutorial])

  const handleSkip = useCallback(() => {
    setVisible(false)
    completeTutorial()
  }, [completeTutorial])

  if (!visible) return null

  const step = steps[current]
  const isLast = current === steps.length - 1
  const isFirst = current === 0
  const padding = 8

  // Clip path for spotlight hole
  const clipPath = spotlightRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${spotlightRect.left - padding}px ${spotlightRect.top - padding}px,
        ${spotlightRect.left - padding}px ${spotlightRect.bottom + padding}px,
        ${spotlightRect.right + padding}px ${spotlightRect.bottom + padding}px,
        ${spotlightRect.right + padding}px ${spotlightRect.top - padding}px,
        ${spotlightRect.left - padding}px ${spotlightRect.top - padding}px
      )`
    : undefined

  // Tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const centerX = spotlightRect.left + spotlightRect.width / 2

    if (step.position === 'bottom') {
      return {
        top: spotlightRect.bottom + padding + 16,
        left: Math.min(Math.max(centerX, 200), window.innerWidth - 200),
        transform: 'translateX(-50%)',
      }
    }

    return {
      bottom: window.innerHeight - spotlightRect.top + padding + 16,
      left: Math.min(Math.max(centerX, 200), window.innerWidth - 200),
      transform: 'translateX(-50%)',
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Dark overlay with spotlight hole */}
        <div
          className="absolute inset-0 bg-black/80 transition-all duration-500"
          style={clipPath ? { clipPath } : undefined}
          onClick={handleSkip}
        />

        {/* Spotlight border glow */}
        {spotlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute border-2 border-orange/40 rounded-xl pointer-events-none"
            style={{
              top: spotlightRect.top - padding,
              left: spotlightRect.left - padding,
              width: spotlightRect.width + padding * 2,
              height: spotlightRect.height + padding * 2,
              boxShadow: '0 0 30px rgba(255,61,0,0.2), inset 0 0 30px rgba(255,61,0,0.05)',
            }}
          />
        )}

        {/* Tooltip Card */}
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute z-[101] w-[380px] max-w-[90vw]"
          style={getTooltipStyle()}
        >
          <div className="rounded-2xl border border-white/10 bg-[#111116] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Top gradient line */}
            <div className="h-[2px] bg-gradient-to-r from-orange via-purple to-transparent" />

            <div className="p-6">
              {/* Skip button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-soft-gray/40 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold tracking-[2px] uppercase text-purple">
                  Step {current + 1} of {steps.length}
                </span>
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="text-lg font-black text-foreground">{step.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-soft-gray leading-relaxed mb-6">{step.description}</p>

              {/* Progress dots + Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === current
                          ? 'w-6 bg-orange'
                          : i < current
                            ? 'w-1.5 bg-orange/40'
                            : 'w-1.5 bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-soft-gray hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isLast
                        ? 'bg-orange text-white hover:bg-orange/90 shadow-lg shadow-orange/20'
                        : 'bg-white/10 text-foreground hover:bg-white/15'
                    }`}
                  >
                    {isLast ? 'Get Started' : 'Next'}
                    {!isLast && <ArrowRight className="w-3 h-3" />}
                    {isLast && <Rocket className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

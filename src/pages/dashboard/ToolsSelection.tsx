import { motion } from 'framer-motion'
import { UserLayout } from '@/components/UserLayout'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { TOOLS } from '@/lib/tools'
import { Lock, Sparkles, ArrowRight, Zap } from 'lucide-react'

export default function ToolsSelection() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const faceSwapTool = TOOLS[0]
  const comingSoonTools = TOOLS.slice(1)

  return (
    <UserLayout title="Tools">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[3px] uppercase text-purple bg-purple/10 border border-purple/20 rounded-full px-4 py-1.5">
              <Sparkles className="w-3 h-3" />
              Creative Suite
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-3xl font-black text-foreground tracking-tight"
          >
            Your <span className="text-orange">Tools</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-soft-gray max-w-md mx-auto"
          >
            Powerful AI tools to transform your creative workflow.
            You have <span className="text-orange font-bold">{session?.credits ?? 0} credits</span> remaining.
          </motion.p>
        </div>

        {/* Active Tool — Face Swap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={() => navigate('/dashboard/faceswap')}
          className="group relative rounded-2xl border border-orange/20 bg-gradient-to-br from-orange/[0.06] via-transparent to-purple/[0.04] p-6 md:p-8 cursor-pointer hover:border-orange/40 transition-all duration-300 overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-[#FF6B35] flex items-center justify-center shadow-lg shadow-orange/20">
              <Zap className="w-8 h-8 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-black text-foreground">{faceSwapTool.name}</h3>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-orange/15 text-orange border border-orange/25">
                  NNN v1
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-purple/15 text-purple border border-purple/25 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  NNN v1 Max — Pro
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                  Active
                </span>
              </div>
              <p className="text-sm text-soft-gray">{faceSwapTool.desc}</p>
              <p className="text-xs text-soft-gray/60">1 credit per swap &middot; Powered by NNN v1</p>
            </div>

            {/* CTA */}
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange text-white text-sm font-bold hover:bg-orange/90 transition-colors group-hover:shadow-lg group-hover:shadow-orange/20">
              Open Tool
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Coming Soon Grid */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-bold tracking-[3px] uppercase text-soft-gray/40">Coming Soon</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoonTools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.04 }}
                className="relative rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 opacity-50 cursor-not-allowed select-none group"
              >
                {/* Lock overlay */}
                <div className="absolute inset-0 rounded-xl bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Lock className="w-4 h-4 text-soft-gray/40" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-soft-gray/40">Q2 2026</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground/60">{tool.name}</h4>
                    <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 text-soft-gray/40 border border-white/5">
                      {tool.model}
                    </span>
                  </div>
                  <p className="text-xs text-soft-gray/40">{tool.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}

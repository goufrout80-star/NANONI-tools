import { useState, useEffect } from 'react'
import { UserLayout } from '@/components/UserLayout'
import { TutorialOverlay } from '@/components/TutorialOverlay'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { Camera, Lock, Sparkles, Wand2 } from 'lucide-react'

interface ToolConfig {
  tool_name: string
  is_active: boolean
}

const toolDisplayNames: Record<string, { name: string; desc: string; icon: string }> = {
  face_swap: { name: 'Face Swap', desc: 'Identity-preserving face replacement', icon: '🔄' },
  vibe_swap: { name: 'Vibe Swap', desc: 'Era/theme/style transfer', icon: '🎨' },
  relight: { name: 'Relight', desc: 'Parametric lighting control', icon: '💡' },
  skin_enhancement: { name: 'Skin Enhancement', desc: '3-mode skin retouching', icon: '✨' },
  cloth_swap: { name: 'Cloth Swap', desc: 'Clothing replacement', icon: '👕' },
  hair_swap: { name: 'Hair Swap', desc: 'Hairstyle replacement', icon: '💇' },
  brush_edit: { name: 'Brush Edit', desc: 'Mask-based area editing', icon: '🖌️' },
  angles_edit: { name: 'Angles Edit', desc: '3D viewing angle simulation', icon: '📐' },
  ai_upscaler: { name: 'AI Upscaler', desc: '2x/4x upscaling', icon: '🔍' },
  color_gradient: { name: 'Color Gradient', desc: 'Color grading & mood', icon: '🌈' },
  camera_shot_simulator: { name: 'Camera Simulator', desc: 'Simulates camera brands', icon: '📷' },
  style_fusion: { name: 'Style Fusion', desc: 'Content + style blending', icon: '🎭' },
  object_remover: { name: 'Object Remover', desc: 'Semantic inpainting', icon: '🧹' },
  image_extend: { name: 'Image Extend', desc: 'Outpainting', icon: '🖼️' },
  storyboard_generator: { name: 'Storyboard', desc: '4-panel narratives', icon: '📋' },
  ad_pack_generator: { name: 'Ad Pack', desc: 'Multi-format ad creative', icon: '📢' },
  ai_generate: { name: 'AI Generate', desc: 'Text-to-image', icon: '🤖' },
  logo_converter: { name: 'Logo Converter', desc: 'Logo format conversion', icon: '🏷️' },
  design_extractor: { name: 'Design Extractor', desc: 'Design element extraction', icon: '🎯' },
}

export default function UserDashboard() {
  const { session, refreshCredits } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tools, setTools] = useState<ToolConfig[]>([])
  const [faceSwapCount, setFaceSwapCount] = useState(0)

  useEffect(() => {
    refreshCredits()

    // Fetch tools
    supabase.from('tools_config').select('tool_name, is_active').then(({ data }) => {
      setTools(data || [])
    })

    // Fetch face swap count for current user
    if (session?.email) {
      supabase
        .from('tool_usage')
        .select('*', { count: 'exact', head: true })
        .eq('email', session.email)
        .eq('tool_name', 'face_swap')
        .then(({ count }) => {
          setFaceSwapCount(count || 0)
        })
    }
  }, [session?.email])

  const TOOL_ROUTES: Record<string, string> = {
    face_swap: '/dashboard/faceswap',
    ai_generate: '/dashboard/ai-generate',
    vibe_swap: '/dashboard/vibe-swap',
  }

  const handleToolClick = (toolName: string, isActive: boolean) => {
    const route = TOOL_ROUTES[toolName]
    if (route && isActive) {
      navigate(route)
    } else {
      toast({
        title: 'Coming Soon!',
        description: "This tool is coming soon! We're working on it 🚀",
      })
    }
  }

  const faceSwapTool = tools.find((t) => t.tool_name === 'face_swap')
  const aiGenerateTool = tools.find((t) => t.tool_name === 'ai_generate')
  const vibeSwapTool = tools.find((t) => t.tool_name === 'vibe_swap')
  const otherTools = tools.filter((t) => !['face_swap', 'ai_generate', 'vibe_swap'].includes(t.tool_name))

  return (
    <UserLayout title="Dashboard">
      {/* First-time tutorial */}
      <TutorialOverlay />

      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-orange/5 via-transparent to-purple/5 p-6 md:p-8 mb-8">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
            Welcome back, {session?.name || 'there'}! 👋
          </h2>
          <p className="text-soft-gray text-sm mb-6">
            You have <span className="text-orange font-bold text-lg">{session?.credits ?? 0}</span> credits remaining
          </p>

          {/* Credits progress bar */}
          <div className="max-w-md">
            <div className="flex justify-between text-xs text-soft-gray mb-1.5">
              <span>Credits used</span>
              <span>{Math.max(0, 10 - (session?.credits ?? 0))}/10</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange to-purple transition-all duration-700"
                style={{ width: `${Math.max(0, 10 - (session?.credits ?? 0)) / 10 * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-orange/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple/5 blur-3xl" />
      </div>

      {/* Tools Grid */}
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange" />
        AI Creative Tools
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Face Swap — Featured */}
        {faceSwapTool && (
          <div
            onClick={() => handleToolClick('face_swap', faceSwapTool.is_active)}
            className="relative col-span-1 sm:col-span-2 overflow-hidden rounded-xl border border-orange/20 bg-gradient-to-br from-orange/10 to-purple/5 p-5 cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-orange/5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange" />
                  <h4 className="text-lg font-bold text-foreground">Face Swap</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange/20 text-orange border border-orange/30">
                    NNN v1
                  </span>
                </div>
                <p className="text-sm text-soft-gray">Identity-preserving face replacement using our NNN v1 model</p>
                <p className="text-xs text-soft-gray/60">{faceSwapCount} swaps completed</p>
              </div>
              <div className="text-3xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                🔄
              </div>
            </div>
            {!faceSwapTool.is_active && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <span className="text-sm font-semibold text-soft-gray">Coming Soon</span>
              </div>
            )}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-orange/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        {/* AI Generate — Featured */}
        {aiGenerateTool && (
          <div
            onClick={() => handleToolClick('ai_generate', aiGenerateTool.is_active)}
            className="relative col-span-1 overflow-hidden rounded-xl border border-purple/20 bg-gradient-to-br from-purple/10 to-emerald-500/5 p-5 cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-purple/5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple" />
                  <h4 className="text-base font-bold text-foreground">AI Generate</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/20 text-purple border border-purple/30">
                    Text to Image
                  </span>
                </div>
                <p className="text-sm text-soft-gray">Describe any image and bring it to life with AI</p>
              </div>
              <div className="text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">🤖</div>
            </div>
            {!aiGenerateTool.is_active && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <span className="text-sm font-semibold text-soft-gray">Coming Soon</span>
              </div>
            )}
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-purple/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        {/* Vibe Swap — Featured */}
        {vibeSwapTool && (
          <div
            onClick={() => handleToolClick('vibe_swap', vibeSwapTool.is_active)}
            className="relative col-span-1 overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-purple/5 p-5 cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-teal-400" />
                  <h4 className="text-base font-bold text-foreground">Vibe Swap</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    Style Transfer
                  </span>
                </div>
                <p className="text-sm text-soft-gray">Transfer any era or aesthetic onto your photo</p>
              </div>
              <div className="text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">🎨</div>
            </div>
            {!vibeSwapTool.is_active && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <span className="text-sm font-semibold text-soft-gray">Coming Soon</span>
              </div>
            )}
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-teal-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        {/* Other Tools */}
        {otherTools.map((tool) => {
          const display = toolDisplayNames[tool.tool_name]
          if (!display) return null

          return (
            <div
              key={tool.tool_name}
              onClick={() => handleToolClick(tool.tool_name, tool.is_active)}
              className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-300 group
                ${tool.is_active
                  ? 'border-white/10 bg-card hover:border-purple/30 hover:bg-white/[0.03]'
                  : 'border-white/5 bg-card/50 opacity-50 hover:opacity-70'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{display.icon}</span>
                {!tool.is_active && <Lock className="w-3.5 h-3.5 text-soft-gray/40" />}
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">{display.name}</h4>
              <p className="text-xs text-soft-gray line-clamp-1">{display.desc}</p>

              {!tool.is_active && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs font-semibold text-soft-gray bg-background/80 px-3 py-1.5 rounded-full border border-white/10">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </UserLayout>
  )
}

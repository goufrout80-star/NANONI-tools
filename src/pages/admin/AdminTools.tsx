import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Loader2, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ToolConfig {
  id: string
  tool_name: string
  is_active: boolean
}

const toolDisplayNames: Record<string, { name: string; desc: string }> = {
  face_swap: { name: 'Face Swap', desc: 'Identity-preserving face replacement' },
  vibe_swap: { name: 'Vibe Swap', desc: 'Era/theme/style transfer' },
  relight: { name: 'Relight', desc: 'Parametric lighting control' },
  skin_enhancement: { name: 'Skin Enhancement', desc: '3-mode skin retouching' },
  cloth_swap: { name: 'Cloth Swap', desc: 'Clothing replacement with fit control' },
  hair_swap: { name: 'Hair Swap', desc: 'Hairstyle replacement' },
  brush_edit: { name: 'Brush Edit', desc: 'Mask-based area editing' },
  angles_edit: { name: 'Angles Edit', desc: '3D viewing angle simulation' },
  ai_upscaler: { name: 'AI Upscaler', desc: '2x/4x upscaling with enhancement' },
  color_gradient: { name: 'Color Gradient', desc: 'Color grading & mood transformation' },
  camera_shot_simulator: { name: 'Camera Simulator', desc: 'Simulates 10+ camera brands' },
  style_fusion: { name: 'Style Fusion', desc: 'Content + style reference blending' },
  object_remover: { name: 'Object Remover', desc: 'Semantic inpainting' },
  image_extend: { name: 'Image Extend', desc: 'Outpainting with scene continuation' },
  storyboard_generator: { name: 'Storyboard Generator', desc: '4-panel narrative storyboards' },
  ad_pack_generator: { name: 'Ad Pack Generator', desc: 'Multi-format ad creative generation' },
  ai_generate: { name: 'AI Generate', desc: 'Text-to-image generation' },
  logo_converter: { name: 'Logo Converter', desc: 'Logo format conversion' },
  design_extractor: { name: 'Design Extractor', desc: 'Design element extraction' },
}

export default function AdminTools() {
  const { session } = useAuth()
  const { toast } = useToast()
  const [tools, setTools] = useState<ToolConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchTools = async () => {
    const { data } = await supabase
      .from('tools_config')
      .select('*')
      .order('tool_name')

    setTools(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTools() }, [])

  const handleToggle = async (toolName: string, currentState: boolean) => {
    if (!session) return
    setToggling(toolName)

    try {
      await supabase.functions.invoke('toggle-tool', {
        body: { toolName, isActive: !currentState, adminEmail: session.email },
      })
      toast({
        title: !currentState ? 'Tool activated' : 'Tool deactivated',
        description: `${toolDisplayNames[toolName]?.name || toolName} is now ${!currentState ? 'active' : 'inactive'}.`,
      })
      fetchTools()
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle tool.', variant: 'destructive' })
    }

    setToggling(null)
  }

  const faceSwap = tools.find((t) => t.tool_name === 'face_swap')
  const otherTools = tools.filter((t) => t.tool_name !== 'face_swap')

  return (
    <AdminLayout title="Tools Management">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Face Swap — Featured Card */}
          {faceSwap && (
            <div className="relative overflow-hidden rounded-2xl border border-orange/20 bg-gradient-to-br from-orange/5 to-purple/5 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-foreground">Face Swap</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange/20 text-orange border border-orange/30">
                      NNN v1
                    </span>
                    {faceSwap.is_active && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-soft-gray text-sm">Identity-preserving face replacement using NNN v1 model</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle('face_swap', faceSwap.is_active)}
                  disabled={toggling === 'face_swap'}
                  className="relative"
                >
                  {toggling === 'face_swap' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange" />
                  ) : (
                    <div className={`w-14 h-7 rounded-full transition-colors duration-300 relative cursor-pointer ${faceSwap.is_active ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${faceSwap.is_active ? 'translate-x-7' : 'translate-x-0.5'}`} />
                    </div>
                  )}
                </button>
              </div>

              {/* Glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-orange/10 blur-3xl" />
            </div>
          )}

          {/* Other Tools Grid */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">All Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherTools.map((tool) => {
                const display = toolDisplayNames[tool.tool_name]
                return (
                  <div
                    key={tool.id}
                    className={`relative rounded-xl border p-4 transition-all duration-200 ${
                      tool.is_active
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-white/5 bg-card opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground truncate">{display?.name || tool.tool_name}</h4>
                          {!tool.is_active && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-soft-gray border border-white/10 flex-shrink-0">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-soft-gray truncate">{display?.desc || ''}</p>
                      </div>

                      {/* Toggle or Lock */}
                      {tool.tool_name === 'face_swap' ? null : (
                        <button
                          onClick={() => handleToggle(tool.tool_name, tool.is_active)}
                          disabled={toggling === tool.tool_name}
                          className="flex-shrink-0"
                        >
                          {toggling === tool.tool_name ? (
                            <Loader2 className="w-4 h-4 animate-spin text-soft-gray" />
                          ) : (
                            <div className={`w-10 h-5 rounded-full transition-colors duration-300 relative cursor-pointer ${tool.is_active ? 'bg-green-500' : 'bg-white/10'}`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${tool.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Lock overlay for inactive */}
                    {!tool.is_active && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-3 h-3 text-soft-gray/40" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

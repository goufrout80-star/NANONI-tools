import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Key, FileText, Save, RotateCcw, Loader2,
  CheckCircle, XCircle, Eye, EyeOff, Zap, Settings, Sliders
} from 'lucide-react'

interface AdminSetting {
  key: string
  value: string
}

const DEFAULT_PROMPT = `Make the person's face from picture number 1 replace the face in picture number 2. You can change the clothes but only one thing: don't change the hairstyle or anything about the character from picture number 1. Keep the same face of the person from picture one, don't change anything about their skin or face. Change the position of the person to make the picture look natural and well composed. Picture 1 is the user's face photo. Picture 2 is the template/background image. Create the final image with the face from picture 1 placed onto picture 2's scene/pose.`

export default function AdminSettings() {
  const { session } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [testingApi, setTestingApi] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<string | null>(null)
  const [promptCharCount, setPromptCharCount] = useState(0)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('admin_settings')
      .select('key, value')
      .order('key')

    const map: Record<string, string> = {}
    for (const row of data || []) {
      map[row.key] = row.value || ''
    }
    setSettings(map)
    setPromptCharCount((map.face_swap_prompt || '').length)
    setLoading(false)
  }

  const saveSetting = async (key: string, value: string) => {
    setSavingKey(key)
    try {
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: { email: session?.email, key, value },
      })
      if (error || !data?.success) throw new Error('Save failed')
      setSettings((prev) => ({ ...prev, [key]: value }))
      toast({ title: 'Saved', description: `${key.replace(/_/g, ' ')} updated.` })
    } catch {
      toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' })
    } finally {
      setSavingKey(null)
    }
  }

  const testApiConnection = async () => {
    setTestingApi(true)
    setTestResult(null)
    try {
      const apiKey = settings.api_key
      if (!apiKey) {
        setTestResult('error')
        toast({ title: 'No API Key', description: 'Enter an API key first.', variant: 'destructive' })
        return
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )
      if (res.ok) {
        setTestResult('success')
        toast({ title: 'API Working', description: 'Connection successful.' })
      } else {
        setTestResult('error')
        toast({ title: 'API Error', description: 'Invalid key or connection failed.', variant: 'destructive' })
      }
    } catch {
      setTestResult('error')
    } finally {
      setTestingApi(false)
    }
  }

  const currentPrompt = editedPrompt ?? settings.face_swap_prompt ?? ''
  const promptChanged = editedPrompt !== null && editedPrompt !== (settings.face_swap_prompt ?? '')

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-soft-gray" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ═══ 1. MODEL CONFIGURATION ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Settings className="w-5 h-5 text-purple" />
            <h2 className="text-lg font-black text-foreground">Model Configuration</h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5 space-y-5">
            {/* NNN v1 */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">NNN v1 Model</label>
              <input
                type="text"
                value={settings.model_nnn1 || 'gemini-3.1-flash-lite-preview'}
                onChange={(e) => setSettings((p) => ({ ...p, model_nnn1: e.target.value }))}
                placeholder="gemini-3.1-flash-lite-preview"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm font-mono focus:outline-none focus:border-purple/40 transition-colors"
              />
            </div>

            {/* NNN v1 Pro */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">NNN v1 Pro Model</label>
              <input
                type="text"
                value={settings.model_nnn1_pro || 'gemini-3.1-flash-image-preview'}
                onChange={(e) => setSettings((p) => ({ ...p, model_nnn1_pro: e.target.value }))}
                placeholder="gemini-3.1-flash-image-preview"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm font-mono focus:outline-none focus:border-purple/40 transition-colors"
              />
            </div>

            {/* NNN v1 Pro Max */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">NNN v1 Pro Max Model</label>
              <input
                type="text"
                value={settings.model_nnn1_pro_max || 'gemini-3.1-pro-preview'}
                onChange={(e) => setSettings((p) => ({ ...p, model_nnn1_pro_max: e.target.value }))}
                placeholder="gemini-3.1-pro-preview"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm font-mono focus:outline-none focus:border-purple/40 transition-colors"
              />
            </div>

            {/* Save button */}
            <button
              onClick={async () => {
                await saveSetting('model_nnn1', settings.model_nnn1 || 'gemini-3.1-flash-lite-preview')
                await saveSetting('model_nnn1_pro', settings.model_nnn1_pro || 'gemini-3.1-flash-image-preview')
                await saveSetting('model_nnn1_pro_max', settings.model_nnn1_pro_max || 'gemini-3.1-pro-preview')
              }}
              disabled={savingKey !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-xs font-bold hover:bg-purple/90 transition-colors disabled:opacity-50"
            >
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Models
            </button>
          </div>
        </section>

        {/* ═══ 2. API CONFIGURATION ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Key className="w-5 h-5 text-orange" />
            <h2 className="text-lg font-black text-foreground">API Configuration</h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5 space-y-5">
            {/* API Key */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.api_key || ''}
                    onChange={(e) => setSettings((p) => ({ ...p, api_key: e.target.value }))}
                    placeholder="Enter API key..."
                    className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm font-mono focus:outline-none focus:border-orange/40 transition-colors pr-10"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-soft-gray/40 hover:text-foreground transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>


            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => saveSetting('api_key', settings.api_key || '')}
                disabled={savingKey === 'api_key'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange text-white text-xs font-bold hover:bg-orange/90 transition-colors disabled:opacity-50"
              >
                {savingKey === 'api_key' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                onClick={testApiConnection}
                disabled={testingApi || !settings.api_key}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-soft-gray text-xs font-bold hover:text-foreground hover:border-white/20 transition-colors disabled:opacity-50"
              >
                {testingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test Connection
              </button>
              {testResult === 'success' && <CheckCircle className="w-5 h-5 text-green-400 self-center" />}
              {testResult === 'error' && <XCircle className="w-5 h-5 text-red-400 self-center" />}
            </div>
          </div>
        </section>

        {/* ═══ 3. FACE SWAP PROMPT EDITOR ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <FileText className="w-5 h-5 text-purple" />
            <h2 className="text-lg font-black text-foreground">Face Swap Prompt</h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold">Prompt Editor</label>
              <div className="flex items-center gap-3">
                {promptChanged && (
                  <span className="text-[10px] text-orange font-bold">Unsaved changes</span>
                )}
                <span className="text-[10px] text-soft-gray/40 font-mono">{promptCharCount} chars</span>
              </div>
            </div>

            <textarea
              value={currentPrompt}
              onChange={(e) => {
                setEditedPrompt(e.target.value)
                setPromptCharCount(e.target.value.length)
              }}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0d0d12] text-foreground text-xs font-mono leading-relaxed focus:outline-none focus:border-purple/40 transition-colors resize-y"
              placeholder="Enter face swap prompt..."
            />

            {settings.updated_at && (
              <p className="text-[9px] text-soft-gray/30">Last updated: {new Date(settings.updated_at).toLocaleString()}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => saveSetting('face_swap_prompt', currentPrompt)}
                disabled={!promptChanged || savingKey === 'face_swap_prompt'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-xs font-bold hover:bg-purple/90 transition-colors disabled:opacity-50"
              >
                {savingKey === 'face_swap_prompt' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Prompt
              </button>
              <button
                onClick={() => {
                  setEditedPrompt(DEFAULT_PROMPT)
                  setPromptCharCount(DEFAULT_PROMPT.length)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-soft-gray text-xs font-bold hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            </div>
          </div>
        </section>

        {/* ═══ 4. CREDIT PRICING ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Sliders className="w-5 h-5 text-orange" />
            <h2 className="text-lg font-black text-foreground">Credit Pricing</h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5 space-y-5">
            <p className="text-xs text-soft-gray/60">Configure credit costs per model tier and resolution</p>
            
            {/* Pricing table */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="font-bold text-soft-gray"></div>
              <div className="font-bold text-center text-soft-gray">1K</div>
              <div className="font-bold text-center text-soft-gray">2K</div>
              <div className="font-bold text-center text-soft-gray">4K</div>

              {/* NNN v1 */}
              <div className="font-bold text-foreground py-2">NNN v1</div>
              <input type="number" min="1" value={settings.credits_nnn1_1k || '1'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1_1k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1_2k || '2'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1_2k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1_4k || '3'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1_4k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />

              {/* NNN v1 Pro */}
              <div className="font-bold text-purple py-2">NNN v1 Pro</div>
              <input type="number" min="1" value={settings.credits_nnn1pro_1k || '2'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1pro_1k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1pro_2k || '4'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1pro_2k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1pro_4k || '6'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1pro_4k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />

              {/* NNN v1 Pro Max */}
              <div className="font-bold text-orange py-2">NNN v1 Pro Max</div>
              <input type="number" min="1" value={settings.credits_nnn1promax_1k || '4'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1promax_1k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1promax_2k || '8'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1promax_2k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
              <input type="number" min="1" value={settings.credits_nnn1promax_4k || '12'} onChange={(e) => setSettings((p) => ({ ...p, credits_nnn1promax_4k: e.target.value }))} className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center text-foreground" />
            </div>

            {/* Default user credits */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Default User Credits</label>
              <input
                type="number"
                value={settings.default_user_credits || '50'}
                onChange={(e) => setSettings((p) => ({ ...p, default_user_credits: e.target.value }))}
                min={1}
                max={1000}
                className="w-32 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm focus:outline-none focus:border-orange/40"
              />
            </div>

            {/* Save button */}
            <button
              onClick={async () => {
                const keys = ['credits_nnn1_1k', 'credits_nnn1_2k', 'credits_nnn1_4k', 'credits_nnn1pro_1k', 'credits_nnn1pro_2k', 'credits_nnn1pro_4k', 'credits_nnn1promax_1k', 'credits_nnn1promax_2k', 'credits_nnn1promax_4k', 'default_user_credits']
                for (const key of keys) {
                  await saveSetting(key, settings[key] || '1')
                }
              }}
              disabled={savingKey !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange text-white text-xs font-bold hover:bg-orange/90 transition-colors disabled:opacity-50"
            >
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Pricing
            </button>
          </div>
        </section>

        {/* ═══ 5. TOOL SETTINGS ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Sliders className="w-5 h-5 text-orange" />
            <h2 className="text-lg font-black text-foreground">Tool Settings</h2>
          </div>

          <div className="rounded-xl border border-white/5 bg-card p-5 space-y-5">
            {/* Default resolution */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Default Resolution</label>
              <div className="flex gap-2">
                {['1K', '2K', '4K'].map((res) => (
                  <button
                    key={res}
                    onClick={() => setSettings((p) => ({ ...p, default_resolution: res }))}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      (settings.default_resolution || '1K') === res
                        ? 'bg-orange text-white'
                        : 'bg-white/5 text-soft-gray hover:bg-white/10'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Max file size */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Max File Size (MB)</label>
              <input
                type="number"
                value={settings.max_file_size || '10'}
                onChange={(e) => setSettings((p) => ({ ...p, max_file_size: e.target.value }))}
                min={1}
                max={50}
                className="w-32 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm focus:outline-none focus:border-orange/40"
              />
            </div>

            {/* Credits per generation */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Credits per Generation</label>
              <input
                type="number"
                value={settings.credits_per_generation || '1'}
                onChange={(e) => setSettings((p) => ({ ...p, credits_per_generation: e.target.value }))}
                min={1}
                max={10}
                className="w-32 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-foreground text-sm focus:outline-none focus:border-orange/40"
              />
            </div>

            {/* Save button */}
            <button
              onClick={async () => {
                await saveSetting('default_resolution', settings.default_resolution || '1K')
                await saveSetting('max_file_size', settings.max_file_size || '10')
                await saveSetting('credits_per_generation', settings.credits_per_generation || '1')
              }}
              disabled={savingKey !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange text-white text-xs font-bold hover:bg-orange/90 transition-colors disabled:opacity-50"
            >
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Settings
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

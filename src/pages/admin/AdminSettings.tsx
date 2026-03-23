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

        {/* ═══ 1. API CONFIGURATION ═══ */}
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

            {/* Model name (read only) */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[2px] text-soft-gray font-bold block">Model</label>
              <div className="px-3 py-2.5 rounded-lg border border-white/5 bg-white/[0.01] text-foreground text-sm flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/20 text-purple">NNN v1</span>
                <span className="text-soft-gray/40 text-xs">(Read only)</span>
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

        {/* ═══ 2. FACE SWAP PROMPT EDITOR ═══ */}
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

        {/* ═══ 3. TOOL SETTINGS ═══ */}
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

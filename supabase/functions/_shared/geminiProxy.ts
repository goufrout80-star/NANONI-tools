// Shared Gemini API proxy — routes through Cloudflare Worker when available
// to bypass Gemini geo-restriction in eu-west-3 (Paris).
// Falls back to direct Gemini endpoints if no proxy is configured.

export interface GeminiResult {
  images: string[]
  geoBlocked: boolean
  error?: string
}

function isGeoBlockedMessage(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('not available in your country') ||
    m.includes('location is not supported') ||
    m.includes('user location is not supported') ||
    m.includes('not supported in your country')
  )
}

function extractImages(parsed: any): string[] {
  const images: string[] = []
  const chunks = Array.isArray(parsed) ? parsed : [parsed]
  for (const chunk of chunks) {
    for (const candidate of chunk.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) images.push(part.inlineData.data)
        else if (part.inline_data?.data) images.push(part.inline_data.data)
      }
    }
  }
  return images
}

async function tryEndpoint(url: string, body: object, label: string): Promise<{
  images: string[]
  geoBlocked: boolean
  error?: string
  ok: boolean
}> {
  let res: Response
  let rawText: string

  try {
    console.log(`[geminiProxy] Trying: ${label}`)
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    rawText = await res.text()
  } catch (fetchErr: any) {
    console.error(`[geminiProxy] Fetch error on ${label}:`, fetchErr.message)
    return { images: [], geoBlocked: false, error: fetchErr.message, ok: false }
  }

  let parsed: any
  try {
    parsed = JSON.parse(rawText)
  } catch {
    console.error(`[geminiProxy] JSON parse failed on ${label}:`, rawText.slice(0, 200))
    return { images: [], geoBlocked: false, error: 'Invalid JSON response', ok: false }
  }

  const chunks = Array.isArray(parsed) ? parsed : [parsed]
  const firstError = chunks[0]?.error
  if (firstError) {
    const msg: string = firstError.message || String(firstError)
    console.error(`[geminiProxy] API error on ${label}:`, msg)
    if (isGeoBlockedMessage(msg)) {
      return { images: [], geoBlocked: true, error: msg, ok: false }
    }
    return { images: [], geoBlocked: false, error: msg, ok: false }
  }

  if (!res.ok) {
    console.error(`[geminiProxy] HTTP ${res.status} on ${label}`)
    return { images: [], geoBlocked: false, error: `HTTP ${res.status}`, ok: false }
  }

  const images = extractImages(parsed)
  console.log(`[geminiProxy] Success on ${label} — ${images.length} image(s)`)
  return { images, geoBlocked: false, ok: true }
}

export async function callGeminiStream(
  apiKey: string,
  model: string,
  body: object
): Promise<GeminiResult> {

  // ── Route 1: Cloudflare Worker proxy (bypasses EU geo-block) ──
  // Set GEMINI_PROXY_URL = https://gemini-proxy.YOUR-SUBDOMAIN.workers.dev
  const proxyUrl = Deno.env.get('GEMINI_PROXY_URL')
  if (proxyUrl) {
    const url = `${proxyUrl}?model=${encodeURIComponent(model)}&key=${encodeURIComponent(apiKey)}`
    const result = await tryEndpoint(url, body, 'Cloudflare Worker proxy')
    if (result.ok) return { images: result.images, geoBlocked: false }
    if (!result.geoBlocked && result.error) {
      // Non-geo error from proxy — surface it
      console.error('[geminiProxy] Proxy returned non-geo error:', result.error)
    }
    console.warn('[geminiProxy] Proxy failed, falling back to direct endpoints')
  }

  // ── Route 2: Direct Gemini endpoints (fallback) ──
  // generateContent (non-streaming) is more reliable for image gen
  const directEndpoints = [
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      label: `v1beta/generateContent (${model})`,
    },
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
      label: `v1beta/streamGenerateContent (${model})`,
    },
  ]

  for (const { url, label } of directEndpoints) {
    const result = await tryEndpoint(url, body, label)
    if (result.ok) return { images: result.images, geoBlocked: false }
    if (result.geoBlocked) {
      console.warn('[geminiProxy] GEO_BLOCKED on direct endpoint, trying next...')
      continue
    }
    if (result.error) {
      // Non-geo API error (bad key, bad model, etc.) — no point retrying
      return { images: [], geoBlocked: false, error: result.error }
    }
  }

  // All routes exhausted
  console.error('[geminiProxy] All routes failed — GEO_BLOCKED')
  return {
    images: [],
    geoBlocked: true,
    error: 'Gemini image generation is blocked in this server region (eu-west-3 Paris). Set GEMINI_PROXY_URL to a Cloudflare Worker to fix this.',
  }
}

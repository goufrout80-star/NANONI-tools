/**
 * Cloudflare Worker — Gemini API Proxy
 * Bypasses Gemini image generation geo-restriction in eu-west-3 (Paris).
 * Cloudflare Workers run on global edge (US/EU-West), which is allowed.
 *
 * Deploy at: https://workers.cloudflare.com
 * Worker name: gemini-proxy
 *
 * After deploy, note your worker URL:
 *   https://gemini-proxy.YOUR-SUBDOMAIN.workers.dev
 *
 * Then set this Supabase secret:
 *   npx supabase secrets set GEMINI_PROXY_URL=https://gemini-proxy.YOUR-SUBDOMAIN.workers.dev --project-ref mtyjgrgldlpglzmqyucw
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const url = new URL(request.url)
      const model = url.searchParams.get('model') || 'gemini-2.0-flash-preview-image-generation'
      const apiKey = url.searchParams.get('key')

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing API key' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      const body = await request.text()

      // Forward to Gemini generateContent (non-streaming, more reliable for images)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const responseText = await geminiResponse.text()

      return new Response(responseText, {
        status: geminiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Worker error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}

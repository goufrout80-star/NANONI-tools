import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGeminiStream } from '../_shared/geminiProxy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_PROMPT = 'Generate an image based on this description:'

// ═══ CREDIT COST CALCULATOR ═══
function getCreditCost(modelTier: string, resolution: string): number {
  const costs: Record<string, Record<string, number>> = {
    nnn1:        { '1K': 3,  '2K': 5,  '4K': 8  },
    nnn1_pro:    { '1K': 6,  '2K': 10, '4K': 16 },
    nnn1_pro_max:{ '1K': 12, '2K': 20, '4K': 32 },
  }
  return costs[modelTier]?.[resolution] ?? 3
}

// ═══ HELPER: Prepare Image Base64 ═══
async function prepareImageBase64(input: string): Promise<string> {
  if (!input) throw new Error('Empty image input')

  if (input.startsWith('data:')) {
    return input.split(',')[1]
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    const res = await fetch(input)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    return btoa(binary)
  }

  return input
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const rawBody = await req.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const {
      email,
      prompt,
      referenceImages = [],
      resolution = '1K',
      aspectRatio,
      modelTier = 'nnn1',
    } = body

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing email', field: 'email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt', field: 'prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // Verify user
    const { data: user } = await supabase
      .from('waitlist_submissions')
      .select('credits, approved')
      .eq('email', cleanEmail)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const creditCost = getCreditCost(modelTier, resolution)

    if ((user.credits ?? 0) < creditCost) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Need ${creditCost}, have ${user.credits ?? 0}.`, creditsLeft: user.credits ?? 0 }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct credits
    const newCredits = (user.credits ?? creditCost) - creditCost
    await supabase
      .from('waitlist_submissions')
      .update({ credits: newCredits })
      .eq('email', cleanEmail)

    // Log usage
    await supabase.from('tool_usage').insert({
      email: cleanEmail,
      tool_name: 'ai_generate',
      credits_used: creditCost,
    })

    // Create history record
    const { data: historyRecord } = await supabase
      .from('generation_history')
      .insert({
        email: cleanEmail,
        tool_name: 'ai_generate',
        resolution,
        status: 'processing',
        credits_used: creditCost,
      })
      .select('id')
      .single()

    const historyId = historyRecord?.id

    // Get API key
    const { data: apiKeySetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_key')
      .single()

    const apiKey = apiKeySetting?.value || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'failed', error_message: 'API key not configured.' }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({ error: 'API key not configured.', refunded: true, creditsLeft: newCredits + creditCost }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get base prompt from admin_settings
    const { data: promptSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'ai_generate_prompt')
      .single()

    const basePrompt = promptSetting?.value || DEFAULT_PROMPT

    // Get model
    const modelKeyMap: Record<string, string> = {
      nnn1: 'model_nnn1',
      nnn1_pro: 'model_nnn1_pro',
      nnn1_pro_max: 'model_nnn1_pro_max'
    }
    const modelKey = modelKeyMap[modelTier] || 'model_nnn1_pro'
    const { data: modelSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', modelKey)
      .single()

    const model = modelSetting?.value || 'gemini-3.1-flash-image-preview'
    const sizeMap: Record<string, string> = { '1k': '1K', '2k': '2K', '4k': '4K', '1K': '1K', '2K': '2K', '4K': '4K' }
    const imageSize = sizeMap[resolution] || '1K'

    // Build Gemini parts
    const parts: any[] = []

    // Add reference images if provided
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      parts.push({ text: `Here are ${referenceImages.length} reference image(s) for style guidance:` })
      for (const refImg of referenceImages) {
        try {
          const refBase64 = await prepareImageBase64(refImg)
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: refBase64,
            }
          })
        } catch (err) {
          console.warn('Skipping reference image:', err)
        }
      }
    }

    // Build full prompt
    let fullPrompt = `${basePrompt}\n\n${prompt.trim()}`
    if (aspectRatio) {
      fullPrompt += `\n\nOutput aspect ratio: ${aspectRatio}.`
    }
    parts.push({ text: fullPrompt })

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize,
        },
      },
    }

    const geminiResult = await callGeminiStream(apiKey, model, geminiBody)

    if (geminiResult.geoBlocked) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'refunded', error_message: 'GEO_BLOCKED' }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable in this region. Our team has been notified.',
          errorCode: 'GEO_BLOCKED',
          refunded: true,
          creditsLeft: newCredits + creditCost,
        }),
        { status: 451, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (geminiResult.error && geminiResult.images.length === 0) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'refunded', error_message: geminiResult.error }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({ error: `Generation failed. ${creditCost} credits refunded.`, refunded: true, creditsLeft: newCredits + creditCost }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const images = geminiResult.images

    if (images.length === 0) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'refunded', error_message: 'No image generated' }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({ error: `No image generated. ${creditCost} credits refunded.`, refunded: true, creditsLeft: newCredits + creditCost }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload result to storage
    const resultId = crypto.randomUUID()
    const resultPath = `results/${cleanEmail}/${resultId}.png`

    const binaryStr = atob(images[0])
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    await supabase.storage
      .from('nanoni-assets')
      .upload(resultPath, bytes, {
        contentType: 'image/png',
        upsert: false,
      })

    // Update history
    if (historyId) {
      await supabase
        .from('generation_history')
        .update({ status: 'completed', result_path: resultPath })
        .eq('id', historyId)
    }

    // Trim history to last 10
    const { data: allHistory } = await supabase
      .from('generation_history')
      .select('id, created_at')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })

    if (allHistory && allHistory.length > 10) {
      const toDelete = allHistory.slice(10).map((h: any) => h.id)
      await supabase.from('generation_history').delete().in('id', toDelete)
    }

    return new Response(
      JSON.stringify({
        success: true,
        images,
        resultUrl: resultPath,
        creditsLeft: newCredits,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('AI Generate error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

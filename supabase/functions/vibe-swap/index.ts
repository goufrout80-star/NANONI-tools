import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callGeminiStream } from '../_shared/geminiProxy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_VIBE_PROMPT = `IDENTITY LOCK (FROM IMAGE_1):
- Keep the person exactly the same
- Same face, same skin tone, same facial details
- Same hair style, hair length, hair color
- Same body proportions
- Do NOT change, edit, beautify, or stylize the face or skin
- Do NOT change hair in any way

POSITION & CAMERA LOCK (FROM IMAGE_1):
- Keep the exact same position of the person
- Keep the exact same pose, camera angle, framing, crop
- MAINTAIN THE EXACT ASPECT RATIO AND DIMENSIONS FROM IMAGE_1

STYLE / THEME TRANSFER (FROM IMAGE_2 ONLY):
- Apply the era, theme, mood, and atmosphere of Image_2
- Change clothing only to match the theme of Image_2
- Convert environment colors, lighting, textures, materials to match Image_2
- Replace modern elements with theme-accurate ones
- Do NOT copy pose or composition from Image_2

RESTRICTIONS (STRICT):
- NO face swap, NO pose change, NO skin change, NO hair change
- NO identity change, NO extra people, NO text or logos or watermarks

OUTPUT:
- Ultra-realistic, cinematic render
- MUST match Image_1 aspect ratio exactly
- Image_1 photographed in the world, era, and style of Image_2`

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

  // raw base64
  return input
}

// ═══ HELPER: Detect aspect ratio from base64 image ═══
function detectAspectRatio(base64Data: string): string {
  try {
    // Decode enough bytes to read image dimensions
    const binary = atob(base64Data.slice(0, 1024))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    let width = 0
    let height = 0

    // JPEG: FF D8
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      // Scan for SOF markers (FF C0, FF C1, FF C2)
      const fullBinary = atob(base64Data.slice(0, 8192))
      const fullBytes = new Uint8Array(fullBinary.length)
      for (let i = 0; i < fullBinary.length; i++) fullBytes[i] = fullBinary.charCodeAt(i)
      for (let i = 0; i < fullBytes.length - 8; i++) {
        if (fullBytes[i] === 0xFF && (fullBytes[i+1] === 0xC0 || fullBytes[i+1] === 0xC1 || fullBytes[i+1] === 0xC2)) {
          height = (fullBytes[i+5] << 8) | fullBytes[i+6]
          width = (fullBytes[i+7] << 8) | fullBytes[i+8]
          break
        }
      }
    }
    // PNG: 89 50 4E 47
    else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]
      height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
    }

    if (width > 0 && height > 0) {
      const ratio = width / height
      if (ratio > 1.7) return '16:9'
      if (ratio > 1.4) return '4:3'
      if (ratio > 1.1) return '3:2'
      if (ratio > 0.95) return '1:1'
      if (ratio > 0.7) return '4:5'
      if (ratio > 0.6) return '3:4'
      if (ratio > 0.5) return '2:3'
      return '9:16'
    }
  } catch (e) {
    console.warn('Aspect ratio detection failed:', e)
  }
  return '1:1' // safe default
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
      userPhotoBase64,
      templateImageBase64,
      templateUrl,
      userMime,
      templateMime,
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

    if (!userPhotoBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing user photo', field: 'userPhotoBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!templateImageBase64 && !templateUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing template image', field: 'templateImageBase64' }),
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
      tool_name: 'vibe_swap',
      credits_used: creditCost,
    })

    // Create history record
    const { data: historyRecord } = await supabase
      .from('generation_history')
      .insert({
        email: cleanEmail,
        tool_name: 'vibe_swap',
        resolution,
        status: 'processing',
        credits_used: creditCost,
      })
      .select('id')
      .single()

    const historyId = historyRecord?.id

    // Prepare user photo
    let userClean: string
    try {
      userClean = await prepareImageBase64(userPhotoBase64)
    } catch (err: any) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'failed', error_message: `User photo error: ${err.message}` }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({ error: `User photo error: ${err.message}`, refunded: true, creditsLeft: newCredits + creditCost }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare template image
    let templateClean: string
    try {
      const templateSource = templateImageBase64 || templateUrl
      templateClean = await prepareImageBase64(templateSource)
    } catch (err: any) {
      await supabase.from('waitlist_submissions').update({ credits: newCredits + creditCost }).eq('email', cleanEmail)
      if (historyId) {
        await supabase.from('generation_history').update({ status: 'failed', error_message: `Template image error: ${err.message}` }).eq('id', historyId)
      }
      return new Response(
        JSON.stringify({ error: `Template image error: ${err.message}`, refunded: true, creditsLeft: newCredits + creditCost }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Get vibe swap prompt from admin_settings
    const { data: promptSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'vibe_swap_prompt')
      .single()

    const basePrompt = promptSetting?.value || DEFAULT_VIBE_PROMPT

    // Auto-detect aspect ratio from user's photo if not provided
    let finalAspectRatio = aspectRatio
    if (!finalAspectRatio || finalAspectRatio === 'auto' || finalAspectRatio === '') {
      finalAspectRatio = detectAspectRatio(userClean)
      console.log('Auto-detected aspect ratio:', finalAspectRatio)
    }

    // Build prompt
    let fullPrompt = basePrompt
    if (finalAspectRatio) {
      fullPrompt += `\n\nGenerate the output image with aspect ratio ${finalAspectRatio}.`
    }

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

    const userMimeType = userMime || 'image/jpeg'
    const templateMimeType = templateMime || 'image/jpeg'

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Image_1 (User's photo - preserve identity, pose, position):" },
            { inlineData: { mimeType: userMimeType, data: userClean } },
            { text: 'Image_2 (Theme/Style reference - extract style only):' },
            { inlineData: { mimeType: templateMimeType, data: templateClean } },
            { text: fullPrompt },
          ],
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
        detectedAspectRatio: finalAspectRatio,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Vibe swap error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

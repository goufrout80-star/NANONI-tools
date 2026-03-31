import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SWAP_MODE_SUFFIXES: Record<string, string> = {
  default: '',
  face_only: `\n\nSWAP MODE: FACE ONLY
- Replace ONLY the inner facial features (eyes, nose, mouth, jawline, cheeks, skin) with the user's face.
- Keep the template's EXACT hair style, hair color, hair length, head shape, and ears completely unchanged.
- The hair, forehead shape, and head silhouette must remain 100% from the template.
- Only the face region (from hairline to chin, between the ears) should change to match the user.`,
  head_swap: `\n\nSWAP MODE: HEAD SWAP
- Replace the ENTIRE head (face + hair + head shape) with the user's head from Picture 1.
- Take the user's face, hair style, hair color, and head shape and place them onto the template body.
- If the template is an illustration, vector art, or cartoon style, render the user's head in that SAME art style while keeping it recognizable as the user.
- Match the art style, line work, colors, and rendering technique of the template — but the head identity (face + hair) comes from the user.
- Keep the template's body, clothing, pose, background, and composition unchanged.`,
  exact_face: `\n\nSWAP MODE: EXACT FACE
- Take ONLY the facial features from the user's face in Picture 1 and place them into the template.
- The face must be placed in the EXACT same position, angle, tilt, and pose as the template face.
- Keep the template's EXACT hair style, hair color, hair design, hair length, and hair flow.
- If the template has accessories on the head — KEEP them exactly as they are.
- If the template is a non-photographic style, the swapped face MUST be rendered in that EXACT SAME style.
- Match the template's EXACT art style, color palette, lighting, and rendering.`,
  face_hair: `\n\nSWAP MODE: FACE & HAIR
- Take the facial features AND the hair style and hair color from the user in Picture 1 and place them into the template.
- The face and hair must be placed in the EXACT same position, angle, tilt, and pose as the template.
- If the template has accessories on the head — KEEP them exactly as they are.
- Do NOT bring any accessories from the person's photo — only the face and hair.
- Keep all clothing, body, background, and composition from the template unchanged.
- If the template is a non-photographic style, the swapped face and hair MUST be rendered in that EXACT SAME style.`,
}

const DEFAULT_PROMPT = `Make the person's face from picture number 1 replace the face in picture number 2. You can change the clothes but only one thing: don't change the hairstyle or anything about the character from picture number 1. Keep the same face of the person from picture one, don't change anything about their skin or face. Change the position of the person to make the picture look natural and well composed. Picture 1 is the user's face photo. Picture 2 is the template/background image. Create the final image with the face from picture 1 placed onto picture 2's scene/pose.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    // Add detailed logging for debugging
    console.log('Received body:', 
      JSON.stringify({
        hasEmail: !!body.email,
        hasSource: !!body.sourceImageBase64,
        hasTarget: !!body.targetImageBase64,
        hasTemplatePath: !!body.targetTemplatePath,
        resolution: body.resolution,
        swapMode: body.swapMode,
        aspectRatio: body.aspectRatio
      })
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      email,
      sourceImageBase64,
      targetImageBase64,
      targetTemplatePath,
      sourceMime,
      targetMime,
      resolution = '1K',
      aspectRatio,
      swapMode = 'default',
    } = body

    const targetImage = targetImageBase64 
      || targetTemplatePath

    if (!email || !sourceImageBase64 
        || !targetImage) {
      console.error('Missing fields:', {
        email: !!email,
        source: !!sourceImageBase64,
        target: !!targetImage
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            email: !email ? 'missing' : 'ok',
            source: !sourceImageBase64 
              ? 'missing' : 'ok',
            target: !targetImage ? 'missing' : 'ok'
          }
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // Verify user exists and is approved
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

    if ((user.credits ?? 0) <= 0) {
      return new Response(
        JSON.stringify({ error: 'No credits remaining.', creditsLeft: 0 }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct 1 credit immediately
    const newCredits = (user.credits ?? 1) - 1
    await supabase
      .from('waitlist_submissions')
      .update({ credits: newCredits })
      .eq('email', cleanEmail)

    // Log usage
    await supabase.from('tool_usage').insert({
      email: cleanEmail,
      tool_name: 'face_swap',
      credits_used: 1,
    })

    // Create generation history record
    const { data: historyRecord } = await supabase
      .from('generation_history')
      .insert({
        email: cleanEmail,
        tool_name: 'face_swap',
        resolution,
        status: 'processing',
        credits_used: 1,
      })
      .select('id')
      .single()

    const historyId = historyRecord?.id

    // Get target image - either from base64 or storage path
    let targetImage = targetImageBase64
    let targetMimeType = targetMime || 'image/jpeg'

    if (!targetImage && targetTemplatePath) {
      // Download from Supabase Storage
      const { data: fileData } = await supabase.storage
        .from('nanoni-assets')
        .download(targetTemplatePath)

      if (fileData) {
        const buffer = await fileData.arrayBuffer()
        targetImage = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        targetMimeType = fileData.type || 'image/jpeg'
      }
    }

    if (!targetImage) {
      // Refund credit
      await supabase
        .from('waitlist_submissions')
        .update({ credits: newCredits + 1 })
        .eq('email', cleanEmail)

      if (historyId) {
        await supabase
          .from('generation_history')
          .update({ status: 'failed', error_message: 'No target image provided.' })
          .eq('id', historyId)
      }

      return new Response(
        JSON.stringify({ error: 'No target image provided.', refunded: true, creditsLeft: newCredits + 1 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get API key from admin_settings
    const { data: apiKeySetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_key')
      .single()

    const apiKey = apiKeySetting?.value || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      // Refund
      await supabase
        .from('waitlist_submissions')
        .update({ credits: newCredits + 1 })
        .eq('email', cleanEmail)

      if (historyId) {
        await supabase
          .from('generation_history')
          .update({ status: 'failed', error_message: 'API key not configured.' })
          .eq('id', historyId)
      }

      return new Response(
        JSON.stringify({ error: 'API key not configured.', refunded: true, creditsLeft: newCredits + 1 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompt from admin_settings
    const { data: promptSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'face_swap_prompt')
      .single()

    const basePrompt = promptSetting?.value || DEFAULT_PROMPT
    const suffix = SWAP_MODE_SUFFIXES[swapMode] || ''
    let fullPrompt = basePrompt + suffix

    if (aspectRatio) {
      fullPrompt += `\n\nGenerate the output image with aspect ratio ${aspectRatio}.`
    }

    // Map resolution
    const sizeMap: Record<string, string> = { '1K': '1K', '2K': '2K', '4K': '4K' }
    const imageSize = sizeMap[resolution] || '1K'

    // Call Gemini API
    const model = 'gemini-3.1-flash-image-preview'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Picture 1 (User\'s face):' },
            {
              inlineData: {
                mimeType: sourceMime || 'image/jpeg',
                data: sourceImageBase64,
              },
            },
            { text: 'Picture 2 (Template/Background):' },
            {
              inlineData: {
                mimeType: targetMimeType,
                data: targetImage,
              },
            },
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

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', errText)

      // Refund credit on API error
      await supabase
        .from('waitlist_submissions')
        .update({ credits: newCredits + 1 })
        .eq('email', cleanEmail)

      if (historyId) {
        await supabase
          .from('generation_history')
          .update({ status: 'failed', error_message: 'AI model error' })
          .eq('id', historyId)
      }

      return new Response(
        JSON.stringify({ error: 'AI model error. Please try again.', refunded: true, creditsLeft: newCredits + 1 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse streaming response
    const geminiData = await geminiRes.json()
    const images: string[] = []
    const chunks = Array.isArray(geminiData) ? geminiData : [geminiData]

    for (const chunk of chunks) {
      const candidates = chunk.candidates || []
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || []
        for (const part of parts) {
          if (part.inlineData?.data) {
            images.push(part.inlineData.data)
          } else if (part.inline_data?.data) {
            images.push(part.inline_data.data)
          }
        }
      }
    }

    if (images.length === 0) {
      // Refund credit - no image generated
      await supabase
        .from('waitlist_submissions')
        .update({ credits: newCredits + 1 })
        .eq('email', cleanEmail)

      if (historyId) {
        await supabase
          .from('generation_history')
          .update({ status: 'failed', error_message: 'No image generated' })
          .eq('id', historyId)
      }

      return new Response(
        JSON.stringify({ error: 'No image generated. Try different photos.', refunded: true, creditsLeft: newCredits + 1 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload result to storage
    const resultId = crypto.randomUUID()
    const resultPath = `results/${cleanEmail}/${resultId}.png`

    // Decode base64 and upload
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

    // Update generation history
    if (historyId) {
      await supabase
        .from('generation_history')
        .update({
          status: 'completed',
          result_path: resultPath,
        })
        .eq('id', historyId)
    }

    // Keep only last 10 history records per user
    const { data: allHistory } = await supabase
      .from('generation_history')
      .select('id, created_at')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })

    if (allHistory && allHistory.length > 10) {
      const toDelete = allHistory.slice(10).map((h: any) => h.id)
      await supabase
        .from('generation_history')
        .delete()
        .in('id', toDelete)
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
    console.error('Face swap error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

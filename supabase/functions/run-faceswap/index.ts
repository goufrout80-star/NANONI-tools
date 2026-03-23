import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SWAP_MODE_SUFFIXES: Record<string, string> = {
  default: '',
  face_only: '\n\nIMPORTANT: Only swap the face. Keep the original hair, ears, neck, and everything else from the template photo completely unchanged.',
  head_swap: '\n\nIMPORTANT: Replace the entire head region including hair and ears. Blend naturally at the neck/shoulders.',
  exact_face: '\n\nIMPORTANT: Transfer exact facial features with precise detail. Maintain exact skin texture, moles, wrinkles, and facial proportions from the person photo.',
  face_hair: '\n\nIMPORTANT: Swap both the face AND hairstyle from the person photo onto the template. The hair color, style, and length should match the person photo.',
}

const DEFAULT_PROMPT = `{
  "task": "universal_identity_preserving_face_swap",
  "description": "Place the exact face from picture_1 onto the body, pose, and scene of picture_2 while preserving the full identity of picture_1. The result must look natural, realistic, and well composed for any gender, age, or cultural appearance.",
  "inputs": {
    "picture_1": {
      "role": "identity_source",
      "instruction": "This image provides the face identity. Preserve facial structure, skin tone, skin texture, pores, eye shape, nose, lips, jawline, expression, and hairstyle exactly as-is."
    },
    "picture_2": {
      "role": "scene_template",
      "instruction": "This image provides pose, body position, camera angle, environment, and background. Clothing may be adapted if needed to match the scene naturally."
    }
  },
  "identity_rules": {
    "lock_face_identity": true,
    "lock_skin_texture": true,
    "lock_skin_color": true,
    "lock_facial_features": true,
    "lock_expression": true,
    "no_face_regeneration": true,
    "no_face_morphing": true,
    "no_beautification": true,
    "no_age_change": true,
    "no_gender_change": true
  },
  "hair_and_headwear_rules": {
    "preserve_hairstyle_from_picture_1": true,
    "do_not_change_hair_shape": true,
    "do_not_change_hairline": true,
    "do_not_change_hair_texture": true,
    "do_not_change_hair_color": true,
    "if_hijab_present_in_picture_1": {
      "preserve_hijab": true,
      "no_hair_visible": true,
      "do_not_remove_or_modify_hijab": true
    }
  },
  "composition_rules": {
    "adapt_pose_from_picture_2": true,
    "adapt_body_position_from_picture_2": true,
    "adapt_camera_angle_from_picture_2": true,
    "adjust_head_alignment_naturally": true,
    "ensure_anatomical_accuracy": true
  },
  "clothing_rules": {
    "allow_clothing_change": true,
    "ensure_clothing_matches_scene": true,
    "respect_cultural_and_modesty_context": true
  },
  "output_requirements": {
    "realism_level": "photorealistic",
    "identity_match": "100_percent_picture_1",
    "lighting": "match_picture_2_environment",
    "shadows": "consistent_and_realistic",
    "edges": "clean_seamless_no_artifacts",
    "final_look": "natural_non_ai_generated"
  },
  "negative_prompt": [
    "face averaging",
    "identity drift",
    "AI generated face",
    "plastic skin",
    "beauty filter",
    "different person",
    "expression change",
    "eye shape change",
    "nose change",
    "lip change",
    "hairstyle change",
    "hair color change",
    "hijab removal",
    "uncovered head",
    "cartoon",
    "anime",
    "stylized portrait"
  ]
}`


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      templateImage,
      personImage,
      templateMime,
      personMime,
      swapMode = 'default',
      imageSize = '1K',
    } = await req.json()

    if (!templateImage || !personImage) {
      return new Response(
        JSON.stringify({ error: 'Both template and person images are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get API key from api_config table, fallback to default
    const { data: apiConfig } = await supabase
      .from('api_config')
      .select('key_value')
      .eq('key_name', 'gemini')
      .single()

    const apiKey = apiConfig?.key_value || Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please add it in Admin Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get prompt from tool_prompts table, fallback to default
    const { data: promptData } = await supabase
      .from('tool_prompts')
      .select('prompt')
      .eq('tool_name', 'face_swap')
      .single()

    const basePrompt = promptData?.prompt || DEFAULT_PROMPT

    // Append swap mode suffix
    const suffix = SWAP_MODE_SUFFIXES[swapMode] || ''
    const fullPrompt = basePrompt + suffix

    // Model: gemini-3.1-flash-image-preview (as per working example)
    const model = 'gemini-3.1-flash-image-preview'

    // Use streaming endpoint (matches the working SDK pattern)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: fullPrompt },
            {
              inlineData: {
                mimeType: templateMime || 'image/jpeg',
                data: templateImage,
              },
            },
            {
              inlineData: {
                mimeType: personMime || 'image/jpeg',
                data: personImage,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize: imageSize || '1K',
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
      return new Response(
        JSON.stringify({ error: 'AI model error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Streaming response returns an array of chunks as JSON
    const geminiData = await geminiRes.json()

    // Extract images from all streaming chunks
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
      return new Response(
        JSON.stringify({ error: 'No image generated. Try different photos.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, images }),
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

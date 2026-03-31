import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('manage-vibe-templates called')
  console.log('Method:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('SUPABASE_URL present:', !!supabaseUrl)
    console.log('SERVICE_ROLE_KEY present:', !!serviceRoleKey)

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase env variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    let body: any
    try {
      body = await req.json()
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: parseErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, email, imageBase64, imageMime, imageName, templateId } = body

    console.log('Action:', action)
    console.log('Email:', email)
    console.log('Has imageBase64:', !!imageBase64, imageBase64 ? `(length: ${imageBase64.length})` : '')
    console.log('imageMime:', imageMime)
    console.log('imageName:', imageName)
    console.log('templateId:', templateId)

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and action are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // ── LIST TEMPLATES ──
    if (action === 'list') {
      console.log('Listing templates for:', cleanEmail)
      const { data: templates, error: listError } = await supabase
        .from('vibe_templates')
        .select('*')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false })

      if (listError) {
        console.error('List query error:', listError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch templates.', details: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Found templates:', templates?.length ?? 0)

      const templatesWithUrls = []
      for (const t of templates || []) {
        if (t.storage_path) {
          const { data: urlData } = await supabase.storage
            .from('nanoni-assets')
            .createSignedUrl(t.storage_path, 3600)
          templatesWithUrls.push({ ...t, url: urlData?.signedUrl || t.cloudinary_url || null })
        } else {
          templatesWithUrls.push({ ...t, url: t.cloudinary_url || null })
        }
      }

      console.log('Returning templates with URLs:', templatesWithUrls.length)
      return new Response(
        JSON.stringify({ success: true, templates: templatesWithUrls }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── UPLOAD TEMPLATE ──
    if (action === 'upload') {
      console.log('Upload action started')
      if (!imageBase64) {
        console.error('Upload: imageBase64 is missing')
        return new Response(
          JSON.stringify({ error: 'No image provided.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check limit (max 10)
      const { count } = await supabase
        .from('vibe_templates')
        .select('*', { count: 'exact', head: true })
        .eq('email', cleanEmail)

      if ((count ?? 0) >= 10) {
        return new Response(
          JSON.stringify({ error: 'Maximum 10 vibe templates allowed. Delete one first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upload to storage
      const fileId = crypto.randomUUID()
      const ext = (imageMime || 'image/jpeg').includes('png') ? 'png' : 'jpg'
      const storagePath = `vibe-templates/${cleanEmail}/${fileId}.${ext}`

      const binaryStr = atob(imageBase64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      console.log('Uploading to storage path:', storagePath)
      const { error: uploadError } = await supabase.storage
        .from('nanoni-assets')
        .upload(storagePath, bytes, {
          contentType: imageMime || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', JSON.stringify(uploadError))
        return new Response(
          JSON.stringify({ error: 'Failed to upload image.', details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('Storage upload success')

      // Insert record
      const { data: template, error: insertError } = await supabase
        .from('vibe_templates')
        .insert({
          email: cleanEmail,
          name: imageName || `Vibe Template ${(count ?? 0) + 1}`,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', JSON.stringify(insertError))
        return new Response(
          JSON.stringify({ error: 'Failed to save template.', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('DB insert success, template id:', template?.id)

      const { data: urlData } = await supabase.storage
        .from('nanoni-assets')
        .createSignedUrl(storagePath, 3600)

      return new Response(
        JSON.stringify({
          success: true,
          template: { ...template, url: urlData?.signedUrl || null },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── DELETE TEMPLATE ──
    if (action === 'delete') {
      if (!templateId) {
        return new Response(
          JSON.stringify({ error: 'Missing templateId.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: template } = await supabase
        .from('vibe_templates')
        .select('*')
        .eq('id', templateId)
        .eq('email', cleanEmail)
        .single()

      if (!template) {
        return new Response(
          JSON.stringify({ error: 'Template not found.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (template.storage_path) {
        await supabase.storage.from('nanoni-assets').remove([template.storage_path])
      }

      await supabase.from('vibe_templates').delete().eq('id', templateId)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('CRASH in manage-vibe-templates:', err)
    console.error('Error message:', err?.message)
    console.error('Error stack:', err?.stack)
    return new Response(
      JSON.stringify({ error: 'Function crashed', details: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

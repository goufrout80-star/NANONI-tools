import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, email, imageBase64, imageMime, imageName, templateId } = await req.json()

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // ── GET TEMPLATES ──
    if (action === 'list') {
      const { data: templates } = await supabase
        .from('user_templates')
        .select('*')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false })

      // Generate signed URLs
      const templatesWithUrls = []
      for (const t of templates || []) {
        const { data: urlData } = await supabase.storage
          .from('nanoni-assets')
          .createSignedUrl(t.storage_path, 3600) // 1 hour

        templatesWithUrls.push({
          ...t,
          url: urlData?.signedUrl || null,
        })
      }

      return new Response(
        JSON.stringify({ success: true, templates: templatesWithUrls }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── UPLOAD TEMPLATE ──
    if (action === 'upload') {
      if (!imageBase64) {
        return new Response(
          JSON.stringify({ error: 'No image provided.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check limit (max 10)
      const { count } = await supabase
        .from('user_templates')
        .select('*', { count: 'exact', head: true })
        .eq('email', cleanEmail)

      if ((count ?? 0) >= 10) {
        return new Response(
          JSON.stringify({ error: 'Maximum 10 templates allowed. Delete one first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upload to storage
      const fileId = crypto.randomUUID()
      const ext = (imageMime || 'image/jpeg').includes('png') ? 'png' : 'jpg'
      const storagePath = `templates/${cleanEmail}/${fileId}.${ext}`

      const binaryStr = atob(imageBase64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const { error: uploadError } = await supabase.storage
        .from('nanoni-assets')
        .upload(storagePath, bytes, {
          contentType: imageMime || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to upload image.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert record
      const { data: template, error: insertError } = await supabase
        .from('user_templates')
        .insert({
          email: cleanEmail,
          name: imageName || `Template ${(count ?? 0) + 1}`,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save template.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get signed URL for the new template
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

      // Get template record
      const { data: template } = await supabase
        .from('user_templates')
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

      // Delete from storage
      await supabase.storage
        .from('nanoni-assets')
        .remove([template.storage_path])

      // Delete record
      await supabase
        .from('user_templates')
        .delete()
        .eq('id', templateId)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Manage templates error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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

    const { adminEmail } = await req.json()

    if (!adminEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing adminEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', adminEmail.toLowerCase().trim())
      .single()

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Total approved
    const { count: totalApproved } = await supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true)

    // Total pending
    const { count: totalPending } = await supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)

    // Face swap today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: faceSwapToday } = await supabase
      .from('tool_usage')
      .select('*', { count: 'exact', head: true })
      .eq('tool_name', 'face_swap')
      .gte('created_at', todayStart.toISOString())

    // Total credits used
    const { data: creditsData } = await supabase
      .from('tool_usage')
      .select('credits_used')

    const totalCreditsUsed = creditsData?.reduce((sum, row) => sum + (row.credits_used || 0), 0) || 0

    // New this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: newThisWeek } = await supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo)

    return new Response(
      JSON.stringify({
        totalApproved: totalApproved || 0,
        totalPending: totalPending || 0,
        faceSwapToday: faceSwapToday || 0,
        totalCreditsUsed,
        newThisWeek: newThisWeek || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Get admin stats error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * POST /api/brand/reply
 *
 * Posts a reply to an interaction on the original platform.
 * Called after the reply text is already saved to social_interactions.
 *
 * Body: { interaction_id: string }
 *
 * FIX (TDZ / renderer$1 error):
 *   Removed top-level `import { createClient }` — Nitro's lazy-loading phase
 *   would hit a Temporal Dead Zone before the module was fully initialised.
 *   The import is now a dynamic import() inside the handler, resolved only at
 *   request time after all modules are ready. All h3 helpers (readBody,
 *   setResponseStatus, useRuntimeConfig) remain as Nitro auto-imports.
 */

export default defineEventHandler(async (event) => {
  // ── Dynamic import: resolved at request time, safe for Nitro lazy-loading ──
  const { createClient } = await import('@supabase/supabase-js')

  if (event.node.req.method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'Method not allowed' }
  }

  const body = await readBody(event)
  const { interaction_id } = body ?? {}

  if (!interaction_id) {
    setResponseStatus(event, 400)
    return { error: 'interaction_id required' }
  }

  const runtimeConfig = useRuntimeConfig()
  const supabaseUrl   = (runtimeConfig as any).public?.supabaseUrl    ?? process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceKey    = (runtimeConfig as any).supabaseServiceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    setResponseStatus(event, 500)
    return { error: 'Server configuration error' }
  }

  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    // ── Fetch the interaction ─────────────────────────────────────
    const { data: interaction, error: intErr } = await adminClient
      .from('social_interactions')
      .select('*')
      .eq('id', interaction_id)
      .single()

    if (intErr || !interaction) {
      setResponseStatus(event, 404)
      return { error: 'Interaction not found' }
    }

    if (!interaction.our_reply) {
      setResponseStatus(event, 400)
      return { error: 'No reply text saved on this interaction' }
    }

    // ── Fetch the platform connection (access token) ──────────────
    const { data: connection, error: connErr } = await adminClient
      .from('social_connections')
      .select('*')
      .eq('profile_id', interaction.profile_id)
      .eq('platform', interaction.platform)
      .eq('connected', true)
      .maybeSingle()

    if (connErr || !connection?.access_token) {
      setResponseStatus(event, 400)
      return { error: `No active ${interaction.platform} connection found` }
    }

    // ── Post reply to platform ────────────────────────────────────
    let platformSuccess = false
    let platformError: string | null = null

    switch (interaction.platform) {
      case 'google': {
        if (!interaction.platform_ref_id) break
        const res = await fetch(
          `https://mybusiness.googleapis.com/v4/${interaction.platform_ref_id}/reply`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment: interaction.our_reply }),
          }
        )
        platformSuccess = res.ok
        if (!res.ok) platformError = await res.text()
        break
      }

      case 'facebook': {
        if (!interaction.platform_ref_id) break
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${interaction.platform_ref_id}/comments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: interaction.our_reply,
              access_token: connection.access_token,
            }),
          }
        )
        platformSuccess = res.ok
        if (!res.ok) platformError = await res.text()
        break
      }

      case 'instagram': {
        if (!interaction.platform_ref_id) break
        const res = await fetch(
          `https://graph.instagram.com/v19.0/${interaction.platform_ref_id}/replies`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: interaction.our_reply,
              access_token: connection.access_token,
            }),
          }
        )
        platformSuccess = res.ok
        if (!res.ok) platformError = await res.text()
        break
      }

      case 'yelp': {
        platformSuccess = false
        platformError   = 'Yelp does not support API review replies. Please reply manually at business.yelp.com.'
        break
      }

      default:
        platformError = `Platform '${interaction.platform}' reply not implemented`
    }

    // ── Update interaction: mark reply as sent (or log error) ─────
    await adminClient.from('social_interactions').update({
      reply_posted_to:  platformSuccess ? interaction.platform : null,
      reply_posted_at:  platformSuccess ? new Date().toISOString() : interaction.reply_posted_at,
      updated_at:       new Date().toISOString(),
    }).eq('id', interaction_id)

    if (!platformSuccess) {
      return {
        ok: false,
        saved: true,
        platform_error: platformError,
        message: 'Reply saved to database but could not post to platform.',
      }
    }

    return {
      ok: true,
      message: `Reply posted to ${interaction.platform} successfully.`,
    }

  } catch (err: any) {
    console.error('[BrandReply]', err)
    setResponseStatus(event, 500)
    return { error: err.message ?? 'Internal error' }
  }
})

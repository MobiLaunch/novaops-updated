/**
 * POST /api/brand/publish
 *
 * Publishes a social_posts row to all targeted platforms using
 * the user's stored OAuth access tokens.
 *
 * Body: { post_id: string }
 *
 * FIX (TDZ / renderer$1 error):
 *   Removed top-level `import { createClient }` — replaced with a dynamic
 *   import() inside the handler so Nitro's lazy-loading phase never encounters
 *   an uninitialised binding. All h3 helpers remain as Nitro auto-imports.
 */

interface PublishResult {
  platform: string
  ok: boolean
  platform_post_id?: string
  error?: string
}

export default defineEventHandler(async (event) => {
  // ── Dynamic import: resolved at request time, safe for Nitro lazy-loading ──
  const { createClient } = await import('@supabase/supabase-js')

  if (event.node.req.method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'Method not allowed' }
  }

  const body = await readBody(event)
  const { post_id } = body ?? {}
  if (!post_id) {
    setResponseStatus(event, 400)
    return { error: 'post_id required' }
  }

  const rc          = useRuntimeConfig()
  const supabaseUrl = (rc.public as any).supabaseUrl as string
  const serviceKey  = rc.supabaseServiceRoleKey as string

  if (!supabaseUrl || !serviceKey) {
    setResponseStatus(event, 500)
    return { error: 'Server configuration error' }
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // ── Fetch post ────────────────────────────────────────────────────────────
  const { data: post, error: postErr } = await admin
    .from('social_posts')
    .select('*')
    .eq('id', post_id)
    .single()

  if (postErr || !post) {
    setResponseStatus(event, 404)
    return { error: 'Post not found' }
  }

  // ── Fetch active connections for this user ────────────────────────────────
  const { data: connections, error: connErr } = await admin
    .from('social_connections')
    .select('*')
    .eq('profile_id', post.profile_id)
    .eq('connected', true)
    .in('platform', post.targets as string[])

  if (connErr) {
    setResponseStatus(event, 500)
    return { error: connErr.message }
  }

  const results: PublishResult[] = []
  const platformPostIds: Record<string, string> = { ...post.platform_post_ids }

  for (const conn of (connections ?? [])) {
    let result: PublishResult = { platform: conn.platform, ok: false }

    try {
      switch (conn.platform) {

        case 'facebook': {
          const pageId    = conn.platform_id
          const ptRes     = await fetch(
            `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${conn.access_token}`
          )
          const pt        = await ptRes.json()
          const pageToken = pt.access_token ?? conn.access_token

          const res  = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: post.content, access_token: pageToken }),
          })
          const data = await res.json()
          if (res.ok && data.id) {
            result = { platform: 'facebook', ok: true, platform_post_id: data.id }
            platformPostIds['facebook'] = data.id
          } else {
            result.error = data.error?.message ?? 'Facebook publish failed'
          }
          break
        }

        case 'google': {
          const locationName = conn.meta?.location_name ?? null
          if (!locationName) {
            result.error = 'No Google location linked. Re-connect Google and select a location.'
            break
          }
          const res  = await fetch(
            `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
            {
              method: 'POST',
              headers: {
                Authorization:  `Bearer ${conn.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                languageCode: 'en-US',
                summary:      post.content,
                callToAction: { actionType: 'LEARN_MORE' },
                topicType:    'STANDARD',
              }),
            }
          )
          const data = await res.json()
          if (res.ok && data.name) {
            result = { platform: 'google', ok: true, platform_post_id: data.name }
            platformPostIds['google'] = data.name
          } else {
            result.error = data.error?.message ?? 'Google publish failed'
          }
          break
        }

        case 'instagram': {
          const igUserId = conn.platform_id
          const token    = conn.meta?.long_lived_token ?? conn.access_token

          // Step 1: create media container
          const containerRes = await fetch(
            `https://graph.instagram.com/v19.0/${igUserId}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                caption:      post.content,
                media_type:   'TEXT',
                access_token: token,
              }),
            }
          )
          const container = await containerRes.json()
          if (!container.id) {
            result.error = container.error?.message ?? 'Instagram container creation failed'
            break
          }

          // Step 2: publish the container
          const publishRes = await fetch(
            `https://graph.instagram.com/v19.0/${igUserId}/media_publish`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: container.id, access_token: token }),
            }
          )
          const published = await publishRes.json()
          if (published.id) {
            result = { platform: 'instagram', ok: true, platform_post_id: published.id }
            platformPostIds['instagram'] = published.id
          } else {
            result.error = published.error?.message ?? 'Instagram publish failed'
          }
          break
        }

        case 'yelp': {
          result.error = 'Yelp does not provide a public post publishing API. Post your update manually at business.yelp.com.'
          break
        }

        default:
          result.error = `Platform '${conn.platform}' publish not implemented`
      }
    } catch (err: any) {
      result.error = err.message ?? String(err)
    }

    results.push(result)
  }

  // ── Update post record ────────────────────────────────────────────────────
  const allOk     = results.length > 0 && results.every(r => r.ok)
  const anyOk     = results.some(r => r.ok)
  const newStatus = anyOk ? 'published' : 'failed'
  const errors    = results.filter(r => !r.ok).map(r => `${r.platform}: ${r.error}`).join('; ')

  await admin.from('social_posts').update({
    status:            newStatus,
    published_at:      anyOk ? new Date().toISOString() : null,
    platform_post_ids: platformPostIds,
    error_message:     errors || null,
    updated_at:        new Date().toISOString(),
  }).eq('id', post_id)

  return { ok: anyOk, results, status: newStatus }
})

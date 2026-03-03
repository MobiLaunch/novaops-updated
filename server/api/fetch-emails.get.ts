/**
 * GET /api/fetch-emails
 *
 * Fetches both inbox and sent emails from Gmail API for the authenticated user,
 * then upserts them into the Supabase `messages` table so the Messages page
 * shows true two-way conversation threads.
 *
 * Query params:
 *   profileId  — Supabase user ID (required)
 *   maxResults — how many messages to fetch per folder (default: 50)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { profileId, maxResults = '50' } = query as Record<string, string>

  if (!profileId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing profileId' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = (config.public as any).supabaseUrl
  const serviceKey = (config as any).supabaseServiceRoleKey

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, synced: 0, error: 'Supabase service key not configured' }
  }

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(supabaseUrl, serviceKey)

  // ── 1. Get Gmail OAuth tokens ────────────────────────────────────────
  const { data: conn, error: connErr } = await admin
    .from('social_connections')
    .select('access_token, refresh_token, token_expires_at, handle')
    .eq('profile_id', profileId)
    .eq('platform', 'gmail')
    .eq('connected', true)
    .maybeSingle()

  if (connErr || !conn?.access_token) {
    return { ok: false, synced: 0, error: 'Gmail not connected' }
  }

  // ── 2. Refresh token if expired ──────────────────────────────────────
  let accessToken = conn.access_token
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.refresh_token) {
    try {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: (config as any).googleClientId || '',
          client_secret: (config as any).googleClientSecret || '',
          refresh_token: conn.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      const refreshData = await refreshRes.json()
      if (refreshData.access_token) {
        accessToken = refreshData.access_token
        await admin.from('social_connections').update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString(),
        }).eq('profile_id', profileId).eq('platform', 'gmail')
      }
    } catch { /* use existing token */ }
  }

  const gmailHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  // ── 3. Helper: fetch message detail ─────────────────────────────────
  async function fetchMessageDetail(msgId: string) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
      { headers: gmailHeaders }
    )
    if (!res.ok) return null
    return res.json()
  }

  function decodeBase64(data: string) {
    try {
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    } catch { return '' }
  }

  function extractBody(payload: any): string {
    if (!payload) return ''
    // Direct body
    if (payload.body?.data) return decodeBase64(payload.body.data)
    // Multipart — prefer text/plain, fallback to text/html
    if (payload.parts) {
      const plain = payload.parts.find((p: any) => p.mimeType === 'text/plain')
      if (plain?.body?.data) return decodeBase64(plain.body.data)
      const html = payload.parts.find((p: any) => p.mimeType === 'text/html')
      if (html?.body?.data) {
        // Strip HTML tags for plain text display
        return decodeBase64(html.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
      // Recurse into nested parts
      for (const part of payload.parts) {
        const nested = extractBody(part)
        if (nested) return nested
      }
    }
    return ''
  }

  function getHeader(headers: any[], name: string) {
    return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  }

  // ── 4. Fetch and sync messages from a Gmail label ───────────────────
  async function syncLabel(label: 'INBOX' | 'SENT', direction: 'inbound' | 'outbound') {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${label}&maxResults=${maxResults}`,
      { headers: gmailHeaders }
    )
    if (!listRes.ok) return 0

    const listData = await listRes.json()
    const msgList: any[] = listData.messages || []
    let synced = 0

    for (const { id } of msgList) {
      const msg = await fetchMessageDetail(id)
      if (!msg?.payload) continue

      const headers = msg.payload.headers || []
      const subject = getHeader(headers, 'subject') || '(No subject)'
      const fromHeader = getHeader(headers, 'from')
      const toHeader = getHeader(headers, 'to')
      const dateHeader = getHeader(headers, 'date')
      const body = extractBody(msg.payload).substring(0, 4000)

      // Parse name+email from header like "John Smith <john@email.com>"
      function parseEmail(header: string) {
        const match = header.match(/^(.+?)\s*<(.+?)>$/)
        if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
        return { name: header.trim(), email: header.trim() }
      }

      const myEmail = conn.handle || ''
      let customerEmail = ''
      let customerName = ''

      if (direction === 'inbound') {
        const parsed = parseEmail(fromHeader)
        customerEmail = parsed.email
        customerName = parsed.name
      } else {
        const parsed = parseEmail(toHeader)
        customerEmail = parsed.email
        customerName = parsed.name
      }

      if (!customerEmail || customerEmail === myEmail) continue

      const created_at = dateHeader
        ? new Date(dateHeader).toISOString()
        : new Date(parseInt(msg.internalDate || '0')).toISOString()

      // Upsert by gmail_message_id to avoid duplicates
      const { error } = await admin.from('messages').upsert({
        profile_id: profileId,
        gmail_message_id: id,
        customer_email: customerEmail,
        customer_name: customerName,
        channel: 'email',
        direction,
        subject,
        body: body || '(empty)',
        read: direction === 'outbound' || !msg.labelIds?.includes('UNREAD'),
        delivered: direction === 'outbound',
        created_at,
      }, { onConflict: 'gmail_message_id' })

      if (!error) synced++
    }

    return synced
  }

  // ── 5. Sync both folders ─────────────────────────────────────────────
  try {
    const [inboundCount, outboundCount] = await Promise.all([
      syncLabel('INBOX', 'inbound'),
      syncLabel('SENT', 'outbound'),
    ])

    return {
      ok: true,
      synced: inboundCount + outboundCount,
      inbound: inboundCount,
      outbound: outboundCount,
    }
  } catch (err: any) {
    console.error('[fetch-emails] Error:', err.message)
    return { ok: false, synced: 0, error: err.message }
  }
})

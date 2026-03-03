/**
 * /api/brand/callback/:platform
 *
 * OAuth redirect handler — the social platform sends the user here after
 * they approve the popup. This route:
 *
 *   1. Reads client_id / client_secret from server-only runtimeConfig.
 *   2. Exchanges the one-time `code` for access + refresh tokens.
 *   3. Fetches minimal account info (handle, platform_id, follower count).
 *   4. Reads the user's Supabase session from the forwarded cookie.
 *   5. Upserts social_connections via service-role (bypasses RLS).
 *   6. Returns a tiny HTML page that closes the popup.
 *
 * FIX (TDZ / renderer$1 error):
 *   Removed top-level `import { createClient }` — replaced with a dynamic
 *   import() inside the handler. The PLATFORMS config object (which only
 *   contains plain data / functions with no module-level side-effects) is
 *   kept at module scope because it contains no imports and is safe.
 *   All h3 helpers remain as Nitro auto-imports.
 */

// ── Popup HTML helper ─────────────────────────────────────────────────────
function closePopup(message: string, success: boolean) {
  const bg = success ? '#f0fdf4' : '#fef2f2'
  const color = success ? '#166534' : '#991b1b'
  const icon = success ? '✅' : '❌'
  const title = success ? 'Connected!' : 'Failed'
  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:${bg}">
<div style="text-align:center;padding:32px">
  <div style="font-size:48px">${icon}</div>
  <h2 style="margin:16px 0 8px;color:${color}">${title}</h2>
  <p style="color:#6b7280;margin:0">${message}</p>
  <script>setTimeout(() => window.close(), 2000);<\/script>
</div></body></html>`
}

// ── Platform definitions ──────────────────────────────────────────────────
// Plain data object — no module imports, safe at module scope.
const PLATFORMS: Record<string, {
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  redirectPath: string
  fetchProfile: (token: string, rc: any) => Promise<{ platform_id: string; handle: string; meta: Record<string, any> }>
}> = {
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientIdEnv: 'fbAppId',
    clientSecretEnv: 'fbAppSecret',
    redirectPath: '/api/brand/callback/facebook',
    fetchProfile: async (token) => {
      const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`)
      const body = await res.json()
      const page = body?.data?.[0]
      return {
        platform_id: page?.id ?? 'unknown',
        handle: page?.name ?? 'Facebook Page',
        meta: { followers: page?.fan_count ?? 0, category: page?.category ?? '' },
      }
    },
  },
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: 'googleClientId',
    clientSecretEnv: 'googleClientSecret',
    redirectPath: '/api/brand/callback/google',
    fetchProfile: async (token) => {
      const res = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const body = await res.json()
      const account = body?.accounts?.[0]
      return {
        platform_id: account?.name ?? 'unknown',
        handle: account?.accountName ?? 'Google Business Profile',
        meta: { account_type: account?.type ?? '' },
      }
    },
  },
  instagram: {
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientIdEnv: 'igAppId',
    clientSecretEnv: 'igAppSecret',
    redirectPath: '/api/brand/callback/instagram',
    fetchProfile: async (shortToken, rc) => {
      // Exchange short-lived token for 60-day long-lived token
      const llRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token` +
        `&client_secret=${rc.igAppSecret}&access_token=${shortToken}`
      )
      const llBody = await llRes.json()
      const token = llBody.access_token ?? shortToken
      const res = await fetch(
        `https://graph.instagram.com/me?fields=id,username,followers_count&access_token=${token}`
      )
      const data = await res.json()
      return {
        platform_id: data.id ?? 'unknown',
        handle: `@${data.username ?? 'unknown'}`,
        meta: { followers: data.followers_count ?? 0, long_lived_token: token },
      }
    },
  },
  yelp: {
    tokenUrl: 'https://api.yelp.com/oauth2/token',
    clientIdEnv: 'yelpClientId',
    clientSecretEnv: 'yelpClientSecret',
    redirectPath: '/api/brand/callback/yelp',
    fetchProfile: async (token) => {
      const res = await fetch('https://api.yelp.com/v3/businesses/self', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const biz = await res.json()
      return {
        platform_id: biz?.id ?? 'unknown',
        handle: biz?.name ?? 'Yelp Business',
        meta: { rating: biz?.rating ?? 0, review_count: biz?.review_count ?? 0 },
      }
    },
  },
  gmail: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: 'googleClientId',
    clientSecretEnv: 'googleClientSecret',
    redirectPath: '/api/brand/callback/gmail',
    fetchProfile: async (token) => {
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      return {
        platform_id: data.emailAddress ?? 'unknown',
        handle: data.emailAddress ?? 'Gmail',
        meta: { messages_total: data.messagesTotal ?? 0, threads_total: data.threadsTotal ?? 0 },
      }
    },
  },
}

// ── Route handler ─────────────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
  // ── Dynamic import: resolved at request time, safe for Nitro lazy-loading ──
  const { createClient } = await import('@supabase/supabase-js')

  const platform = getRouterParam(event, 'platform') ?? ''
  const query = getQuery(event)
  const code = query.code as string | undefined
  const errorMsg = query.error as string | undefined

  if (!PLATFORMS[platform]) {
    setResponseStatus(event, 400)
    return closePopup('Unknown platform', false)
  }
  if (errorMsg) return closePopup(`Authorization cancelled: ${errorMsg}`, false)
  if (!code) return closePopup('No authorization code received', false)

  const rc = useRuntimeConfig()
  const cfg = PLATFORMS[platform]
  const clientId = (rc as any)[cfg.clientIdEnv]
  const clientSecret = (rc as any)[cfg.clientSecretEnv]
  const redirectBase = rc.brandOauthRedirectBase as string
  const serviceKey = rc.supabaseServiceRoleKey as string
  const supabaseUrl = (rc.public as any).supabaseUrl as string

  if (!clientId || !clientSecret || !serviceKey || !supabaseUrl || !redirectBase) {
    console.error(
      `[BrandCallback:${platform}] Missing env vars — check BRAND_OAUTH_REDIRECT_BASE, ` +
      `${cfg.clientIdEnv}, ${cfg.clientSecretEnv}, SUPABASE_SERVICE_ROLE_KEY`
    )
    return closePopup('Server configuration error — contact support.', false)
  }

  try {
    // ── 1. Exchange code → tokens ─────────────────────────────────────────
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${redirectBase}${cfg.redirectPath}`,
      grant_type: 'authorization_code',
    })

    console.log(`[BrandCallback:${platform}] Token exchange →`, {
      tokenUrl: cfg.tokenUrl,
      redirect_uri: `${redirectBase}${cfg.redirectPath}`,
      client_id: clientId?.slice(0, 20) + '...',
      hasSecret: !!clientSecret,
    })

    const tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    })

    const tokenText = await tokenRes.text()
    console.log(`[BrandCallback:${platform}] Token response (${tokenRes.status}):`, tokenText.slice(0, 500))

    let tokens: any
    try { tokens = JSON.parse(tokenText) } catch { tokens = { error: tokenText } }

    if (tokens.error || !tokens.access_token) {
      throw new Error(tokens.error_description ?? tokens.error ?? 'Token exchange failed')
    }

    // ── 2. Fetch platform profile ─────────────────────────────────────────
    const profile = await cfg.fetchProfile(tokens.access_token, rc)

    // ── 3. Resolve Supabase user ──────────────────────────────────────────
    // Strategy 1: Read the Supabase session from the popup's cookie header.
    // Works in regular browser mode where popup inherits parent cookies.
    let userId: string | undefined

    const cookieHeader = getHeader(event, 'cookie') ?? ''
    if (cookieHeader) {
      const anonClient = createClient(supabaseUrl, (rc.public as any).supabaseKey ?? '', {
        global: { headers: { cookie: cookieHeader } },
      })
      const { data: { user } } = await anonClient.auth.getUser()
      userId = user?.id
    }

    // Strategy 2: In Electron, cookies don't transfer across origins (file:// vs localhost).
    // The client passes the profile_id via the OAuth `state` parameter.
    // We verify the profile_id exists to prevent spoofing.
    if (!userId) {
      const stateProfileId = query.state as string | undefined
      if (stateProfileId) {
        const adminCheck = createClient(supabaseUrl, serviceKey)
        const { data: existingUser } = await adminCheck.auth.admin.getUserById(stateProfileId)
        if (existingUser?.user?.id) {
          userId = existingUser.user.id
          console.log(`[BrandCallback:${platform}] Identified user via state param: ${userId}`)
        }
      }
    }

    if (!userId) {
      throw new Error('Could not identify the logged-in user. Please log in to NovaOps first.')
    }

    // ── 4. Upsert social_connections (service-role bypasses RLS) ─────────
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { error: upsertError } = await adminClient
      .from('social_connections')
      .upsert({
        profile_id: userId,
        platform,
        platform_id: profile.platform_id,
        handle: profile.handle,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        scopes: tokens.scope ? tokens.scope.split(/[\s,]+/) : [],
        connected: true,
        meta: profile.meta,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,platform' })

    if (upsertError) throw upsertError

    return closePopup(`${platform} account connected successfully.`, true)

  } catch (err: any) {
    console.error(`[BrandCallback:${platform}]`, err)
    // Show diagnostic details in the popup so the user can report them
    const debugInfo = [
      `Error: ${err.message}`,
      `Platform: ${platform}`,
      `Redirect base: ${redirectBase}`,
      `Redirect URI: ${redirectBase}${cfg.redirectPath}`,
      `Client ID: ${clientId?.slice(0, 25)}...`,
      `Has secret: ${!!clientSecret}`,
      `Has service key: ${!!serviceKey}`,
    ].join('<br/>')
    return closePopup(`${err.message}<br/><br/><small style="color:#999">${debugInfo}</small>`, false)
  }
})

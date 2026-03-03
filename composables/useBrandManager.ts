/**
 * useBrandManager
 *
 * All Brand Manager data lives in Supabase.
 * Tables: brand_settings, social_connections, social_interactions,
 *         social_posts, auto_response_rules
 *
 * Platform OAuth (Facebook, Google, Instagram, Yelp) requires
 * server-side token exchange — the connect() methods here open
 * the OAuth URL and the redirect lands on /api/brand/callback/:platform
 * which exchanges the code for tokens and upserts social_connections.
 *
 * Everything else (replies, stars, archive, scheduling, rules) is
 * persisted directly from the browser via Supabase RLS-protected calls.
 */

import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────
export interface BrandSettings {
  id?: string
  portal_enabled: boolean
  portal_slug: string
  welcome_message: string
  booking_enabled: boolean
  booking_open: string
  booking_close: string
  slot_duration: number
  auto_response_enabled: boolean
}

export interface SocialConnection {
  id: string
  platform: 'facebook' | 'google' | 'instagram' | 'yelp'
  platform_id: string | null
  handle: string | null
  connected: boolean
  meta: Record<string, any>
  last_synced_at: string | null
  created_at: string
}

export interface SocialInteraction {
  id: string
  platform: string
  platform_ref_id: string | null
  author_name: string
  author_id: string | null
  type: 'Review' | 'Comment' | 'Message'
  content: string
  rating: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  likes: number | null
  url: string | null
  unread: boolean
  starred: boolean
  archived: boolean
  our_reply: string | null
  reply_posted_at: string | null
  interaction_at: string
  created_at: string
}

export interface SocialPost {
  id: string
  content: string
  targets: string[]
  media_urls: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for: string | null
  published_at: string | null
  platform_post_ids: Record<string, string>
  error_message: string | null
  created_at: string
}

export interface AutoResponseRule {
  id: string
  trigger_type: string
  trigger_value: string
  response_text: string
  enabled: boolean
  sort_order: number
}

// ── Default seeds ──────────────────────────────────────────────────────────
const DEFAULT_RULES = [
  { trigger_type: 'rating_gte', trigger_value: '5', response_text: 'Thank you so much! Your kind words mean the world to our team. We look forward to serving you again!', enabled: true, sort_order: 0 },
  { trigger_type: 'keyword', trigger_value: 'price', response_text: 'We work hard to offer the best value in town! Thanks for noticing.', enabled: true, sort_order: 1 },
  { trigger_type: 'rating_lte', trigger_value: '2', response_text: "We're sorry to hear about your experience. Please contact us directly so we can make it right.", enabled: false, sort_order: 2 },
]

/**
 * Builds the OAuth authorization URL for a given platform at runtime.
 * App-level client IDs are exposed as NUXT_PUBLIC_* vars (non-secret).
 * Client secrets never leave the server — they're exchanged in the callback route.
 *
 * Returns an empty string if the required app ID env var is not configured,
 * so callers can detect misconfiguration and show a helpful error.
 */
function buildOauthUrl(platform: string, profileId?: string): string {
  const cfg = useRuntimeConfig().public as any

  // In Electron, window.location.origin is file:// which is invalid for OAuth.
  // The Brand Manager OAuth flow uses a popup that hits the Nuxt dev server's
  // callback route, so we need the Nuxt server's origin, not the Electron shell's.
  const isElectron = !!(window as any).electronAPI?.isElectron
  const origin = isElectron
    ? (process.env.NUXT_URL || 'http://localhost:3000')
    : window.location.origin
  const redirect = `${origin}/api/brand/callback/${platform}`

  // Pass profileId as OAuth state so the callback can identify the user
  // even when cookies don't transfer (Electron popup is a different origin).
  const stateParam = profileId ? `&state=${encodeURIComponent(profileId)}` : ''

  switch (platform) {
    case 'facebook': {
      const appId = cfg.fbAppId ?? ''
      if (!appId) return ''
      return (
        `https://www.facebook.com/v19.0/dialog/oauth` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&scope=pages_manage_posts,pages_read_engagement,pages_manage_engagement,business_management` +
        `&response_type=code` + stateParam
      )
    }
    case 'google': {
      const clientId = cfg.googleClientId ?? ''
      if (!clientId) return ''
      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/business.manage')}` +
        `&response_type=code&access_type=offline&prompt=consent` + stateParam
      )
    }
    case 'instagram': {
      const igId = cfg.igAppId ?? ''
      if (!igId) return ''
      return (
        `https://api.instagram.com/oauth/authorize` +
        `?client_id=${igId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&scope=user_profile,user_media` +
        `&response_type=code` + stateParam
      )
    }
    case 'yelp': {
      const yelpId = cfg.yelpClientId ?? ''
      if (!yelpId) return ''
      return (
        `https://www.yelp.com/oauth2/authorization` +
        `?client_id=${yelpId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&response_type=code&scope=r_business_reviews` + stateParam
      )
    }
    case 'gmail': {
      // Gmail OAuth — uses the same Google client ID but different scopes
      const gmailClientId = cfg.googleClientId ?? ''
      if (!gmailClientId) return ''
      const gmailRedirect = `${origin}/api/brand/callback/gmail`
      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${gmailClientId}` +
        `&redirect_uri=${encodeURIComponent(gmailRedirect)}` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly')}` +
        `&response_type=code&access_type=offline&prompt=consent` + stateParam
      )
    }
    default:
      return ''
  }
}

// ── Composable ─────────────────────────────────────────────────────────────
export const useBrandManager = () => {
  const { $supabase } = useNuxtApp()
  const { addNotification } = useNotifications()

  if (!$supabase) {
    throw new Error('[BrandManager] Supabase client not available. Check environment variables.')
  }

  const sb = $supabase as any
  const uid = () => sb.auth.getUser().then((r: any) => r.data?.user?.id as string)

  // ── Reactive state ───────────────────────────────────────────────────────
  const settings = ref<BrandSettings>({
    portal_enabled: false, portal_slug: '', welcome_message: '',
    booking_enabled: false, booking_open: '09:00', booking_close: '17:00',
    slot_duration: 30, auto_response_enabled: false,
  })
  const connections = ref<SocialConnection[]>([])
  const interactions = ref<SocialInteraction[]>([])
  const posts = ref<SocialPost[]>([])
  const rules = ref<AutoResponseRule[]>([])
  const loading = ref(false)
  const syncing = ref(false)

  let realtimeChannel: RealtimeChannel | null = null

  // ── Load all Brand Manager data ──────────────────────────────────────────
  const load = async () => {
    loading.value = true
    try {
      const profileId = await uid()
      if (!profileId) throw new Error('Not authenticated')

      const [settingsRes, connectionsRes, interactionsRes, postsRes, rulesRes] = await Promise.all([
        sb.from('brand_settings').select('*').eq('profile_id', profileId).maybeSingle(),
        sb.from('social_connections').select('*').eq('profile_id', profileId).order('created_at'),
        sb.from('social_interactions').select('*').eq('profile_id', profileId).eq('archived', false).order('interaction_at', { ascending: false }),
        sb.from('social_posts').select('*').eq('profile_id', profileId).in('status', ['scheduled', 'draft']).order('scheduled_for', { ascending: true }),
        sb.from('auto_response_rules').select('*').eq('profile_id', profileId).order('sort_order'),
      ])

      if (settingsRes.error) throw settingsRes.error
      if (connectionsRes.error) throw connectionsRes.error
      if (interactionsRes.error) throw interactionsRes.error
      if (postsRes.error) throw postsRes.error
      if (rulesRes.error) throw rulesRes.error

      // Settings: upsert defaults if first visit
      if (settingsRes.data) {
        settings.value = settingsRes.data
      } else {
        await initSettings(profileId)
      }

      connections.value = connectionsRes.data ?? []
      interactions.value = interactionsRes.data ?? []
      posts.value = postsRes.data ?? []

      // Rules: seed defaults on first visit
      if ((rulesRes.data ?? []).length === 0) {
        await seedRules(profileId)
      } else {
        rules.value = rulesRes.data
      }

      subscribeRealtime(profileId)
    } catch (err: any) {
      console.error('[BrandManager] load failed:', err)
      addNotification('Load Error', err.message ?? 'Failed to load Brand Manager data', 'error')
    } finally {
      loading.value = false
    }
  }

  // ── Init / seed helpers ──────────────────────────────────────────────────
  const initSettings = async (profileId: string) => {
    const defaults = { ...settings.value, profile_id: profileId }
    const { data, error } = await sb.from('brand_settings').insert(defaults).select().single()
    if (error) throw error
    settings.value = data
  }

  const seedRules = async (profileId: string) => {
    const seeded = DEFAULT_RULES.map(r => ({ ...r, profile_id: profileId }))
    const { data, error } = await sb.from('auto_response_rules').insert(seeded).select()
    if (error) throw error
    rules.value = data
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    const profileId = await uid()
    const payload = { ...settings.value, profile_id: profileId, updated_at: new Date().toISOString() }
    const { data, error } = await sb.from('brand_settings').upsert(payload, { onConflict: 'profile_id' }).select().single()
    if (error) throw error
    settings.value = data
    addNotification('Saved', 'Brand settings updated', 'success')
  }

  // ── Social Connections ───────────────────────────────────────────────────
  /**
   * Opens the real OAuth URL for the platform in a popup window.
   * The /api/brand/callback/:platform server route handles the code exchange,
   * upserts social_connections, and closes the popup.
   * We poll for the connection to appear in Supabase.
   */
  const connectPlatform = async (platform: string) => {
    // Get profile ID first so we can pass it via OAuth state parameter.
    // This is essential in Electron where popup cookies belong to a different origin.
    const profileId = await uid()
    const oauthUrl = buildOauthUrl(platform, profileId)
    if (!oauthUrl) {
      const names: Record<string, string> = {
        facebook: 'NUXT_PUBLIC_FB_APP_ID',
        google: 'NUXT_PUBLIC_GOOGLE_CLIENT_ID',
        gmail: 'NUXT_PUBLIC_GOOGLE_CLIENT_ID',
        instagram: 'NUXT_PUBLIC_IG_APP_ID',
        yelp: 'NUXT_PUBLIC_YELP_CLIENT_ID',
      }
      addNotification(
        'Not Configured',
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} OAuth is not set up. Add ${names[platform] ?? 'the app ID env var'} to your .env file and restart the server.`,
        'error'
      )
      return
    }

    // Open OAuth popup
    const popup = window.open(
      oauthUrl,
      `connect_${platform}`,
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      addNotification('Popup Blocked', 'Please allow popups for this site to connect social accounts.', 'error')
      return
    }

    addNotification('Connecting…', `Complete the ${platform} authorization in the popup.`, 'info')

    // Poll for popup close + connection in DB (max 3 min)
    const pollInterval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(pollInterval)
        // Check if connection was saved
        const { data } = await sb.from('social_connections').select('*').eq('profile_id', profileId).eq('platform', platform).maybeSingle()
        if (data?.connected) {
          const idx = connections.value.findIndex(c => c.platform === platform)
          if (idx > -1) connections.value[idx] = data
          else connections.value.push(data)
          addNotification('Connected!', `${platform} account linked successfully`, 'success')
        } else {
          addNotification('Not Connected', `${platform} authorization was cancelled or failed`, 'warning')
        }
      }
    }, 1000)

    setTimeout(() => clearInterval(pollInterval), 180_000)
  }

  const disconnectPlatform = async (connection: SocialConnection) => {
    const { error } = await sb.from('social_connections').update({ connected: false }).eq('id', connection.id)
    if (error) throw error
    const idx = connections.value.findIndex(c => c.id === connection.id)
    if (idx > -1) connections.value[idx].connected = false
    addNotification('Disconnected', `${connection.platform} account disconnected`, 'info')
  }

  // ── Interactions ─────────────────────────────────────────────────────────
  const addInteraction = async (interaction: Partial<SocialInteraction>) => {
    const profileId = await uid()
    const { data, error } = await sb.from('social_interactions').insert({
      profile_id: profileId,
      platform: interaction.platform ?? 'google',
      platform_ref_id: interaction.platform_ref_id ?? null,
      author_name: interaction.author_name ?? '',
      author_id: interaction.author_id ?? null,
      type: interaction.type ?? 'Review',
      content: interaction.content ?? '',
      rating: interaction.rating ?? null,
      sentiment: interaction.sentiment ?? 'neutral',
      likes: interaction.likes ?? null,
      url: interaction.url ?? null,
      unread: true,
      starred: false,
      archived: false,
      interaction_at: interaction.interaction_at ?? new Date().toISOString(),
    }).select().single()
    if (error) throw error
    interactions.value.unshift(data)
    return data
  }

  const updateInteraction = async (id: string, updates: Partial<SocialInteraction>) => {
    const { data, error } = await sb.from('social_interactions').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw error
    const idx = interactions.value.findIndex(i => i.id === id)
    if (idx > -1) interactions.value[idx] = data
    return data
  }

  const markRead = (id: string) => updateInteraction(id, { unread: false } as any)
  const toggleStar = (item: SocialInteraction) => updateInteraction(item.id, { starred: !item.starred } as any)
  const archiveInteraction = async (id: string) => {
    await updateInteraction(id, { archived: true } as any)
    interactions.value = interactions.value.filter(i => i.id !== id)
  }

  /**
   * postReply:
   *   1. Saves the reply text to social_interactions (Supabase).
   *   2. Calls /api/brand/reply (server route) which uses the stored
   *      access token to post the reply to the live platform API.
   *      Yelp does not support programmatic replies — the user is notified.
   */
  const postReply = async (item: SocialInteraction, replyText: string) => {
    // Save reply text first so it's never lost even if the API call fails
    await updateInteraction(item.id, {
      our_reply: replyText,
      unread: false,
    } as any)

    try {
      const res = await $fetch('/api/brand/reply', {
        method: 'POST',
        body: { interaction_id: item.id },
      }) as any

      if (res?.ok) {
        addNotification('Reply Posted', `Reply published to ${item.platform}`, 'success')
      } else if (res?.platform_error) {
        // e.g. Yelp manual-only notice
        addNotification('Reply Saved', res.platform_error, 'warning')
      } else {
        addNotification('Reply Saved', `Reply saved but could not post to ${item.platform}: ${res?.error ?? 'unknown error'}`, 'warning')
      }
    } catch (err: any) {
      addNotification('Reply Saved', `Reply saved locally but platform posting failed: ${err.message ?? err}`, 'warning')
    }
  }

  // ── Posts ─────────────────────────────────────────────────────────────────
  const createPost = async (content: string, targets: string[], scheduledFor?: string) => {
    const profileId = await uid()
    const isScheduled = !!scheduledFor
    const { data, error } = await sb.from('social_posts').insert({
      profile_id: profileId,
      content,
      targets,
      media_urls: [],
      status: isScheduled ? 'scheduled' : 'published',
      scheduled_for: isScheduled ? scheduledFor : null,
      published_at: isScheduled ? null : new Date().toISOString(),
      platform_post_ids: {},
    }).select().single()
    if (error) throw error
    if (isScheduled) {
      posts.value.push(data)
      posts.value.sort((a, b) => {
        if (!a.scheduled_for) return 1
        if (!b.scheduled_for) return -1
        return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      })
    }
    addNotification(isScheduled ? 'Scheduled' : 'Published', isScheduled ? `Post scheduled for ${new Date(scheduledFor!).toLocaleString()}` : `Post sent to ${targets.join(', ')}`, 'success')
    return data
  }

  const deletePost = async (id: string) => {
    const { error } = await sb.from('social_posts').delete().eq('id', id)
    if (error) throw error
    posts.value = posts.value.filter(p => p.id !== id)
  }

  // ── Auto-response rules ───────────────────────────────────────────────────
  const updateRule = async (rule: AutoResponseRule) => {
    const { data, error } = await sb.from('auto_response_rules').update({
      enabled: rule.enabled,
      response_text: rule.response_text,
      updated_at: new Date().toISOString(),
    }).eq('id', rule.id).select().single()
    if (error) throw error
    const idx = rules.value.findIndex(r => r.id === rule.id)
    if (idx > -1) rules.value[idx] = data
  }

  // ── Realtime ──────────────────────────────────────────────────────────────
  const subscribeRealtime = (profileId: string) => {
    if (realtimeChannel) return

    realtimeChannel = sb.channel(`brand-${profileId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'social_interactions',
        filter: `profile_id=eq.${profileId}`,
      }, (payload: any) => {
        const { eventType, new: rec, old: old_ } = payload
        if (eventType === 'INSERT' && !rec.archived) {
          if (!interactions.value.find(i => i.id === rec.id)) {
            interactions.value.unshift(rec)
          }
        } else if (eventType === 'UPDATE') {
          const idx = interactions.value.findIndex(i => i.id === rec.id)
          if (rec.archived) {
            if (idx > -1) interactions.value.splice(idx, 1)
          } else if (idx > -1) {
            interactions.value[idx] = rec
          }
        } else if (eventType === 'DELETE') {
          interactions.value = interactions.value.filter(i => i.id !== old_.id)
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'social_connections',
        filter: `profile_id=eq.${profileId}`,
      }, (payload: any) => {
        const { eventType, new: rec } = payload
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const idx = connections.value.findIndex(c => c.id === rec.id)
          if (idx > -1) connections.value[idx] = rec
          else connections.value.push(rec)
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'social_posts',
        filter: `profile_id=eq.${profileId}`,
      }, (payload: any) => {
        const { eventType, new: rec, old: old_ } = payload
        if (eventType === 'INSERT') {
          if (!posts.value.find(p => p.id === rec.id) && ['scheduled', 'draft'].includes(rec.status)) {
            posts.value.push(rec)
          }
        } else if (eventType === 'UPDATE') {
          const idx = posts.value.findIndex(p => p.id === rec.id)
          if (['scheduled', 'draft'].includes(rec.status)) {
            if (idx > -1) posts.value[idx] = rec
            else posts.value.push(rec)
          } else if (idx > -1) {
            posts.value.splice(idx, 1) // published/failed — remove from scheduled list
          }
        } else if (eventType === 'DELETE') {
          posts.value = posts.value.filter(p => p.id !== old_.id)
        }
      })
      .subscribe()
  }

  const cleanup = () => {
    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────
  const unreadCount = computed(() => interactions.value.filter(i => i.unread).length)
  const activeConnections = computed(() => connections.value.filter(c => c.connected))

  /**
   * Returns true if the given platform has its OAuth App ID configured.
   * Used by the UI to show "Setup Required" instead of "Connect" when
   * the env var is missing.
   */
  function isPlatformConfigured(platform: string): boolean {
    if (typeof window === 'undefined') return false
    // buildOauthUrl returns '' when the app ID env var is missing
    return buildOauthUrl(platform) !== ''
  }

  return {
    // State
    settings,
    connections,
    interactions,
    posts,
    rules,
    loading,
    syncing,
    // Computed
    unreadCount,
    activeConnections,
    // Methods
    load,
    saveSettings,
    connectPlatform,
    disconnectPlatform,
    isPlatformConfigured,
    addInteraction,
    updateInteraction,
    markRead,
    toggleStar,
    archiveInteraction,
    postReply,
    createPost,
    deletePost,
    updateRule,
    cleanup,
  }
}

/**
 * useSupabaseConnect
 *
 * Manages a user-supplied Supabase URL + anon key stored in localStorage.
 * Used when the app is deployed without NUXT_PUBLIC_SUPABASE_* env vars
 * (e.g. self-hosted Electron, or a generic cloud deployment where the
 * operator wants each shop owner to bring their own Supabase project).
 *
 * The Supabase plugin reads these values as a fallback when env vars are absent.
 */

import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY_URL = 'novaops_sb_url'
const STORAGE_KEY_KEY = 'novaops_sb_key'

export interface SupabaseConnectionStatus {
  connected: boolean
  checking: boolean
  error: string | null
  projectName: string | null
}

// Module-level reactive singleton so all callers share the same state
const _url = ref('')
const _key = ref('')
const _status = reactive<SupabaseConnectionStatus>({
  connected: false,
  checking: false,
  error: null,
  projectName: null,
})

if (process.client) {
  _url.value = localStorage.getItem(STORAGE_KEY_URL) || ''
  _key.value = localStorage.getItem(STORAGE_KEY_KEY) || ''
}

export const useSupabaseConnect = () => {
  const url = _url
  const key = _key
  const status = _status

  const hasCredentials = computed(() => !!url.value && !!key.value)

  /** Extract the project ref from a Supabase URL for display */
  const projectRef = computed(() => {
    try {
      const hostname = new URL(url.value).hostname // xxx.supabase.co
      return hostname.split('.')[0]
    } catch { return null }
  })

  /**
   * Validate the given URL + key by hitting the Supabase REST health endpoint.
   * Does NOT require a user to be signed in.
   */
  const testConnection = async (testUrl?: string, testKey?: string): Promise<boolean> => {
    const u = testUrl || url.value
    const k = testKey || key.value
    if (!u || !k) {
      status.error = 'Please enter both the Project URL and anon key.'
      return false
    }
    status.checking = true
    status.error = null
    status.connected = false
    status.projectName = null
    try {
      // Ping the Supabase project — a 200 from the REST API means the URL + key
      // are valid even without any tables created.
      const probe = createClient(u, k, { auth: { persistSession: false } })
      // Use auth.getSession() as a lightweight roundtrip — it always returns
      // quickly (null session is fine, we just need the network call to succeed)
      const { error } = await probe.auth.getSession()
      if (error && error.message !== 'Auth session missing!') throw error
      status.connected = true
      status.projectName = new URL(u).hostname.split('.')[0]
      return true
    } catch (err: any) {
      status.error = err?.message || 'Could not reach the Supabase project. Check the URL and key.'
      status.connected = false
      return false
    } finally {
      status.checking = false
    }
  }

  /**
   * Persist credentials and reload the page so the Supabase plugin picks them up.
   */
  const saveAndConnect = async (newUrl: string, newKey: string): Promise<boolean> => {
    const ok = await testConnection(newUrl, newKey)
    if (!ok) return false
    localStorage.setItem(STORAGE_KEY_URL, newUrl.trim())
    localStorage.setItem(STORAGE_KEY_KEY, newKey.trim())
    _url.value = newUrl.trim()
    _key.value = newKey.trim()
    // Reload — the plugin will now pick up the localStorage values
    window.location.reload()
    return true
  }

  /**
   * Remove stored credentials and reload to disconnected state.
   */
  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEY_URL)
    localStorage.removeItem(STORAGE_KEY_KEY)
    _url.value = ''
    _key.value = ''
    status.connected = false
    status.projectName = null
    window.location.reload()
  }

  return {
    url: readonly(url),
    key: readonly(key),
    status,
    hasCredentials,
    projectRef,
    testConnection,
    saveAndConnect,
    disconnect,
  }
}

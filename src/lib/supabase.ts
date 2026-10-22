import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton: multiple GoTrue instances cause auth warnings.
let client: SupabaseClient | null | undefined;

export const SB_URL_KEY = "novaops_sb_url";
export const SB_KEY_KEY = "novaops_sb_key";

/**
 * Credentials come from the build environment first (VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY), then from values a user saved in Settings →
 * Database connection (Electron or self-hosted setups without env vars).
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  let url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  let key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

  if (!url || !key) {
    try {
      url = (localStorage.getItem(SB_URL_KEY) || "").trim();
      key = (localStorage.getItem(SB_KEY_KEY) || "").trim();
    } catch { /* storage unavailable */ }
  }

  if (!url || !key) {
    console.warn("[NovaOps] Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or connect in Settings.");
    client = null;

    return client;
  }

  // In Electron the page URL is file://, so there are no OAuth hash fragments to detect.
  const isElectron = !!(window as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron;

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !isElectron, storageKey: "novaops-auth" },
  });

  return client;
}

export const isElectron = () => typeof window !== "undefined" && !!(window as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron;

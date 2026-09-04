// ─── Environment variable helpers ─────────────────────────────────────────
// Same Supabase project as the mobicare-business storefront (VITE_ prefix
// exposes them to the browser). See .env.example for required variables.

function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;

  if (!value) {
    console.warn(`[config] Missing environment variable: ${key}. See .env.example.`);
  }

  return value || "";
}

export const SUPABASE_URL = requireEnv("VITE_SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("VITE_SUPABASE_ANON_KEY");

export const BUSINESS = {
  name: "Mobicare Device Recovery",
  tagline: "Fix. Protect. Upgrade.",
};

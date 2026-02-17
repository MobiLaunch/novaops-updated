// Use the singleton Supabase client from the plugin
// This avoids creating multiple GoTrue clients which causes auth warnings
export const useSupabase = () => {
  const { $supabase } = useNuxtApp()

  if (!$supabase) {
    throw new Error('[NovaOps] Supabase client not available. Check your environment variables.')
  }

  return {
    supabase: $supabase as any,
    auth: ($supabase as any).auth,
    from: (table: string) => ($supabase as any).from(table)
  }
}

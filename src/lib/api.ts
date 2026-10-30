import { getSupabase } from "@/lib/supabase";

/** fetch() to the POS's own API routes, carrying the signed-in user's token. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
  const headers = new Headers(init.headers);

  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(path, { ...init, headers });
}

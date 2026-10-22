import type { User } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

/** Creates a blank profile row on first sign-in. Returns true when one was created. */
export async function ensureProfile(user: User, businessName = ""): Promise<boolean> {
  const sb = getSupabase();

  if (!sb) return false;

  const { error } = await sb.from("profiles").select("id").eq("id", user.id).single();

  if (error?.code !== "PGRST116") return false;
  await sb.from("profiles").insert({ id: user.id, email: user.email, business_name: businessName, phone: "", address: "", currency: "$" });

  return true;
}

export const DEFAULT_STATUSES = "Open, In Progress, Waiting for Parts, Completed, Delivered";

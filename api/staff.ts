import { wrap, createError, readBody, requireUser, runtimeConfig } from "./_lib/nitro.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/staff   (owner only)
 *   { action: "create", email, password, name }  → creates a staff sign-in
 *   { action: "remove", userId }                 → deactivates it and deletes the sign-in
 * Staff accounts get no profiles row, so they never inherit owner-level access.
 */
export default wrap(async (event: any) => {
  const caller = await requireUser(event);
  const body = (await readBody(event)) || {};
  const config = runtimeConfig();
  const url = (config.public as any).supabaseUrl;
  const key = (config as any).supabaseServiceRoleKey;

  if (!url || !key) throw createError({ statusCode: 503, statusMessage: "Add SUPABASE_SERVICE_ROLE_KEY to the server to manage staff." });
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, { auth: { persistSession: false } });

  // Only the owner (someone with a profile who is not themselves staff) may manage staff.
  const [{ data: profile }, { data: asStaff }] = await Promise.all([
    admin.from("profiles").select("id").eq("id", caller.id).maybeSingle(),
    admin.from("staff_members").select("user_id").eq("user_id", caller.id).maybeSingle(),
  ]);

  if (!profile || asStaff) throw createError({ statusCode: 403, statusMessage: "Only the shop owner can manage staff." });

  if (body.action === "create") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!/^\S+@\S+\.\S+$/.test(email)) throw createError({ statusCode: 400, statusMessage: "Enter a valid email." });
    if (password.length < 8) throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });

    if (error || !data.user) throw createError({ statusCode: 400, statusMessage: error?.message || "Could not create the account." });
    const { error: e2 } = await admin.from("staff_members").insert({ user_id: data.user.id, owner_id: caller.id, name: String(body.name || "").trim(), email });

    if (e2) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw createError({ statusCode: 500, statusMessage: e2.message });
    }

    return { ok: true, userId: data.user.id };
  }
  if (body.action === "remove") {
    const { data: row } = await admin.from("staff_members").select("user_id").eq("user_id", body.userId).eq("owner_id", caller.id).maybeSingle();

    if (!row) throw createError({ statusCode: 404, statusMessage: "Staff member not found." });
    await admin.from("staff_members").delete().eq("user_id", body.userId);
    await admin.auth.admin.deleteUser(body.userId);

    return { ok: true };
  }
  throw createError({ statusCode: 400, statusMessage: "Unknown action." });
});

import { createError, getHeader, runtimeConfig, wrap } from "./_lib/nitro.js";
import { sendSmtp } from "./_lib/mailer.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/cron-daily  (Vercel Cron, once a day)
 *
 *  1. Emails the owner a short end-of-day summary of the last 24 hours.
 *  2. Emails customers a reminder the day before a confirmed website booking.
 *
 * Needs CRON_SECRET (Vercel sends it as a bearer token), SUPABASE_SERVICE_ROLE_KEY, the Supabase URL and SMTP settings.
 * Optional: SHOP_TZ (default America/Chicago), DAILY_SUMMARY_TO (default: the owner's profile email).
 */
export default wrap(async (event: any) => {
  const secret = process.env.CRON_SECRET || "";

  if (!secret || getHeader(event, "authorization") !== `Bearer ${secret}`) throw createError({ statusCode: 401, statusMessage: "Not allowed." });

  const config = runtimeConfig() as any;
  const url = config.public.supabaseUrl as string;
  const key = config.supabaseServiceRoleKey as string;

  if (!url || !key) throw createError({ statusCode: 503, statusMessage: "Supabase service settings are missing." });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const tz = process.env.SHOP_TZ || "America/Chicago";

  const { data: owner } = await sb.from("profiles").select("id,email,business_name,currency").order("created_at", { ascending: true }).limit(1).maybeSingle();

  if (!owner) throw createError({ statusCode: 404, statusMessage: "No shop profile found." });
  const cur = owner.currency || "$";
  const money = (n: number) => `${cur}${n.toFixed(2)}`;
  const shop = owner.business_name || "the shop";
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: tz });
  const out: Record<string, unknown> = { summary: "skipped", reminders: 0 };

  // ── 1. End-of-day summary ───────────────────────────────────────────────
  const [sales, done, orders, bookings, inv, unread] = await Promise.all([
    sb.from("pos_sales").select("total").gte("created_at", since).neq("status", "voided"),
    sb.from("tickets").select("id", { count: "exact", head: true }).in("status", ["Completed", "Delivered", "Closed"]).gte("updated_at", since),
    sb.from("orders").select("total,status").gte("created_at", since),
    sb.from("bookings").select("id", { count: "exact", head: true }).eq("appt_date", tomorrow).in("status", ["pending", "confirmed"]),
    sb.from("inventory").select("name,stock,low,item_type").neq("item_type", "service"),
    sb.from("messages").select("id", { count: "exact", head: true }).eq("channel", "chat").eq("direction", "inbound").eq("read", false),
  ]);
  const posTotal = (sales.data || []).reduce((n: number, s: any) => n + Number(s.total || 0), 0);
  const webLive = (orders.data || []).filter((o: any) => !["cancelled", "refunded", "payment_failed"].includes(o.status));
  const webTotal = webLive.reduce((n: number, o: any) => n + Number(o.total || 0), 0);
  const low = (inv.data || []).filter((i: any) => (i.stock ?? 0) <= (i.low ?? 5));
  const lines = [
    `Here's how ${shop} did in the last 24 hours.`,
    "",
    `In-store sales: ${money(posTotal)} (${sales.data?.length || 0} sale${(sales.data?.length || 0) === 1 ? "" : "s"})`,
    `Website orders: ${money(webTotal)} (${webLive.length} order${webLive.length === 1 ? "" : "s"})`,
    `Tickets finished: ${done.count || 0}`,
    "",
    `Appointments tomorrow: ${bookings.count || 0}`,
    `Unread website chat: ${unread.count || 0}`,
    `Low or out of stock: ${low.length}${low.length ? `\n${low.slice(0, 8).map((i: any) => `  - ${i.name} (${i.stock ?? 0} left)`).join("\n")}${low.length > 8 ? `\n  ...and ${low.length - 8} more` : ""}` : ""}`,
  ];
  const to = process.env.DAILY_SUMMARY_TO || owner.email;

  if (to) out.summary = (await sendSmtp(to, `${shop}: today at a glance`, lines.join("\n"))).delivered ? "sent" : "not sent";

  // ── 2. Day-before booking reminders ─────────────────────────────────────
  const { data: due } = await sb.from("bookings").select("id,customer_name,customer_email,service,appt_date,appt_time,visit_type,home_address").eq("status", "confirmed").eq("appt_date", tomorrow).is("reminder_sent_at", null).neq("customer_email", "").limit(50);
  let sent = 0;

  for (const b of due || []) {
    const where = b.visit_type === "home" ? `We'll come to ${b.home_address || "your address"}.` : "Bring your device to the shop.";
    const body = `Hi ${b.customer_name || "there"},\n\nA quick reminder: your ${b.service} appointment is tomorrow at ${b.appt_time}. ${where}\n\nIf you need to change it, reply to this email or call us.\n\nThank you,\n${shop}`;
    const r = await sendSmtp(b.customer_email, `Reminder: your appointment tomorrow at ${b.appt_time}`, body);

    if (r.delivered) { await sb.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id); sent++; }
  }
  out.reminders = sent;

  return out;
});

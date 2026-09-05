import { createClient } from "@supabase/supabase-js";

// Public, unauthenticated ticket-status lookup + reply channel — powers the
// customer-facing /track/:token page. No Supabase session involved on
// either side: the browser never talks to Supabase directly here, this
// function does everything with the service_role key, so there's no RLS
// policy to reason about for anonymous access. The token itself
// (tickets.public_token, a random uuid distinct from the ticket's own
// sequential id) is the only thing standing in for auth — never return
// enough here to let someone enumerate or infer other tickets from it.

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey);
}

async function findTicketByToken(admin, token) {
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, profile_id, customer_id, device, device_model, issue, status, price, payments, due_date, created_at, updated_at")
    .eq("public_token", token)
    .maybeSingle();

  return ticket || null;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const admin = getAdminClient();

  if (!admin) return res.status(500).json({ error: "Server is not configured for ticket tracking." });

  const token = String(req.method === "GET" ? req.query.token : req.body?.token || "").trim();

  if (!TOKEN_RE.test(token)) return res.status(400).json({ error: "Invalid tracking link." });

  const ticket = await findTicketByToken(admin, token);

  if (!ticket) return res.status(404).json({ error: "We couldn't find a repair for this tracking link." });

  if (req.method === "GET") {
    const [{ data: customer }, { data: portalMessages }] = await Promise.all([
      ticket.customer_id
        ? admin.from("customers").select("name").eq("id", ticket.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("messages")
        .select("direction, body, created_at")
        .eq("ticket_id", ticket.id)
        .eq("channel", "portal")
        .order("created_at", { ascending: true }),
    ]);

    const balanceDue = Number(ticket.price || 0) - (ticket.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return res.status(200).json({
      ok: true,
      ticket: {
        device: ticket.device,
        deviceModel: ticket.device_model,
        issue: ticket.issue,
        status: ticket.status,
        price: Number(ticket.price || 0),
        balanceDue: Math.max(balanceDue, 0),
        dueDate: ticket.due_date,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        customerName: customer?.name || "",
      },
      messages: portalMessages || [],
    });
  }

  if (req.method === "POST") {
    const body = String(req.body?.body || "").trim().slice(0, MAX_BODY_LENGTH);

    if (!body) return res.status(400).json({ error: "Message can't be empty." });

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticket.id)
      .eq("channel", "portal")
      .gte("created_at", since);

    if ((count || 0) >= RATE_LIMIT_MAX) {
      return res.status(429).json({ error: "You're sending messages too quickly — please wait a minute and try again." });
    }

    const { data: customer } = ticket.customer_id
      ? await admin.from("customers").select("name, email").eq("id", ticket.customer_id).maybeSingle()
      : { data: null };

    const { error } = await admin.from("messages").insert({
      profile_id: ticket.profile_id,
      customer_id: ticket.customer_id,
      customer_name: customer?.name || "",
      customer_email: customer?.email || "",
      channel: "portal",
      direction: "inbound",
      subject: `Portal message — Ticket #${ticket.id}`,
      body,
      ticket_id: ticket.id,
      read: false,
      delivered: true,
    });

    if (error) return res.status(500).json({ error: "Couldn't send your message. Please try again." });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

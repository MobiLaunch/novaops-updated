import type {
  Appointment,
  BookingRecord,
  Customer,
  CustomerMessage,
  HouseCall,
  InventoryItem,
  Message,
  Shipment,
  Ticket,
  TradeIn,
} from "@/types/domain";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { asArray } from "./utils";

// ─── Supabase client ────────────────────────────────────────────────────────
// Priority: .env vars → localStorage (set via Settings page) → empty. Env
// vars win; localStorage lets the Settings page configure credentials
// post-deployment without a rebuild.

let _client: SupabaseClient | null = null;
let _clientUrl: string | null = null;
let _clientKey: string | null = null;

export function getSupabaseConfig() {
  const url = SUPABASE_URL || localStorage.getItem("sb_url") || "";
  const anonKey = SUPABASE_ANON_KEY || localStorage.getItem("sb_anon_key") || "";

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();

  return !!(url && anonKey && url.startsWith("https://") && anonKey.length > 20);
}

export function getClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getSupabaseConfig();

  if (!_client || _clientUrl !== url || _clientKey !== anonKey) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    _clientUrl = url;
    _clientKey = anonKey;
  }

  return _client;
}

function errMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "Unknown error";
}

async function currentUserId(): Promise<string | null> {
  const client = getClient();

  if (!client) return null;
  const { data } = await client.auth.getUser();

  return data.user?.id || null;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function sbFetchCustomers(): Promise<{ data: Customer[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data as Customer[] | null, error: error ? errMessage(error) : null };
}

export async function sbUpsertCustomer(
  patch: Partial<Customer> & { id?: number },
): Promise<{ data: Customer | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const row = { ...patch, profile_id: profileId };
  const { data, error } = await client
    .from("customers")
    .upsert(row)
    .select()
    .single();

  return { data: data as Customer | null, error: error ? errMessage(error) : null };
}

// Looks up an existing customer by phone (preferred) or email before
// creating a new row — sbUpsertCustomer alone always inserts when no `id`
// is given, so every walk-in ticket or converted booking for a *repeat*
// customer used to spawn a duplicate customer record instead of reusing
// theirs. Callers that already know the customer's id should keep using
// sbUpsertCustomer directly.
export async function sbFindOrCreateCustomer(
  info: { name: string; phone?: string; email?: string; address?: string },
): Promise<{ data: Customer | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const phone = (info.phone || "").trim();
  const email = (info.email || "").trim();

  if (phone) {
    const { data: existing } = await client.from("customers").select("*").eq("phone", phone).limit(1).maybeSingle();

    if (existing) {
      const patch: Partial<Customer> = {};

      if (!existing.email && email) patch.email = email;
      if (!existing.address && info.address) patch.address = info.address;

      if (Object.keys(patch).length > 0) return sbUpsertCustomer({ id: existing.id, ...patch });

      return { data: existing as Customer, error: null };
    }
  } else if (email) {
    const { data: existing } = await client.from("customers").select("*").eq("email", email).limit(1).maybeSingle();

    if (existing) return { data: existing as Customer, error: null };
  }

  return sbUpsertCustomer({ name: info.name, phone, email, address: info.address || "" });
}

// ─── Tickets ────────────────────────────────────────────────────────────────

export async function sbFetchTickets(): Promise<{ data: Ticket[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data as Ticket[] | null, error: error ? errMessage(error) : null };
}

export async function sbCreateTicket(
  patch: Partial<Ticket>,
): Promise<{ data: Ticket | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const row = { ...patch, profile_id: profileId };
  const { data, error } = await client.from("tickets").insert(row).select().single();

  return { data: data as Ticket | null, error: error ? errMessage(error) : null };
}

export async function sbUpdateTicket(
  id: number,
  patch: Partial<Ticket>,
): Promise<{ data: Ticket | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("tickets")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  return { data: data as Ticket | null, error: error ? errMessage(error) : null };
}

// ─── Inventory ──────────────────────────────────────────────────────────────

export async function sbFetchInventory(): Promise<{ data: InventoryItem[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("inventory")
    .select("*")
    .order("name", { ascending: true });

  return { data: data as InventoryItem[] | null, error: error ? errMessage(error) : null };
}

export async function sbUpsertInventoryItem(
  patch: Partial<InventoryItem> & { id?: number },
): Promise<{ data: InventoryItem | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const row = { ...patch, profile_id: profileId };
  const { data, error } = await client
    .from("inventory")
    .upsert(row)
    .select()
    .single();

  return { data: data as InventoryItem | null, error: error ? errMessage(error) : null };
}

// Attaches an inventory part to a ticket (tickets.parts jsonb) and
// decrements stock accordingly — the two writes aren't transactional, but
// the ticket write happens first so a failure never silently takes stock
// without recording where it went.
export async function sbAssignPartToTicket(
  ticket: Ticket,
  item: InventoryItem,
  qty: number,
): Promise<{ data: Ticket | null; error: string | null }> {
  if (qty <= 0) return { data: null, error: "Quantity must be positive" };
  const parts = [...asArray<Ticket["parts"][number]>(ticket.parts), { inventory_id: item.id, name: item.name, qty, price: item.price }];
  const { data, error } = await sbUpdateTicket(ticket.id, { parts });

  if (error || !data) return { data: null, error };
  await sbUpsertInventoryItem({ id: item.id, stock: Math.max(item.stock - qty, 0) });

  return { data, error: null };
}

// Removes a part from a ticket by index and restores its stock (best
// effort — if the original inventory item no longer exists, the ticket
// edit still succeeds).
export async function sbRemovePartFromTicket(
  ticket: Ticket,
  index: number,
): Promise<{ data: Ticket | null; error: string | null }> {
  const removed = asArray<Ticket["parts"][number]>(ticket.parts)[index];
  const parts = asArray<Ticket["parts"][number]>(ticket.parts).filter((_, i) => i !== index);
  const { data, error } = await sbUpdateTicket(ticket.id, { parts });

  if (error || !data) return { data: null, error };

  if (removed?.inventory_id) {
    const { data: item } = await getClient()!.from("inventory").select("*").eq("id", removed.inventory_id).maybeSingle();

    if (item) await sbUpsertInventoryItem({ id: item.id, stock: item.stock + removed.qty });
  }

  return { data, error: null };
}

// ─── Trade-ins ──────────────────────────────────────────────────────────────

export async function sbFetchTradeIns(): Promise<{ data: TradeIn[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("trade_ins").select("*").order("created_at", { ascending: false });

  return { data: data as TradeIn[] | null, error: error ? errMessage(error) : null };
}

export async function sbCreateTradeIn(
  patch: Partial<TradeIn>,
): Promise<{ data: TradeIn | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const row = { ...patch, profile_id: profileId };
  const { data, error } = await client.from("trade_ins").insert(row).select().single();

  return { data: data as TradeIn | null, error: error ? errMessage(error) : null };
}

export async function sbUpdateTradeIn(
  id: number,
  patch: Partial<TradeIn>,
): Promise<{ data: TradeIn | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("trade_ins").update(patch).eq("id", id).select().single();

  return { data: data as TradeIn | null, error: error ? errMessage(error) : null };
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function sbFetchMessages(): Promise<{ data: Message[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("messages").select("*").order("created_at", { ascending: false });

  return { data: data as Message[] | null, error: error ? errMessage(error) : null };
}

export async function sbCreateMessage(
  patch: Partial<Message>,
): Promise<{ data: Message | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const { data, error } = await client.from("messages").insert({ ...patch, profile_id: profileId }).select().single();

  return { data: data as Message | null, error: error ? errMessage(error) : null };
}

export async function sbMarkMessageRead(id: number): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("messages").update({ read: true }).eq("id", id);

  return !error;
}

export async function getCurrentProfileId(): Promise<string | null> {
  return currentUserId();
}

// ─── Profile settings (supplier email allowlist) ────────────────────────────

export async function sbFetchSupplierEmails(): Promise<{ data: string[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const userId = await currentUserId();

  if (!userId) return { data: null, error: "Not signed in" };
  const { data, error } = await client.from("profiles").select("supplier_emails").eq("id", userId).maybeSingle();

  return { data: (data?.supplier_emails as string[] | undefined) || [], error: error ? errMessage(error) : null };
}

export async function sbUpdateSupplierEmails(emails: string[]): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const userId = await currentUserId();

  if (!userId) return false;
  const { error } = await client.from("profiles").update({ supplier_emails: emails }).eq("id", userId);

  return !error;
}

// ─── Parts shipments (auto-collected from supplier emails) ─────────────────

export async function sbFetchShipments(): Promise<{ data: Shipment[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("shipments")
    .select("*")
    .order("estimated_delivery_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return { data: data as Shipment[] | null, error: error ? errMessage(error) : null };
}

export async function sbAssignShipmentToTicket(id: number, ticketId: number | null): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client
    .from("shipments")
    .update({ ticket_id: ticketId, status: ticketId ? "assigned" : "in_transit" })
    .eq("id", id);

  return !error;
}

export async function sbUpdateShipmentStatus(id: number, status: string): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("shipments").update({ status }).eq("id", id);

  return !error;
}

// ─── Customer chat (direct customer <-> shop messaging) ─────────────────────
// Separate from the Gmail-synced `messages` table — this is written to
// directly by a signed-in website customer (once the website grows a
// composer for it; see README). The shop replies from here.

export async function sbFetchCustomerMessages(): Promise<{ data: CustomerMessage[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("customer_messages").select("*").order("created_at", { ascending: true });

  return { data: data as CustomerMessage[] | null, error: error ? errMessage(error) : null };
}

export async function sbReplyToCustomerThread(
  patch: Pick<CustomerMessage, "customer_email" | "customer_name"> & Partial<CustomerMessage>,
): Promise<{ data: CustomerMessage | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const { data, error } = await client
    .from("customer_messages")
    .insert({ ...patch, profile_id: profileId, direction: "outbound", read: true })
    .select()
    .single();

  return { data: data as CustomerMessage | null, error: error ? errMessage(error) : null };
}

export async function sbMarkCustomerMessageRead(id: number): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("customer_messages").update({ read: true }).eq("id", id);

  return !error;
}

// ─── Appointments & house calls ─────────────────────────────────────────────

export async function sbFetchAppointments(): Promise<{ data: Appointment[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("appointments").select("*").order("date", { ascending: true });

  return { data: data as Appointment[] | null, error: error ? errMessage(error) : null };
}

export async function sbCreateAppointment(
  patch: Partial<Appointment>,
): Promise<{ data: Appointment | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const { data, error } = await client.from("appointments").insert({ ...patch, profile_id: profileId }).select().single();

  return { data: data as Appointment | null, error: error ? errMessage(error) : null };
}

export async function sbUpdateAppointment(id: number, patch: Partial<Appointment>): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("appointments").update(patch).eq("id", id);

  return !error;
}

export async function sbFetchHouseCalls(): Promise<{ data: HouseCall[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("house_calls").select("*").order("date", { ascending: true });

  return { data: data as HouseCall[] | null, error: error ? errMessage(error) : null };
}

export async function sbCreateHouseCall(
  patch: Partial<HouseCall>,
): Promise<{ data: HouseCall | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const { data, error } = await client.from("house_calls").insert({ ...patch, profile_id: profileId }).select().single();

  return { data: data as HouseCall | null, error: error ? errMessage(error) : null };
}

export async function sbUpdateHouseCall(id: number, patch: Partial<HouseCall>): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("house_calls").update(patch).eq("id", id);

  return !error;
}

// ─── Bookings (shared with mobicare-business) ──────────────────────────────
// This table lives in the same Supabase project as the storefront and is
// written by its /api/create-booking serverless function. Row Level Security
// there only allows admins (rows in public.staff_users, checked by
// public.is_admin()) to read/manage every booking — a signed-in customer can
// only read their own. So the NovaOps account signing in here must also be
// listed in staff_users for this to return anything. See README for setup.

export async function sbFetchBookings(): Promise<{ data: BookingRecord[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("bookings")
    .select("*")
    .order("appt_date", { ascending: false })
    .order("appt_time", { ascending: false });

  return { data: data as BookingRecord[] | null, error: error ? errMessage(error) : null };
}

export async function sbUpdateBookingStatus(id: string | number, status: string): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("bookings").update({ status }).eq("id", id);

  return !error;
}

export async function sbUpdateBooking(
  id: string | number,
  patch: Partial<BookingRecord>,
): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("bookings").update(patch).eq("id", id);

  return !error;
}

// Creates a NovaOps ticket from a booking and stamps the booking with the
// resulting ticket id (novaops_ticket_id) plus a "confirmed" status, so the
// link shows up on both sides and the booking doesn't get converted twice.
export async function sbConvertBookingToTicket(
  booking: BookingRecord,
): Promise<{ ticket: Ticket | null; error: string | null }> {
  const client = getClient();

  if (!client) return { ticket: null, error: "Supabase not configured" };

  const { data: customer } = await sbFindOrCreateCustomer({
    name: booking.customer_name,
    phone: booking.customer_phone || "",
    email: booking.customer_email || "",
    address: booking.visit_type === "home" ? booking.home_address || "" : "",
  });

  const { data: ticket, error } = await sbCreateTicket({
    customer_id: customer?.id ?? null,
    device: booking.device_type || "",
    device_model: booking.device_model || "",
    device_description: booking.visit_type === "home" ? booking.home_address || "" : "",
    issue: booking.issue || booking.service || "",
    status: "Open",
    priority: "normal",
    notes: [
      {
        text: `Created from website booking #${booking.id} — ${booking.service} on ${booking.appt_date} ${booking.appt_time}${booking.notes ? `. Notes: ${booking.notes}` : ""}`,
        at: new Date().toISOString(),
      },
    ],
  });

  if (error || !ticket) return { ticket: null, error: error || "Failed to create ticket" };

  await sbUpdateBooking(booking.id, {
    novaops_ticket_id: ticket.id,
    status: booking.status === "pending" ? "confirmed" : booking.status,
  });

  return { ticket, error: null };
}

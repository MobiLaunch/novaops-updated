import type {
  Appointment,
  BookingRecord,
  ChatThread,
  Customer,
  CustomerWithStats,
  CustomerMessage,
  HouseCall,
  InventoryItem,
  InventorySummary,
  Message,
  PosSale,
  Shipment,
  ShopSettings,
  Technician,
  Ticket,
  TradeIn,
  WebsiteOrder,
} from "@/types/domain";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { asArray, compareDateTime, toDateKey } from "./utils";

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

// ─── Paged list queries ─────────────────────────────────────────────────────
// Customers, Inventory, and Messages used to download their whole table and
// search, count, and total it in the browser. Each now asks for one page at a
// time, with the search pushed into Postgres. See migration
// 20260906_list_views.sql for the views and trigram indexes behind these.

export const LIST_PAGE_SIZE = 50;

export interface Page<T> {
  rows: T[];
  total: number;
  error: string | null;
}

function emptyPage<T>(error: string | null): Page<T> {
  return { rows: [], total: 0, error };
}

// PostgREST's or() takes a comma-separated list of filters, so a term
// containing a comma, parenthesis, double quote, or backslash would be read
// as filter syntax rather than as text; % and _ would become LIKE wildcards
// the user didn't type. All of those are replaced with spaces. Apostrophes
// are left alone — values reach Postgres as parameters, not as SQL text, so
// they're only a problem for names like O'Brien if we strip them.
function sanitiseSearch(term: string): string {
  return term
    .trim()
    .replace(/[,()"%\\_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rangeFor(page: number, pageSize: number): [number, number] {
  const from = page * pageSize;

  return [from, from + pageSize - 1];
}

export async function sbFetchCustomersPage(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Page<CustomerWithStats>> {
  const client = getClient();

  if (!client) return emptyPage("Supabase not configured");
  const pageSize = opts.pageSize ?? LIST_PAGE_SIZE;
  const [from, to] = rangeFor(opts.page ?? 0, pageSize);
  const term = sanitiseSearch(opts.search || "");
  const match = term ? `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%` : null;

  // The count runs against the base table: counting through the view would
  // make Postgres evaluate the per-customer aggregates for every row just to
  // find out how many there are.
  const rowsQuery = client.from("customers_with_stats").select("*").order("created_at", { ascending: false }).range(from, to);
  const countQuery = client.from("customers").select("id", { count: "exact", head: true });

  const [rows, count] = await Promise.all([
    match ? rowsQuery.or(match) : rowsQuery,
    match ? countQuery.or(match) : countQuery,
  ]);

  if (rows.error) return emptyPage(errMessage(rows.error));

  return { rows: (rows.data as unknown as CustomerWithStats[]) || [], total: count.count || 0, error: null };
}

// The tickets shown on one customer's record, fetched when that record is
// opened rather than by pulling every ticket in the shop up front.
export async function sbFetchCustomerTickets(customerId: number): Promise<Ticket[]> {
  const client = getClient();

  if (!client) return [];
  const { data } = await client
    .from("tickets")
    .select(TICKET_LIST_COLUMNS)
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (data as unknown as Ticket[]) || [];
}

export async function sbFetchInventoryPage(opts: {
  search?: string;
  lowOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<Page<InventoryItem>> {
  const client = getClient();

  if (!client) return emptyPage("Supabase not configured");
  const pageSize = opts.pageSize ?? LIST_PAGE_SIZE;
  const [from, to] = rangeFor(opts.page ?? 0, pageSize);
  const term = sanitiseSearch(opts.search || "");

  let query = client.from("inventory").select("*", { count: "exact" }).order("name", { ascending: true }).range(from, to);

  if (opts.lowOnly) query = query.eq("is_low", true);
  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,category.ilike.%${term}%`);

  const { data, count, error } = await query;

  if (error) return emptyPage(errMessage(error));

  return { rows: (data as InventoryItem[]) || [], total: count || 0, error: null };
}

// The header figures, totalled in Postgres. inventory_summary has one row per
// shop, and none at all when the catalogue is empty.
export async function sbFetchInventorySummary(): Promise<{ summary: InventorySummary; categories: string[] }> {
  const client = getClient();
  const zero: InventorySummary = { item_count: 0, stock_value: 0, low_count: 0, cost_value: 0 };

  if (!client) return { summary: zero, categories: [] };

  const [summary, categories] = await Promise.all([
    client.from("inventory_summary").select("*").maybeSingle(),
    client.from("inventory_categories").select("category").order("category"),
  ]);

  const row = summary.data as InventorySummary | null;

  return {
    summary: row
      ? {
          item_count: Number(row.item_count),
          stock_value: Number(row.stock_value),
          low_count: Number(row.low_count),
          cost_value: Number(row.cost_value),
        }
      : zero,
    categories: ((categories.data as { category: string }[] | null) || []).map((c) => c.category),
  };
}

export async function sbFetchMessagesPage(opts: {
  search?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<Page<Message>> {
  const client = getClient();

  if (!client) return emptyPage("Supabase not configured");
  const pageSize = opts.pageSize ?? LIST_PAGE_SIZE;
  const [from, to] = rangeFor(opts.page ?? 0, pageSize);
  const term = sanitiseSearch(opts.search || "");

  let query = client.from("messages").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);

  if (opts.unreadOnly) query = query.eq("direction", "inbound").eq("read", false);
  if (term) query = query.or(`subject.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,body.ilike.%${term}%`);

  const { data, count, error } = await query;

  if (error) return emptyPage(errMessage(error));

  return { rows: (data as Message[]) || [], total: count || 0, error: null };
}

// Tickets a parts shipment can be assigned to: the open ones, plus any
// ticket a shipment already points at so an existing assignment still shows
// its label after that repair is finished. The picker used to be fed every
// ticket the shop had ever written.
export async function sbFetchAssignableTickets(includeIds: number[] = []): Promise<Ticket[]> {
  const client = getClient();

  if (!client) return [];
  const columns = "id, device, device_model, status";

  const [open, referenced] = await Promise.all([
    client
      .from("tickets")
      .select(columns)
      .not("status", "in", "(Completed,Delivered)")
      .order("updated_at", { ascending: false })
      .limit(200),
    includeIds.length ? client.from("tickets").select(columns).in("id", includeIds) : Promise.resolve({ data: [] }),
  ]);

  const rows = (open.data as unknown as Ticket[]) || [];
  const seen = new Set(rows.map((t) => t.id));

  for (const t of ((referenced.data as unknown as Ticket[]) || [])) {
    if (!seen.has(t.id)) rows.push(t);
  }

  return rows;
}

// The inbox's unread badge, as a count query rather than a scan of every
// message the browser happens to have downloaded.
export async function sbFetchUnreadMailCount(): Promise<number> {
  const client = getClient();

  if (!client) return 0;
  const { count } = await client
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "inbound")
    .eq("read", false);

  return count || 0;
}

// Conversation list for the chat tab: one row per customer, newest first.
export async function sbFetchChatThreads(limit = 100): Promise<ChatThread[]> {
  const client = getClient();

  if (!client) return [];
  const { data } = await client
    .from("customer_chat_threads")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);

  return ((data as ChatThread[] | null) || []).map((t) => ({
    ...t,
    message_count: Number(t.message_count),
    unread_count: Number(t.unread_count),
  }));
}

// The messages of one conversation, oldest first, fetched when it's opened.
export async function sbFetchChatMessages(customerEmail: string): Promise<CustomerMessage[]> {
  const client = getClient();

  if (!client) return [];
  const { data } = await client
    .from("customer_messages")
    .select("*")
    .eq("customer_email", customerEmail)
    .order("created_at", { ascending: true });

  return (data as CustomerMessage[] | null) || [];
}

// ─── Bulk import ────────────────────────────────────────────────────────────
// The Import page used to call the single-row helpers in a loop: one HTTP
// round trip per row for the write, another for the duplicate lookup, and a
// third for the auth.getUser() inside each helper. A thousand-row CSV meant
// thousands of sequential requests. These do the whole file in a handful:
// the user id is resolved once, lookups and writes go out in chunks, and the
// chunks of a batch are issued in parallel.

const IMPORT_CHUNK = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];

  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));

  return out;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  error: string | null;
}

export interface CustomerImportRow {
  name: string;
  phone: string;
  email: string;
  address: string;
}

// Same matching rule as sbFindOrCreateCustomer, applied to a whole file at
// once: phone wins over email, a matched row only gets its *blank* fields
// filled in, and rows that repeat a phone or email already seen earlier in
// the same file collapse onto the first one instead of inserting twice.
export async function sbBulkImportCustomers(
  rows: CustomerImportRow[],
  onProgress?: (done: number) => void,
): Promise<BulkImportResult> {
  const client = getClient();

  if (!client) return { imported: 0, failed: rows.length, error: "Supabase not configured" };
  const profileId = await currentUserId();

  const named = rows.filter((r) => r.name.trim());
  let failed = rows.length - named.length;

  // Collapse repeats inside the file before touching the network.
  const seen = new Set<string>();
  const unique: CustomerImportRow[] = [];
  // Counted as imported, not skipped: run row by row, the second copy would
  // have found the first and returned it.
  let collapsed = 0;

  for (const row of named) {
    const key = row.phone.trim() ? `p:${row.phone.trim()}` : row.email.trim() ? `e:${row.email.trim().toLowerCase()}` : "";

    if (key && seen.has(key)) {
      collapsed++;
      continue;
    }
    if (key) seen.add(key);
    unique.push(row);
  }

  const phones = [...new Set(unique.map((r) => r.phone.trim()).filter(Boolean))];
  const emails = [...new Set(unique.map((r) => r.email.trim()).filter(Boolean))];

  type ExistingRow = { id: number; phone: string; email: string; address: string };
  const existing: ExistingRow[] = [];

  const lookups = await Promise.all([
    ...chunk(phones, IMPORT_CHUNK).map((c) => client.from("customers").select("id, phone, email, address").in("phone", c)),
    ...chunk(emails, IMPORT_CHUNK).map((c) => client.from("customers").select("id, phone, email, address").in("email", c)),
  ]);

  for (const lookup of lookups) {
    if (lookup.error) return { imported: 0, failed: rows.length, error: errMessage(lookup.error) };
    existing.push(...((lookup.data as ExistingRow[] | null) || []));
  }

  const byPhone = new Map<string, ExistingRow>();
  const byEmail = new Map<string, ExistingRow>();

  for (const row of existing) {
    if (row.phone && !byPhone.has(row.phone)) byPhone.set(row.phone, row);
    if (row.email && !byEmail.has(row.email.toLowerCase())) byEmail.set(row.email.toLowerCase(), row);
  }

  const inserts: Record<string, unknown>[] = [];
  const patches: Record<string, unknown>[] = [];
  let matched = 0;

  for (const row of unique) {
    const phone = row.phone.trim();
    const email = row.email.trim();
    const hit = (phone && byPhone.get(phone)) || (email && byEmail.get(email.toLowerCase())) || null;

    if (!hit) {
      inserts.push({ name: row.name.trim(), phone, email, address: row.address.trim(), profile_id: profileId });
      continue;
    }

    matched++;
    // Only fill gaps — an existing record is the better source for a field
    // it already has.
    const patch: Record<string, unknown> = {};

    if (!hit.email && email) patch.email = email;
    if (!hit.address && row.address.trim()) patch.address = row.address.trim();
    if (Object.keys(patch).length > 0) patches.push({ id: hit.id, profile_id: profileId, ...patch });
  }

  let imported = matched + collapsed;
  let done = 0;

  onProgress?.(0);

  for (const batch of chunk(inserts, IMPORT_CHUNK)) {
    const { error } = await client.from("customers").insert(batch);

    if (error) failed += batch.length;
    else imported += batch.length;
    done += batch.length;
    onProgress?.(done);
  }

  for (const batch of chunk(patches, IMPORT_CHUNK)) {
    await client.from("customers").upsert(batch);
  }

  onProgress?.(rows.length);

  return { imported, failed, error: null };
}

export type InventoryImportRow = Pick<InventoryItem, "name" | "sku" | "category" | "stock" | "low" | "cost" | "price">;

// Straight inserts, matching what the page has always done — inventory has no
// unique key on sku, so re-importing a file adds rows rather than updating
// them.
export async function sbBulkImportInventory(
  rows: InventoryImportRow[],
  onProgress?: (done: number) => void,
): Promise<BulkImportResult> {
  const client = getClient();

  if (!client) return { imported: 0, failed: rows.length, error: "Supabase not configured" };
  const profileId = await currentUserId();

  const named = rows.filter((r) => r.name.trim());
  let failed = rows.length - named.length;
  let imported = 0;
  let done = 0;

  onProgress?.(0);

  for (const batch of chunk(named, IMPORT_CHUNK)) {
    const { error } = await client.from("inventory").insert(batch.map((r) => ({ ...r, profile_id: profileId })));

    if (error) failed += batch.length;
    else imported += batch.length;
    done += batch.length;
    onProgress?.(done);
  }

  onProgress?.(rows.length);

  return { imported, failed, error: null };
}

// ─── Tickets ────────────────────────────────────────────────────────────────

// Every column except `signature` and `photos`. A signature is stored as a
// base64 data URL and photos as an array of them, so select("*") meant the
// ticket list downloaded every image in the shop's history to render a
// table that shows neither. They're fetched per ticket by sbFetchTicketMedia
// when one is actually opened.
const TICKET_LIST_COLUMNS =
  "id, profile_id, customer_id, device, device_model, device_description, issue, status, priority, price, " +
  "serial_number, warranty_days, warranty_start, notes, parts, payments, time_log, tracking, diagnostics, " +
  "due_date, labels, assigned_to, public_token, created_at, updated_at";

export async function sbFetchTickets(): Promise<{ data: Ticket[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("tickets")
    .select(TICKET_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  return { data: data as unknown as Ticket[] | null, error: error ? errMessage(error) : null };
}

// The two columns sbFetchTickets leaves out, for the ticket detail view.
export async function sbFetchTicketMedia(id: number): Promise<{ signature: string | null; photos: string[] }> {
  const client = getClient();

  if (!client) return { signature: null, photos: [] };
  const { data } = await client.from("tickets").select("signature, photos").eq("id", id).maybeSingle();
  const row = data as { signature: string | null; photos: unknown } | null;

  return { signature: row?.signature ?? null, photos: asArray<string>(row?.photos) };
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

export async function sbDeleteAppointment(id: number): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("appointments").delete().eq("id", id);

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

export async function sbDeleteHouseCall(id: number): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("house_calls").delete().eq("id", id);

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

// ─── Technicians (ticket assignment) ────────────────────────────────────────

export async function sbFetchTechnicians(): Promise<{ data: Technician[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("technicians").select("*").order("name", { ascending: true });

  return { data: data as Technician[] | null, error: error ? errMessage(error) : null };
}

export async function sbUpsertTechnician(
  patch: Partial<Technician> & { id?: number },
): Promise<{ data: Technician | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const row = { ...patch, profile_id: profileId };
  const { data, error } = await client.from("technicians").upsert(row).select().single();

  return { data: data as Technician | null, error: error ? errMessage(error) : null };
}

export async function sbDeleteTechnician(id: number): Promise<boolean> {
  const client = getClient();

  if (!client) return false;
  const { error } = await client.from("technicians").delete().eq("id", id);

  return !error;
}

// ─── Shop settings (business hours, tax rate, receipt footer, canned
// replies, customer-notification preferences) — one row per shop ──────────

const DEFAULT_SHOP_SETTINGS: Omit<ShopSettings, "profile_id" | "created_at" | "updated_at"> = {
  business_name: "",
  business_address: "",
  business_phone: "",
  business_hours: {},
  tax_rate: 0,
  tax_filing_frequency: "quarterly",
  income_tax_reserve_pct: 25,
  receipt_footer: "",
  notify_on_status_change: false,
  canned_responses: [],
};

export async function sbFetchShopSettings(): Promise<{ data: ShopSettings | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const userId = await currentUserId();

  if (!userId) return { data: null, error: "Not signed in" };
  const { data, error } = await client.from("shop_settings").select("*").eq("profile_id", userId).maybeSingle();

  if (error) return { data: null, error: errMessage(error) };
  if (data) return { data: data as ShopSettings, error: null };

  return { data: { ...DEFAULT_SHOP_SETTINGS, profile_id: userId, created_at: "", updated_at: "" }, error: null };
}

export async function sbUpdateShopSettings(patch: Partial<ShopSettings>): Promise<{ data: ShopSettings | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const userId = await currentUserId();

  if (!userId) return { data: null, error: "Not signed in" };
  const { data, error } = await client
    .from("shop_settings")
    .upsert({ ...patch, profile_id: userId })
    .select()
    .single();

  return { data: data as ShopSettings | null, error: error ? errMessage(error) : null };
}

// ─── POS sales (retail checkout, /pos) ──────────────────────────────────────

export async function sbFetchPosSales(limit?: number): Promise<{ data: PosSale[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const query = client.from("pos_sales").select("*").order("created_at", { ascending: false });
  const { data, error } = await (limit ? query.limit(limit) : query);

  return { data: data as PosSale[] | null, error: error ? errMessage(error) : null };
}

// Refunding or voiding a sale is a status change, not a delete — Accounting
// reads these: `completed` counts as revenue, `refunded` drops out of revenue
// and into the period's refund total, `voided` drops out entirely.
export async function sbUpdatePosSale(
  id: number,
  patch: Partial<Pick<PosSale, "status" | "note">>,
): Promise<{ data: PosSale | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client.from("pos_sales").update(patch).eq("id", id).select().single();

  return { data: data as PosSale | null, error: error ? errMessage(error) : null };
}

export async function sbCreatePosSale(
  sale: Omit<PosSale, "id" | "profile_id" | "created_at">,
): Promise<{ data: PosSale | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const profileId = await currentUserId();
  const { data, error } = await client.from("pos_sales").insert({ ...sale, profile_id: profileId }).select().single();

  return { data: data as PosSale | null, error: error ? errMessage(error) : null };
}

// ─── Website orders (shared with mobicare-business, read for Accounting) ───
// `orders` (+ its order_items child rows) is owned and written by the
// storefront's checkout flow (Stripe-only). Same RLS shape as `bookings`:
// an admin account (a row in public.staff_users) can read every order;
// anyone else gets none back silently, not an error. See README.

export async function sbFetchWebsiteOrders(): Promise<{ data: WebsiteOrder[] | null; error: string | null }> {
  const client = getClient();

  if (!client) return { data: null, error: "Supabase not configured" };
  const { data, error } = await client
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return { data: data as WebsiteOrder[] | null, error: error ? errMessage(error) : null };
}

// ─── Notification badge counts ─────────────────────────────────────────────
// The header bell polls this on a timer from every page, so it must stay
// cheap: three of the four are `head: true` count queries that transfer no
// rows at all. Low stock is the exception — PostgREST can't compare two
// columns (`stock <= low`) in a filter, so it reads just those two integers
// per item and counts client-side, which is still a fraction of a full
// inventory row with its text and timestamps.

// ─── Dashboard summary ──────────────────────────────────────────────────────
// The dashboard used to pull eight whole tables with select("*") and derive
// everything client-side, which meant shipping every ticket's signature data
// URL and every message body just to render a handful of counts. Each figure
// is now asked for directly: counts come back as head requests with no rows
// at all, and the two lists are date-filtered and limited server-side.
//
// Inventory's low-stock figure reads the is_low column generated in Postgres
// (see 20260906_list_views.sql) — PostgREST can't compare stock <= low itself.

export interface DashboardTicket {
  id: number;
  device: string;
  device_model: string;
  issue: string;
  status: string;
  updated_at: string;
  customer_name: string;
}

export interface DashboardEntry {
  key: string;
  kind: "appointment" | "house_call" | "booking";
  title: string;
  date: string;
  time: string;
}

export interface DashboardSummary {
  openTickets: number;
  activeValue: number;
  customers: number;
  inventoryCount: number;
  lowStock: number;
  pendingBookings: number;
  unreadMail: number;
  unreadChats: number;
  recentTickets: DashboardTicket[];
  schedule: DashboardEntry[];
}

const EMPTY_DASHBOARD: DashboardSummary = {
  openTickets: 0,
  activeValue: 0,
  customers: 0,
  inventoryCount: 0,
  lowStock: 0,
  pendingBookings: 0,
  unreadMail: 0,
  unreadChats: 0,
  recentTickets: [],
  schedule: [],
};

// A few more upcoming rows than the six the panel shows, so the client-side
// merge of the three sources still has candidates to choose from.
const SCHEDULE_FETCH_LIMIT = 12;

export async function sbFetchDashboard(): Promise<DashboardSummary> {
  const client = getClient();

  if (!client) return EMPTY_DASHBOARD;

  const today = toDateKey(new Date());

  const [open, recent, customers, inventoryCount, lowStock, pending, mail, chats, appts, calls, upcomingBookings] = await Promise.all([
    // Only the price column: enough for both the open count and their value.
    client.from("tickets").select("price").not("status", "in", "(Completed,Delivered)"),
    client
      .from("tickets")
      .select("id, device, device_model, issue, status, updated_at, customers(name)")
      .order("updated_at", { ascending: false })
      .limit(6),
    client.from("customers").select("id", { count: "exact", head: true }),
    client.from("inventory").select("id", { count: "exact", head: true }),
    client.from("inventory").select("id", { count: "exact", head: true }).eq("is_low", true),
    client.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("messages").select("id", { count: "exact", head: true }).eq("direction", "inbound").eq("read", false),
    client.from("customer_messages").select("id", { count: "exact", head: true }).eq("direction", "inbound").eq("read", false),
    client.from("appointments").select("id, title, date, time").gte("date", today).order("date").limit(SCHEDULE_FETCH_LIMIT),
    client.from("house_calls").select("id, description, date, time").gte("date", today).order("date").limit(SCHEDULE_FETCH_LIMIT),
    client
      .from("bookings")
      .select("id, customer_name, service, device_type, appt_date, appt_time")
      .eq("status", "pending")
      .gte("appt_date", today)
      .order("appt_date")
      .limit(SCHEDULE_FETCH_LIMIT),
  ]);

  const openRows = (open.data as { price: number | string }[] | null) || [];

  // The embedded customer arrives as an object, or as a one-element array on
  // older PostgREST versions; either way there is at most one.
  type RecentRow = Omit<DashboardTicket, "customer_name"> & {
    customers: { name: string } | { name: string }[] | null;
  };

  const recentTickets = ((recent.data as RecentRow[] | null) || []).map((row) => {
    const joined = Array.isArray(row.customers) ? row.customers[0] : row.customers;

    return {
      id: row.id,
      device: row.device,
      device_model: row.device_model,
      issue: row.issue,
      status: row.status,
      updated_at: row.updated_at,
      customer_name: joined?.name || "",
    };
  });

  const apptRows = (appts.data as { id: number; title: string; date: string; time: string }[] | null) || [];
  const callRows = (calls.data as { id: number; description: string; date: string; time: string }[] | null) || [];
  const bookingRows = (upcomingBookings.data as BookingRecord[] | null) || [];

  const schedule: DashboardEntry[] = [
    ...apptRows.map((a) => ({
      key: `apt-${a.id}`,
      kind: "appointment" as const,
      title: a.title || "Appointment",
      date: a.date || "",
      time: a.time || "",
    })),
    ...callRows.map((h) => ({
      key: `hc-${h.id}`,
      kind: "house_call" as const,
      title: h.description || "House call",
      date: h.date || "",
      time: h.time || "",
    })),
    ...bookingRows.map((b) => ({
      key: `bk-${b.id}`,
      kind: "booking" as const,
      title: `${b.customer_name} — ${b.service || b.device_type}`,
      date: b.appt_date || "",
      time: b.appt_time || "",
    })),
  ]
    .sort(compareDateTime)
    .slice(0, 6);

  return {
    openTickets: openRows.length,
    activeValue: openRows.reduce((sum, t) => sum + Number(t.price || 0), 0),
    customers: customers.count || 0,
    inventoryCount: inventoryCount.count || 0,
    lowStock: lowStock.count || 0,
    pendingBookings: pending.count || 0,
    unreadMail: mail.count || 0,
    unreadChats: chats.count || 0,
    recentTickets,
    schedule,
  };
}

export interface NotificationCounts {
  pendingBookings: number;
  lowStock: number;
  unreadMail: number;
  unreadChats: number;
}

export async function sbFetchNotificationCounts(): Promise<NotificationCounts> {
  const client = getClient();
  const empty: NotificationCounts = { pendingBookings: 0, lowStock: 0, unreadMail: 0, unreadChats: 0 };

  if (!client) return empty;

  const [bookings, lowStock, mail, chats] = await Promise.all([
    client.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    // is_low is generated in Postgres, so this counts without returning rows.
    client.from("inventory").select("id", { count: "exact", head: true }).eq("is_low", true),
    client.from("messages").select("id", { count: "exact", head: true }).eq("direction", "inbound").eq("read", false),
    client.from("customer_messages").select("id", { count: "exact", head: true }).eq("direction", "inbound").eq("read", false),
  ]);

  return {
    pendingBookings: bookings.count || 0,
    lowStock: lowStock.count || 0,
    unreadMail: mail.count || 0,
    unreadChats: chats.count || 0,
  };
}

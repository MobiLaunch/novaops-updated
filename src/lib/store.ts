import { create } from "zustand";

import { isNetworkError, queueSale } from "@/lib/offlineQueue";
import { getSupabase } from "@/lib/supabase";
import { printBarcodeLabel } from "@/lib/print";
import type { Appointment, Customer, Expense, InventoryItem, Ticket } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface HouseCall {
  id: number | string;
  profile_id?: string;
  customerId: number;
  description?: string;
  address?: string;
  date?: string;
  time?: string;
  status?: string;
  notes?: string;
}

export interface VendorRepair {
  id: number | string;
  profile_id?: string;
  customerId: number;
  device?: string;
  issue?: string;
  vendor?: string;
  ticketRef?: string;
  trackingNumber?: string;
  status?: string;
  sentDate?: string | null;
  estReturn?: string | null;
  notes?: string;
}

export interface AppSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  statuses: string;
  pin: string;
  squareAccessToken: string;
  squareLocationId: string;
  squareApplicationId: string;
  squareSandbox: boolean;
}

export interface NotificationPrefs {
  newTicket: boolean;
  newSale: boolean;
  newCustomer: boolean;
  appointment: boolean;
  newMessage: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "",
  email: "",
  phone: "",
  address: "",
  currency: "$",
  taxRate: 0,
  statuses: "Open, In Progress, Waiting for Parts, Completed, Delivered",
  pin: "1234",
  squareAccessToken: "",
  squareLocationId: "",
  squareApplicationId: "",
  squareSandbox: false,
};

const SQUARE_CACHE = "novaops_square_config";

// ── Row normalisers: Supabase snake_case → the camelCase the UI expects ───────
const normalizeTicket = (t: any): Ticket => ({
  ...t,
  customerId: t.customer_id ?? t.customerId,
  createdAt: t.created_at ?? t.createdAt,
  updatedAt: t.updated_at ?? t.updatedAt,
  serialNumber: t.serial_number ?? t.serialNumber ?? "",
  warrantyDays: t.warranty_days ?? t.warrantyDays ?? 0,
  warrantyStart: t.warranty_start ?? t.warrantyStart ?? null,
  deviceModel: t.device_model ?? t.deviceModel ?? "",
  timeLog: t.time_log ?? t.timeLog ?? [],
  photos: t.photos ?? [],
  notes: t.notes ?? [],
  parts: t.parts ?? [],
  payments: t.payments ?? [],
  priority: t.priority ?? "normal",
  status: t.status ?? "Open",
  price: t.price ?? 0,
  tracking: t.tracking ?? null,
  signature: t.signature ?? null,
});

const normalizeCustomer = (c: any): Customer => ({
  ...c,
  driversLicense: c.drivers_license ?? c.driversLicense ?? "",
  tags: c.tags ?? [],
  notes: c.notes ?? "",
});

const normalizeInventory = (i: any): InventoryItem & Record<string, any> => ({
  ...i,
  sku: i.sku ?? "",
  low: i.low ?? i.min_stock ?? 5,
  cost: i.cost ?? 0,
  price: i.price ?? 0,
  stock: i.stock ?? 0,
  category: i.category ?? "Parts",
  itemType: i.item_type ?? i.itemType ?? "product",
  description: i.description ?? "",
});

const normalizeHouseCall = (h: any): HouseCall => ({ ...h, customerId: h.customer_id ?? h.customerId });

const normalizeVendorRepair = (r: any): VendorRepair => ({
  ...r,
  customerId: r.customer_id ?? r.customerId,
  ticketRef: r.ticket_ref ?? r.ticketRef ?? "",
  trackingNumber: r.tracking_number ?? r.trackingNumber ?? "",
  sentDate: r.sent_date ?? r.sentDate ?? null,
  estReturn: r.est_return ?? r.estReturn ?? null,
});

const normalizeAppointment = (a: any): Appointment => ({ ...a, customerId: a.customer_id ?? a.customerId });

const needSb = () => {
  const sb = getSupabase();

  if (!sb) throw new Error("Supabase not configured");

  return sb;
};

// Rename camelCase update keys to their snake_case column names.
function toColumns(updates: Record<string, any>, map: Record<string, string>) {
  const out: Record<string, any> = { ...updates };

  for (const [camel, snake] of Object.entries(map)) {
    if (updates[camel] !== undefined) {
      out[snake] = updates[camel];
      delete out[camel];
    }
  }

  return out;
}

interface AppState {
  tickets: Ticket[];
  customers: Customer[];
  inventory: Array<InventoryItem & Record<string, any>>;
  houseCalls: HouseCall[];
  vendorRepairs: VendorRepair[];
  appointments: Appointment[];
  quickSales: any[];
  services: any[];
  expenses: Expense[];
  settings: AppSettings;
  settingsRowId: number | null;
  notificationPrefs: NotificationPrefs;
  user: any;
  isLoaded: boolean;
  isLoading: boolean;
  trackedDevices: string[];

  supabaseReady: () => boolean;
  /** Patch settings in memory (pages edit settings, then call saveSettings/saveAll). */
  patchSettings: (patch: Partial<AppSettings>) => void;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => void;
  setupAuthListener: (onSignedOut: () => void) => () => void;
  checkAuth: () => Promise<any>;
  initializeData: () => Promise<void>;
  logout: () => Promise<void>;

  createTicket: (data: any) => Promise<any>;
  updateTicket: (id: number, updates: any) => Promise<any>;
  updateTicketStatus: (id: number, status: string) => Promise<any>;
  deleteTicket: (id: number) => Promise<void>;
  createInventoryItem: (item: any) => Promise<any>;
  updateInventoryItem: (id: number, updates: any) => Promise<any>;
  deleteInventoryItem: (id: number) => Promise<void>;
  createHouseCall: (call: any) => Promise<any>;
  updateHouseCall: (id: any, updates: any) => Promise<any>;
  deleteHouseCall: (id: any) => Promise<void>;
  createVendorRepair: (repair: any) => Promise<any>;
  updateVendorRepair: (id: any, updates: any) => Promise<any>;
  deleteVendorRepair: (id: any) => Promise<void>;
  createAppointment: (appt: any) => Promise<any>;
  updateAppointment: (id: any, updates: any) => Promise<any>;
  deleteAppointment: (id: any) => Promise<void>;
  createCustomer: (c: any) => Promise<any>;
  updateCustomer: (id: number, updates: any) => Promise<any>;
  deleteCustomer: (id: number) => Promise<void>;
  createService: (item: any) => Promise<any>;
  updateService: (id: any, updates: any) => Promise<any>;
  deleteService: (id: any) => Promise<void>;
  createExpense: (item: any) => Promise<any>;
  deleteExpense: (id: any) => Promise<void>;
  createPosSale: (sale: {
    customerId?: number | null;
    items: Array<{ name: string; price: number; quantity: number; sku?: string }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    note?: string;
  }) => Promise<any>;
  saveSettings: (patch?: Partial<AppSettings>) => Promise<void>;
  saveAll: () => Promise<void>;
  saveSquareConfig: () => Promise<void>;
  trackDevice: (device: string) => void;
}

const EMPTY_DATA = {
  tickets: [] as Ticket[],
  customers: [] as Customer[],
  inventory: [] as any[],
  houseCalls: [] as HouseCall[],
  vendorRepairs: [] as VendorRepair[],
  appointments: [] as Appointment[],
  services: [] as any[],
  expenses: [] as Expense[],
  quickSales: [] as any[],
  isLoaded: false,
};

function readNotificationPrefs(): NotificationPrefs {
  const base: NotificationPrefs = { newTicket: true, newSale: true, newCustomer: false, appointment: true, newMessage: true };

  try {
    const stored = localStorage.getItem("novaops_notif_prefs");

    if (stored) Object.assign(base, JSON.parse(stored));
  } catch { /* ignore */ }

  return base;
}

export const useAppStore = create<AppState>((set, get) => {
  const uid = () => {
    const u = get().user;

    if (!u) throw new Error("Not authenticated");

    return u.id as string;
  };

  // Generic list updaters
  const upsertAt = <K extends "tickets" | "customers" | "inventory" | "houseCalls" | "vendorRepairs" | "appointments" | "services">(key: K, row: any, id: any) => {
    set((s) => ({ [key]: (s[key] as any[]).map((r) => (r.id === id ? row : r)) }) as Partial<AppState>);
  };

  const removeFrom = <K extends "tickets" | "customers" | "inventory" | "houseCalls" | "vendorRepairs" | "appointments" | "services" | "expenses">(key: K, id: any) => {
    set((s) => ({ [key]: (s[key] as any[]).filter((r) => r.id !== id) }) as Partial<AppState>);
  };

  const handleRealtime = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord, table } = payload;
    const me = get().user?.id;

    // DELETE events sometimes carry only the primary key, so let those through.
    if (newRecord?.profile_id !== me && oldRecord?.profile_id !== me && eventType !== "DELETE") return;

    const map: Record<string, { key: any; normalize: (r: any) => any }> = {
      tickets: { key: "tickets", normalize: normalizeTicket },
      customers: { key: "customers", normalize: normalizeCustomer },
      inventory: { key: "inventory", normalize: normalizeInventory },
      house_calls: { key: "houseCalls", normalize: normalizeHouseCall },
      vendor_repairs: { key: "vendorRepairs", normalize: normalizeVendorRepair },
      appointments: { key: "appointments", normalize: normalizeAppointment },
    };
    const target = map[table];

    if (!target) return;

    set((s) => {
      const list = s[target.key as keyof AppState] as any[];

      if (eventType === "INSERT") {
        if (list.some((r) => r.id === newRecord.id)) return {};

        return { [target.key]: [target.normalize(newRecord), ...list] } as Partial<AppState>;
      }
      if (eventType === "UPDATE") return { [target.key]: list.map((r) => (r.id === newRecord.id ? target.normalize(newRecord) : r)) } as Partial<AppState>;
      if (eventType === "DELETE") return { [target.key]: list.filter((r) => r.id !== oldRecord.id) } as Partial<AppState>;

      return {};
    });
  };

  return {
    ...EMPTY_DATA,
    services: [],
    settings: { ...DEFAULT_SETTINGS },
    settingsRowId: null,
    notificationPrefs: readNotificationPrefs(),
    user: null,
    isLoading: false,
    trackedDevices: [],

    supabaseReady: () => !!getSupabase(),
    patchSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    setNotificationPrefs: (patch) => {
      const next = { ...get().notificationPrefs, ...patch };

      set({ notificationPrefs: next });
      try { localStorage.setItem("novaops_notif_prefs", JSON.stringify(next)); } catch { /* ignore */ }
    },

    checkAuth: async () => {
      const sb = getSupabase();

      if (!sb) return null;
      // getSession() restores from storage first; getUser() then validates with the server.
      const { data: { session } } = await sb.auth.getSession();

      if (!session) return null;

      const { data: { user } } = await sb.auth.getUser();

      set({ user });

      return user;
    },

    // Subscribe to auth state so data loads as soon as Supabase restores the session.
    setupAuthListener: (onSignedOut) => {
      const sb = getSupabase();

      if (!sb) return () => undefined;

      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
          set({ user: session.user });
          if (!get().isLoaded) void get().initializeData();
        }
        if (event === "SIGNED_OUT") {
          set({ user: null, ...EMPTY_DATA });
          onSignedOut();
        }
      });

      return () => data.subscription.unsubscribe();
    },

    initializeData: async () => {
      const sb = getSupabase();

      if (!sb) {
        console.warn("[NovaOps] Supabase not configured. Running in offline mode.");

        return;
      }
      if (!get().user && !(await get().checkAuth())) return;

      const id = get().user!.id;

      if (get().isLoaded) return;

      set({ isLoading: true });

      try {
        const [t, c, i, h, vr, a, p, svc, bsRow, expRows, sqRow] = await Promise.all([
          sb.from("tickets").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
          sb.from("customers").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
          sb.from("inventory").select("*").eq("profile_id", id).order("name", { ascending: true }),
          sb.from("house_calls").select("*").eq("profile_id", id).order("date", { ascending: true }),
          sb.from("vendor_repairs").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
          sb.from("appointments").select("*").eq("profile_id", id).order("date", { ascending: true }),
          sb.from("profiles").select("*").eq("id", id).single(),
          sb.from("services").select("*").eq("profile_id", id).order("name", { ascending: true }),
          sb.from("settings").select("*").eq("profile_id", id).maybeSingle(),
          sb.from("expenses").select("*").eq("profile_id", id).order("date", { ascending: false }),
          sb.from("square_config").select("*").eq("profile_id", id).maybeSingle(),
        ]);

        let settings = { ...get().settings };
        let settingsRowId = get().settingsRowId;
        const bs = (bsRow as any)?.data;

        if (bs) {
          settings = {
            ...settings,
            businessName: bs.business_name || "",
            email: bs.email || "",
            phone: String(bs.phone || ""),
            address: bs.address || "",
            currency: bs.currency || "$",
            taxRate: bs.tax_rate || 0,
            statuses: bs.statuses || "Open, In Progress, Completed",
          };
          settingsRowId = bs.id;
        }

        // Square config from its table, with a localStorage fallback.
        const sq = (sqRow as any)?.data;

        if (sq?.access_token && sq?.location_id) {
          settings = { ...settings, squareAccessToken: sq.access_token || "", squareLocationId: sq.location_id || "", squareApplicationId: sq.application_id || "", squareSandbox: sq.sandbox ?? false };
          try {
            localStorage.setItem(SQUARE_CACHE, JSON.stringify({ access_token: sq.access_token, location_id: sq.location_id, application_id: sq.application_id || "", sandbox: sq.sandbox }));
          } catch { /* ignore */ }
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem(SQUARE_CACHE) || "null");

            if (cached?.access_token && cached?.location_id) {
              settings = { ...settings, squareAccessToken: cached.access_token || "", squareLocationId: cached.location_id || "", squareApplicationId: cached.application_id || "", squareSandbox: cached.sandbox ?? false };
            }
          } catch { /* ignore */ }
        }

        // The PIN is the only thing still read from profiles.
        if ((p as any).data) settings = { ...settings, pin: (p as any).data.pin || "1234" };

        set({
          tickets: ((t.data as any[]) || []).map(normalizeTicket),
          customers: ((c.data as any[]) || []).map(normalizeCustomer),
          inventory: ((i.data as any[]) || []).map(normalizeInventory),
          houseCalls: ((h.data as any[]) || []).map(normalizeHouseCall),
          vendorRepairs: ((vr.data as any[]) || []).map(normalizeVendorRepair),
          appointments: ((a.data as any[]) || []).map(normalizeAppointment),
          services: (svc.data as any[]) || [],
          expenses: ((expRows as any)?.data as Expense[]) || [],
          settings,
          settingsRowId,
          isLoaded: true,
        });

        sb.channel("business-live").on("postgres_changes", { event: "*", schema: "public" }, handleRealtime).subscribe();
      } catch (error) {
        console.error("[NovaOps] Failed to load data:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      const sb = getSupabase();

      if (sb) await sb.auth.signOut();
      set({ user: null, ...EMPTY_DATA });
    },

    // ── Tickets ──────────────────────────────────────────────────────────────
    createTicket: async (d) => {
      const sb = needSb();
      const profile_id = uid();
      const { data, error } = await sb.from("tickets").insert({
        profile_id,
        customer_id: d.customerId,
        device: d.device,
        device_model: d.deviceModel || "",
        device_description: d.deviceDescription || "",
        issue: d.issue,
        status: d.status || "Open",
        price: d.price || 0,
        serial_number: d.serialNumber || "",
        warranty_days: d.warrantyDays || 0,
        warranty_start: d.warrantyStart || null,
        photos: d.photos || [],
        signature: d.signature || null,
        notes: d.notes || [],
        parts: d.parts || [],
        payments: d.payments || [],
        time_log: d.timeLog || [],
        priority: d.priority || "normal",
        tracking: d.tracking || null,
      }).select().single();

      if (error) {
        console.error("[Ticket Creation Error]:", error);
        throw error;
      }

      set((s) => ({ tickets: [normalizeTicket(data), ...s.tickets] }));

      // Auto-print a barcode label when the shop has enabled it.
      try {
        const printer = JSON.parse(localStorage.getItem("novaops_printer_settings") || "{}");

        if (printer.autoPrintBarcode) {
          const customer = get().customers.find((c) => c.id === d.customerId);

          printBarcodeLabel({
            sku: `TKT-${(data as any).id}`,
            name: `${d.device} ${d.deviceModel || ""}`.trim(),
            customerName: customer ? customer.name : "Walk-in",
            price: d.price || 0,
            currency: get().settings.currency || "$",
          }).catch((e: unknown) => console.warn("Failed to auto-print label:", e));
        }
      } catch (e) {
        console.warn("Could not read printer settings for auto-print", e);
      }

      return data;
    },
    updateTicket: async (id, updates) => {
      const { data, error } = await needSb().from("tickets").update(updates).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("tickets", normalizeTicket(data), id);

      return data;
    },
    updateTicketStatus: (id, status) => get().updateTicket(id, { status }),
    deleteTicket: async (id) => {
      const { error } = await needSb().from("tickets").delete().eq("id", id);

      if (error) throw error;
      removeFrom("tickets", id);
    },

    // ── Inventory ────────────────────────────────────────────────────────────
    createInventoryItem: async (item) => {
      const sb = needSb();
      const { data, error } = await sb.from("inventory").insert({
        profile_id: uid(),
        name: item.name,
        sku: item.sku || "",
        category: item.category || "Parts",
        stock: item.itemType === "service" ? 9999 : item.stock || 0,
        low: item.itemType === "service" ? 0 : item.low || 5,
        cost: item.cost || 0,
        price: item.price || 0,
        model: item.model || "",
        item_type: item.itemType || "product",
        description: item.description || "",
      }).select().single();

      if (error) throw error;

      const row = normalizeInventory(data);

      set((s) => ({ inventory: [...s.inventory, row] }));

      return row;
    },
    updateInventoryItem: async (id, updates) => {
      const { data, error } = await needSb().from("inventory").update(updates).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("inventory", normalizeInventory(data), id);

      return data;
    },
    deleteInventoryItem: async (id) => {
      const { error } = await needSb().from("inventory").delete().eq("id", id);

      if (error) throw error;
      removeFrom("inventory", id);
    },

    // ── House calls ──────────────────────────────────────────────────────────
    createHouseCall: async (call) => {
      const { data, error } = await needSb().from("house_calls").insert({
        profile_id: uid(),
        customer_id: call.customerId,
        description: call.description || "",
        address: call.address || "",
        date: call.date || null,
        time: call.time || "",
        status: call.status || "scheduled",
        notes: call.notes || "",
      }).select().single();

      if (error) throw error;
      set((s) => ({ houseCalls: [...s.houseCalls, normalizeHouseCall(data)] }));

      return data;
    },
    updateHouseCall: async (id, updates) => {
      const payload = toColumns(updates, { customerId: "customer_id" });
      const { data, error } = await needSb().from("house_calls").update(payload).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("houseCalls", normalizeHouseCall(data), id);

      return data;
    },
    deleteHouseCall: async (id) => {
      const { error } = await needSb().from("house_calls").delete().eq("id", id);

      if (error) throw error;
      removeFrom("houseCalls", id);
    },

    // ── Vendor repairs ───────────────────────────────────────────────────────
    createVendorRepair: async (r) => {
      const { data, error } = await needSb().from("vendor_repairs").insert({
        profile_id: uid(),
        customer_id: r.customerId,
        device: r.device || "",
        issue: r.issue || "",
        vendor: r.vendor || "",
        ticket_ref: r.ticketRef || "",
        tracking_number: r.trackingNumber || "",
        status: r.status || "Preparing to Ship",
        sent_date: r.sentDate || null,
        est_return: r.estReturn || null,
        notes: r.notes || "",
      }).select().single();

      if (error) throw error;
      set((s) => ({ vendorRepairs: [normalizeVendorRepair(data), ...s.vendorRepairs] }));

      return data;
    },
    updateVendorRepair: async (id, updates) => {
      const payload = toColumns(updates, { customerId: "customer_id", ticketRef: "ticket_ref", trackingNumber: "tracking_number", sentDate: "sent_date", estReturn: "est_return" });
      const { data, error } = await needSb().from("vendor_repairs").update(payload).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("vendorRepairs", normalizeVendorRepair(data), id);

      return data;
    },
    deleteVendorRepair: async (id) => {
      const { error } = await needSb().from("vendor_repairs").delete().eq("id", id);

      if (error) throw error;
      removeFrom("vendorRepairs", id);
    },

    // ── Appointments ─────────────────────────────────────────────────────────
    createAppointment: async (appt) => {
      const { data, error } = await needSb().from("appointments").insert({
        profile_id: uid(),
        customer_id: appt.customerId,
        title: appt.title || "",
        description: appt.description || "",
        date: appt.date || null,
        time: appt.time || "",
        status: appt.status || "scheduled",
        notes: appt.notes || "",
      }).select().single();

      if (error) throw error;
      set((s) => ({ appointments: [...s.appointments, normalizeAppointment(data)] }));

      return data;
    },
    updateAppointment: async (id, updates) => {
      const payload = toColumns(updates, { customerId: "customer_id" });
      const { data, error } = await needSb().from("appointments").update(payload).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("appointments", normalizeAppointment(data), id);

      return data;
    },
    deleteAppointment: async (id) => {
      const { error } = await needSb().from("appointments").delete().eq("id", id);

      if (error) throw error;
      removeFrom("appointments", id);
    },

    // ── Customers ────────────────────────────────────────────────────────────
    createCustomer: async (c) => {
      const { data, error } = await needSb().from("customers").insert({
        profile_id: uid(),
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        drivers_license: c.driversLicense || "",
        address: c.address || "",
        tags: c.tags || [],
        notes: c.notes || "",
      }).select().single();

      if (error) throw error;
      set((s) => ({ customers: [normalizeCustomer(data), ...s.customers] }));

      return data;
    },
    updateCustomer: async (id, updates) => {
      const payload = toColumns(updates, { driversLicense: "drivers_license" });
      const { data, error } = await needSb().from("customers").update(payload).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("customers", normalizeCustomer(data), id);

      return data;
    },
    deleteCustomer: async (id) => {
      const { error } = await needSb().from("customers").delete().eq("id", id);

      if (error) throw error;
      removeFrom("customers", id);
    },

    // ── Services ─────────────────────────────────────────────────────────────
    createService: async (item) => {
      const { data, error } = await needSb().from("services").insert({
        profile_id: uid(),
        name: item.name,
        category: item.category || "Services",
        description: item.description || "",
        price: item.price || 0,
        estimated_minutes: item.estimated_minutes || 0,
        duration: item.estimated_minutes || 0,
        active: item.active ?? true,
      }).select().single();

      if (error) throw error;
      set((s) => ({ services: [...s.services, data] }));

      return data;
    },
    updateService: async (id, updates) => {
      const { data, error } = await needSb().from("services").update(updates).eq("id", id).select().single();

      if (error) throw error;
      upsertAt("services", data, id);

      return data;
    },
    deleteService: async (id) => {
      const { error } = await needSb().from("services").delete().eq("id", id);

      if (error) throw error;
      removeFrom("services", id);
    },

    // ── Expenses ─────────────────────────────────────────────────────────────
    createExpense: async (item) => {
      const { data, error } = await needSb().from("expenses").insert({
        profile_id: uid(),
        description: item.description || "",
        amount: item.amount || 0,
        category: item.category || "Overhead",
        date: item.date || new Date().toISOString().split("T")[0],
      }).select().single();

      if (error) throw error;
      set((s) => ({ expenses: [data as Expense, ...s.expenses] }));

      return data;
    },
    deleteExpense: async (id) => {
      const { error } = await needSb().from("expenses").delete().eq("id", id);

      if (error) throw error;
      removeFrom("expenses", id);
    },

    // ── POS sales ────────────────────────────────────────────────────────────
    // Regular POS transactions live in `pos_sales`, not `tickets` (tickets are repair
    // jobs). Collecting payment on an existing ticket still updates that ticket's
    // payments array, which the POS page does after calling this.
    createPosSale: async (sale) => {
      const row = {
        profile_id: uid(),
        customer_id: sale.customerId || null,
        items: sale.items,
        subtotal: sale.subtotal,
        tax: sale.tax,
        total: sale.total,
        payment_method: sale.paymentMethod,
        note: sale.note || "",
        status: "completed",
      };
      let res: { data: any; error: any };

      try {
        res = await needSb().from("pos_sales").insert(row).select().single();
      } catch (e) {
        res = { data: null, error: e };
      }

      if (res.error) {
        // Connection dropped: keep the sale on this device and sync it later.
        if (isNetworkError(res.error)) return { id: queueSale(row), offline: true, ...row };
        throw res.error;
      }

      return res.data;
    },

    // ── Settings ─────────────────────────────────────────────────────────────
    saveSettings: async (patch) => {
      const sb = getSupabase();

      if (!sb) throw new Error("Supabase not configured. Go to Settings → Database connection.");
      if (!get().user) throw new Error("Not authenticated. Please log in first.");

      if (patch) set((s) => ({ settings: { ...s.settings, ...patch } }));

      const s = get().settings;

      // PIN is persisted locally for cross-tab lock-screen access.
      if (s.pin) {
        try { localStorage.setItem("novaops_pin", s.pin); } catch { /* ignore */ }
      }

      const payload: Record<string, any> = {
        business_name: s.businessName,
        email: s.email,
        phone: s.phone,
        address: s.address,
        currency: s.currency,
        tax_rate: s.taxRate,
        statuses: s.statuses,
      };

      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const rowId = get().settingsRowId;

      if (rowId) {
        const res = await sb.from("settings").update(payload).eq("id", rowId);

        if (res.error) {
          console.error("[saveSettings] Settings table error:", JSON.stringify(res.error));
          throw new Error(res.error.message || "Failed to save business settings");
        }
      } else {
        const res = await sb.from("settings").insert({ ...payload, profile_id: get().user.id }).select().single();

        if (res.error) {
          console.error("[saveSettings] Settings table error:", JSON.stringify(res.error));
          throw new Error(res.error.message || "Failed to save business settings");
        }
        if (res.data) set({ settingsRowId: (res.data as any).id });
      }
    },
    // Persists business settings; for pages that mutate settings directly first.
    saveAll: async () => {
      needSb();
      uid();
      await get().saveSettings({ ...get().settings });
    },

    saveSquareConfig: async () => {
      const sb = needSb();
      const s = get().settings;
      const payload = {
        profile_id: uid(),
        access_token: s.squareAccessToken,
        location_id: s.squareLocationId,
        application_id: s.squareApplicationId || "",
        sandbox: s.squareSandbox,
      };
      const { error } = await sb.from("square_config").upsert(payload, { onConflict: "profile_id" });

      if (error) {
        console.error("[saveSquareConfig] Error:", JSON.stringify(error));
        throw error;
      }
      if (payload.access_token && payload.location_id) {
        try {
          localStorage.setItem(SQUARE_CACHE, JSON.stringify({ access_token: payload.access_token, location_id: payload.location_id, application_id: payload.application_id, sandbox: payload.sandbox }));
        } catch { /* ignore */ }
      }
    },

    trackDevice: (device) => {
      if (device && !get().trackedDevices.includes(device)) set((s) => ({ trackedDevices: [...s.trackedDevices, device] }));
    },
  };
});

import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const KEY = "novaops_offline_sales";

interface Entry { id: string; sale: Record<string, any>; stock: { id: number; qty: number }[]; queuedAt: string }

const read = (): Entry[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const write = (e: Entry[]) => { try { localStorage.setItem(KEY, JSON.stringify(e)); } catch { /* storage full or blocked */ } window.dispatchEvent(new Event("novaops-queue")); };

/** True when the error looks like the network failing, not the database refusing the request. */
export function isNetworkError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err ?? "");

  return !navigator.onLine || /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout/i.test(msg);
}

/** Keeps a sale on this device until the connection is back. Returns a local id for the receipt. */
export function queueSale(sale: Record<string, any>): string {
  const id = `offline-${Date.now().toString(36)}`;

  write([...read(), { id, sale, stock: [], queuedAt: new Date().toISOString() }]);

  return id;
}

export function attachStock(id: string, stock: { id: number; qty: number }[]) {
  write(read().map((e) => (e.id === id ? { ...e, stock } : e)));
}

export const pendingCount = () => read().length;

let flushing = false;

/** Sends queued sales and their stock deductions. Stops at the first network failure and tries again later. */
export async function flushQueue(): Promise<number> {
  const sb = getSupabase();

  if (!sb || flushing || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0;

  try {
    for (const entry of read()) {
      const { error } = await sb.from("pos_sales").insert(entry.sale);

      if (error) { if (isNetworkError(error)) break; console.warn("[offline] sale rejected", error.message); }
      for (const d of entry.stock) {
        const { data } = await sb.from("inventory").select("stock").eq("id", d.id).maybeSingle();

        if (data) await sb.from("inventory").update({ stock: Math.max(0, (data.stock ?? 0) - d.qty) }).eq("id", d.id);
      }
      write(read().filter((e) => e.id !== entry.id));
      sent++;
    }
  } finally {
    flushing = false;
  }

  return sent;
}

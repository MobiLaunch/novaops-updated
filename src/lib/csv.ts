import { getSupabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);

  // Stop spreadsheet apps from treating text as a formula.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;

  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(name: string, header: string[], rows: unknown[][]) {
  const text = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");

  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const exportCustomers = () => downloadCsv("customers", ["Name", "Email", "Phone", "Address"], useAppStore.getState().customers.map((c: any) => [c.name, c.email, c.phone, c.address]));

export const exportInventory = () => downloadCsv("inventory", ["Name", "SKU", "Category", "Stock", "Low alert", "Cost", "Price"], useAppStore.getState().inventory.map((i: any) => [i.name, i.sku, i.category, i.stock, i.low, i.cost, i.price]));

export async function exportSales(): Promise<number> {
  const { data, error } = await getSupabase()!.from("pos_sales").select("id,created_at,customer_id,subtotal,tax,total,payment_method,status,note").order("created_at", { ascending: false }).limit(5000);

  if (error) throw error;
  const customers = useAppStore.getState().customers;

  downloadCsv("register-sales", ["Sale", "Date", "Customer", "Subtotal", "Tax", "Total", "Payment", "Status", "Items"], (data || []).map((s: any) => [`S-${s.id}`, s.created_at, customers.find((c: any) => c.id === s.customer_id)?.name || "", s.subtotal, s.tax, s.total, s.payment_method, s.status, s.note]));

  return data?.length || 0;
}

import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ImportKey = "customers" | "inventory" | "tickets";

/** Minimal CSV parser: quoted fields, escaped quotes and commas inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());

  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}


/** Reads a CSV or JSON file into rows. */
export async function readRows(file: File, key: ImportKey): Promise<any[]> {
  const text = await file.text();

  if (file.name.endsWith(".json")) {
    const data = JSON.parse(text);

    return Array.isArray(data) ? data : data[key] || [];
  }

  return parseCsv(text);
}

/** Creates one record per row through the store. */
export async function importRows(key: ImportKey, rows: any[]) {
  const st = useAppStore.getState();

  for (const row of rows) {
    if (key === "inventory") await st.createInventoryItem({ name: row.name || "", sku: row.sku || "", price: parseFloat(row.price) || 0, cost: parseFloat(row.cost) || 0, stock: parseInt(row.stock) || 0, low: parseInt(row.low) || 5, category: row.category || "Parts", model: row.model || "", itemType: row.item_type || row.itemType || "product", description: row.description || "" });
    else if (key === "customers") await st.createCustomer({ name: row.name || "", phone: row.phone || "", email: row.email || "", notes: row.notes || "" });
    else await st.createTicket({ device: row.device || "", issue: row.issue || "", status: row.status || "Open", price: parseFloat(row.price) || 0, customerId: row.customerid || row.customerId || null });
  }
}

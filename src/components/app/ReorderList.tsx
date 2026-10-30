import { useMemo, useState } from "react";
import { CheckCheck, ClipboardCopy, Mail, PackageCheck } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { sendEmail } from "@/lib/notify";
import { useAppStore } from "@/lib/store";

const ORDERED_KEY = "novaops_reorder_ordered";
const SUPPLIER_KEY = "novaops_supplier_email";
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Items at or below their alert level, with a suggested quantity that brings them back to twice the alert level. */
export function ReorderList({ items, cur, onOpen }: { items: any[]; cur: string; onOpen: (item: any) => void }) {
  const rows = useMemo(
    () => items
      .filter((i) => i.itemType !== "service" && i.stock <= (i.low || 5))
      .map((i) => {
        const level = i.low || 5;
        const qty = Math.max(level * 2 - i.stock, 1);

        return { item: i, qty, cost: qty * (Number(i.cost) || 0) };
      })
      .sort((a, b) => a.item.stock - b.item.stock || a.item.name.localeCompare(b.item.name)),
    [items],
  );
  // An "ordered" mark lasts three weeks, long enough for a delivery.
  const [ordered, setOrdered] = useState<Record<string, number>>(() => Object.fromEntries(Object.entries(read<Record<string, number>>(ORDERED_KEY, {})).filter(([, t]) => Date.now() - t < 21 * 864e5)));
  const markOrdered = (ids: Array<string | number>) => {
    const next = { ...ordered };

    ids.forEach((id) => { next[String(id)] = Date.now(); });
    setOrdered(next);
    write(ORDERED_KEY, next);
  };
  const total = rows.reduce((n, r) => n + r.cost, 0);

  const copy = async () => {
    const text = rows.map((r) => `${r.qty} x ${r.item.name}${r.item.sku ? ` (${r.item.sku})` : ""}${r.item.cost ? ` @ ${formatCurrency(Number(r.item.cost), cur)}` : ""}`).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Order list copied", `${rows.length} items. Paste it into an email or your supplier's order form.`);
    } catch {
      toast.warning("Couldn't copy", "Your browser blocked clipboard access.");
    }
  };

  const emailSupplier = async () => {
    const to = window.prompt("Supplier email", read<string>(SUPPLIER_KEY, ""));

    if (!to) return;
    write(SUPPLIER_KEY, to.trim());
    const todo = rows.filter((r) => !ordered[String(r.item.id)]);
    const shop = useAppStore.getState().settings.businessName || "our shop";
    const list = todo.map((r) => `${r.qty} x ${r.item.name}${r.item.sku ? ` (${r.item.sku})` : ""}`).join("\n");
    const res = await sendEmail(to.trim(), `Order request from ${shop}`, `Hello,\n\nWe'd like to order:\n\n${list}\n\nPlease confirm availability and total.\n\nThank you,\n${shop}`);

    if (res === "sent") { toast.success("Order emailed", to.trim()); markOrdered(todo.map((r) => r.item.id)); } else toast.warning("Couldn't send", res === "not-configured" ? "Email isn't set up yet." : "Try again, or use Copy order list.");
  };

  if (rows.length === 0) return <EmptyState icon={<PackageCheck size={22} aria-hidden="true" />} title="Nothing to reorder" description="Every product is above its low-stock alert level." />;

  return (
    <div className="nv-panel" style={{ marginTop: 16 }}>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <div><h2 style={{ margin: 0 }}>Reorder list</h2><p className="nv-muted" style={{ margin: "4px 0 0" }}>{rows.length} item{rows.length === 1 ? "" : "s"} · about {formatCurrency(total, cur)} at your cost</p></div>
        <div className="nv-actions">
          <Button variant="secondary" onClick={() => void copy()}><ClipboardCopy size={14} aria-hidden="true" />Copy order list</Button>
          <Button variant="secondary" onClick={() => void emailSupplier()}><Mail size={14} aria-hidden="true" />Email supplier</Button>
          <Button variant="ghost" onClick={() => markOrdered(rows.map((r) => r.item.id))}><CheckCheck size={14} aria-hidden="true" />Mark all ordered</Button>
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.item.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => onOpen(r.item)}>
          <div className="nv-row-main"><strong>{r.item.name}</strong><span>{r.item.sku ? `SKU ${r.item.sku} · ` : ""}{r.item.stock} left, alert at {r.item.low || 5}</span></div>
          {ordered[String(r.item.id)] ? <Badge tone="info">Ordered {new Date(ordered[String(r.item.id)]).toLocaleDateString()}</Badge> : <Badge tone={r.item.stock === 0 ? "danger" : "warning"}>{r.item.stock === 0 ? "Out" : "Low"}</Badge>}
          <strong style={{ fontWeight: 500 }}>Order {r.qty}</strong>
        </div>
      ))}
    </div>
  );
}

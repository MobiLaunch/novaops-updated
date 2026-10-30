import { useMemo } from "react";
import { ClipboardCopy, PackageCheck } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";

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

  if (rows.length === 0) return <EmptyState icon={<PackageCheck size={22} aria-hidden="true" />} title="Nothing to reorder" description="Every product is above its low-stock alert level." />;

  return (
    <div className="nv-panel" style={{ marginTop: 16 }}>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <div><h2 style={{ margin: 0 }}>Reorder list</h2><p className="nv-muted" style={{ margin: "4px 0 0" }}>{rows.length} item{rows.length === 1 ? "" : "s"} · about {formatCurrency(total, cur)} at your cost</p></div>
        <Button variant="secondary" onClick={() => void copy()}><ClipboardCopy size={14} aria-hidden="true" />Copy order list</Button>
      </div>
      {rows.map((r) => (
        <div key={r.item.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => onOpen(r.item)}>
          <div className="nv-row-main"><strong>{r.item.name}</strong><span>{r.item.sku ? `SKU ${r.item.sku} · ` : ""}{r.item.stock} left, alert at {r.item.low || 5}</span></div>
          <Badge tone={r.item.stock === 0 ? "danger" : "warning"}>{r.item.stock === 0 ? "Out" : "Low"}</Badge>
          <strong style={{ fontWeight: 500 }}>Order {r.qty}</strong>
        </div>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageCheck, RefreshCw, ShoppingBag, Truck, Undo2 } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { Select } from "@/components/arc/select/select";
import { ListSkeleton } from "@/components/app/ListSkeleton";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { emails, notifyCustomer } from "@/lib/notify";
import { loadShopConfig } from "@/lib/shopConfig";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { openStorefront } from "@/lib/shopConfig";

interface OrderItem { id: number; name: string; price: number; qty: number }
interface Order {
  id: string; status: string; created_at: string;
  customer_name: string; customer_email: string; customer_phone: string;
  shipping_address: string; shipping_city: string; shipping_state: string; shipping_zip: string;
  subtotal: number; shipping_cost: number; tax: number; total: number; payment_intent_id: string | null;
  order_items: OrderItem[];
}

// Refunded and payment_failed are driven by Stripe, so they are not offered as manual choices.
const MANUAL = ["paid", "processing", "shipped", "delivered", "cancelled"];
const cap = (s: string) => (s === "payment_failed" ? "Payment failed" : s.charAt(0).toUpperCase() + s.slice(1));
const tone = (s: string) => (["delivered"].includes(s) ? "success" : ["cancelled", "refunded", "payment_failed"].includes(s) ? "danger" : s === "shipped" ? "info" : "warning") as "success" | "danger" | "info" | "warning";
const short = (id: string) => id.slice(0, 8).toUpperCase();

/** Orders placed on the website, with fulfilment status and Stripe refunds. */
export function WebOrders() {
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setLoading(false);
    const { data, error } = await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(300);

    if (error) toast.danger("Couldn't load orders", error.message);
    else setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const stats = useMemo(() => ({
    toShip: orders.filter((o) => ["paid", "processing"].includes(o.status)).length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    sales: orders.filter((o) => !["cancelled", "refunded", "payment_failed"].includes(o.status)).reduce((n, o) => n + Number(o.total || 0), 0),
  }), [orders]);

  const setStatus = async (o: Order, status: string) => {
    const sb = getSupabase();

    if (!sb) return;
    const { error } = await sb.from("orders").update({ status }).eq("id", o.id);

    if (error) return toast.danger("Couldn't update", error.message);
    setOrders((all) => all.map((x) => (x.id === o.id ? { ...x, status } : x)));
    setOpen((cur) => (cur && cur.id === o.id ? { ...cur, status } : cur));
    toast.success("Order updated", `#${short(o.id)} is now ${status}`);
    const mail = status === "shipped" ? emails.orderShipped : status === "delivered" ? emails.orderDelivered : status === "cancelled" ? emails.orderCancelled : null;

    if (mail && o.customer_email) void notifyCustomer(o.customer_email, mail(o.customer_name, o.id).subject, mail(o.customer_name, o.id).body);
  };

  const refund = async (o: Order) => {
    const sb = getSupabase();

    if (!sb) return;
    setRefunding(true);
    try {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error("Sign in again to issue refunds.");
      const { storefrontUrl } = await loadShopConfig();
      const res = await fetch(`${storefrontUrl}/api/refund-payment-intent`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: o.id }) });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body?.error || "The refund didn't go through.");
      toast.success("Refund issued", `Order #${short(o.id)} is refunded in Stripe. Its status updates when Stripe confirms.`);
      setOpen(null);
      setTimeout(() => void load(), 2500);
    } catch (e) {
      toast.danger("Refund failed", (e as Error).message);
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <div className="nv-grid cols-3">
        <MetricCard label="To ship" value={stats.toShip} context="Paid or processing" />
        <MetricCard label="Shipped" value={stats.shipped} context="On the way" />
        <MetricCard label={`Web sales (${cur})`} value={Math.round(stats.sales)} context="Excludes cancelled and refunded" />
      </div>

      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <div style={{ minWidth: 200 }}>
          <Select label="Status" value={filter} onValueChange={setFilter} options={[{ value: "all", label: `All orders (${orders.length})` }, ...[...MANUAL, "refunded", "payment_failed"].map((s) => ({ value: s, label: `${cap(s)} (${orders.filter((o) => o.status === s).length})` }))]} />
        </div>
        <Button variant="secondary" onClick={() => void load()}><RefreshCw size={14} aria-hidden="true" />Refresh</Button>
      </div>

      {loading ? <ListSkeleton label="Loading orders" /> : shown.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={22} aria-hidden="true" />} title="No web orders" action={filter === "all" ? <Button variant="secondary" onClick={() => void openStorefront("/shop")}>View the shop</Button> : undefined} description={filter === "all" ? "Orders placed on the website show up here as soon as they're paid." : "No orders have this status."} />
      ) : (
        <div className="nv-panel" style={{ padding: "4px 16px" }}>
          {shown.map((o) => (
            <button key={o.id} className="nv-row" style={{ all: "unset", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", width: "100%", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", boxSizing: "border-box" }} type="button" onClick={() => setOpen(o)}>
              <span className="nv-row-main"><strong>{o.customer_name || "Guest"} · #{short(o.id)}</strong><span>{new Date(o.created_at).toLocaleDateString()} · {o.order_items?.length || 0} item{(o.order_items?.length || 0) === 1 ? "" : "s"}</span></span>
              <Badge tone={tone(o.status)}>{cap(o.status)}</Badge>
              <strong style={{ fontWeight: 500, minWidth: 72, textAlign: "right" }}>{formatCurrency(Number(o.total), cur)}</strong>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent title={open ? `Order #${short(open.id)}` : "Order"} description={open ? new Date(open.created_at).toLocaleString() : undefined}>
          {open && (
            <div className="nv-form">
              <Select label="Status" value={MANUAL.includes(open.status) ? open.status : ""} placeholder={cap(open.status)} disabled={!MANUAL.includes(open.status)} onValueChange={(v) => void setStatus(open, v)} options={MANUAL.map((s) => ({ value: s, label: cap(s) }))} />
              <div className="nv-actions" style={{ gap: 8 }}>
                {open.status === "paid" && <Button variant="secondary" onClick={() => void setStatus(open, "processing")}><PackageCheck size={14} aria-hidden="true" />Start processing</Button>}
                {["paid", "processing"].includes(open.status) && <Button variant="secondary" onClick={() => void setStatus(open, "shipped")}><Truck size={14} aria-hidden="true" />Mark shipped</Button>}
              </div>
              <div className="nv-panel" style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontWeight: 500 }}>{open.customer_name || "Guest"}</strong>
                <span className="nv-muted">{open.customer_email} {open.customer_phone && `· ${open.customer_phone}`}</span>
                <span className="nv-muted">{[open.shipping_address, open.shipping_city, `${open.shipping_state} ${open.shipping_zip}`.trim()].filter(Boolean).join(", ") || "No shipping address"}</span>
              </div>
              <div className="nv-panel" style={{ padding: "4px 16px" }}>
                {open.order_items?.map((i) => (
                  <div key={i.id} className="nv-row"><span className="nv-row-main"><strong>{i.name}</strong><span>{formatCurrency(Number(i.price), cur)} each · qty {i.qty}</span></span><strong style={{ fontWeight: 500 }}>{formatCurrency(Number(i.price) * i.qty, cur)}</strong></div>
                ))}
                <div className="nv-row"><span className="nv-row-main"><span>Subtotal {formatCurrency(Number(open.subtotal), cur)} · Shipping {Number(open.shipping_cost) ? formatCurrency(Number(open.shipping_cost), cur) : "Free"} · Tax {formatCurrency(Number(open.tax), cur)}</span></span><strong>{formatCurrency(Number(open.total), cur)}</strong></div>
              </div>
              {["paid", "processing", "shipped", "delivered"].includes(open.status) && open.payment_intent_id && (
                <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                  <span className="nv-muted" style={{ fontSize: 13 }}>Refunds the full amount to the customer through Stripe.</span>
                  <HoldToConfirm confirmedLabel="Refunding" disabled={refunding} icon={<Undo2 strokeWidth={1.75} />} label="Hold to refund" tone="danger" onConfirm={() => void refund(open)} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

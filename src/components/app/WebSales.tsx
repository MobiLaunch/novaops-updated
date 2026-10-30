import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { ListSkeleton } from "@/components/app/ListSkeleton";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

interface Item { name: string; price: number; qty: number; product_id: string | null }
interface Order { id: string; status: string; created_at: string; total: number; order_items: Item[] }

const EXCLUDED = new Set(["cancelled", "refunded", "payment_failed"]);
const DAY = 86400000;

/** How the online shop is selling: totals, best sellers and the trend over the chosen period. */
export function WebSales() {
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const [days, setDays] = useState("30");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setLoading(false);
    const since = new Date(Date.now() - Number(days) * 2 * DAY).toISOString();
    const { data, error } = await sb.from("orders").select("id,status,created_at,total,order_items(name,price,qty,product_id)").gte("created_at", since).order("created_at", { ascending: false }).limit(1000);

    if (error) toast.danger("Couldn't load sales", error.message);
    else setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const report = useMemo(() => {
    const span = Number(days) * DAY;
    const now = Date.now();
    const live = orders.filter((o) => !EXCLUDED.has(o.status));
    const inRange = live.filter((o) => now - new Date(o.created_at).getTime() <= span);
    const before = live.filter((o) => { const age = now - new Date(o.created_at).getTime(); return age > span && age <= span * 2; });
    const revenue = inRange.reduce((n, o) => n + Number(o.total || 0), 0);
    const prev = before.reduce((n, o) => n + Number(o.total || 0), 0);
    const byProduct = new Map<string, { name: string; units: number; revenue: number }>();

    inRange.forEach((o) => o.order_items?.forEach((i) => {
      const e = byProduct.get(i.name) ?? { name: i.name, units: 0, revenue: 0 };

      e.units += i.qty;
      e.revenue += Number(i.price) * i.qty;
      byProduct.set(i.name, e);
    }));
    const top = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const units = [...byProduct.values()].reduce((n, p) => n + p.units, 0);

    return { count: inRange.length, revenue, prev, units, aov: inRange.length ? revenue / inRange.length : 0, top, refunded: orders.filter((o) => o.status === "refunded" && now - new Date(o.created_at).getTime() <= span).length };
  }, [orders, days]);

  const change = report.prev > 0 ? Math.round(((report.revenue - report.prev) / report.prev) * 100) : null;
  const maxRev = Math.max(...report.top.map((p) => p.revenue), 1);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <SegmentedControl label="Period" value={days} onValueChange={setDays} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
        <Button variant="secondary" onClick={() => void load()}><RefreshCw size={14} aria-hidden="true" />Refresh</Button>
      </div>

      {loading ? <ListSkeleton label="Loading sales" rows={3} /> : report.count === 0 ? (
        <EmptyState icon={<BarChart3 size={22} aria-hidden="true" />} title="No web sales in this period" description="Paid orders from the website show up here, with your best sellers." />
      ) : (
        <>
          <div className="nv-grid cols-4">
            <MetricCard label={`Web revenue (${cur})`} value={Math.round(report.revenue)} context={change === null ? "No earlier period to compare" : `${change >= 0 ? "+" : ""}${change}% vs the period before`} />
            <MetricCard label="Orders" value={report.count} context={report.refunded ? `${report.refunded} refunded` : "Paid orders"} />
            <MetricCard label="Items sold" value={report.units} context="Units" />
            <MetricCard label={`Average order (${cur})`} value={Math.round(report.aov)} context="Per paid order" />
          </div>

          <div className="nv-panel">
            <h2 style={{ margin: "0 0 8px" }}>Best sellers</h2>
            {report.top.map((p) => (
              <div key={p.name} className="nv-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 4 }}>
                <span className="nv-row-main"><strong>{p.name}</strong><span>{p.units} sold</span></span>
                <strong style={{ fontWeight: 500 }}>{formatCurrency(p.revenue, cur)}</strong>
                <div className="nv-bar" style={{ gridColumn: "1 / -1" }}><span style={{ width: `${Math.round((p.revenue / maxRev) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

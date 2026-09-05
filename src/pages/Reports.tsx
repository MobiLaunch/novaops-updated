import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarClock, DollarSign, Package, TrendingUp, TriangleAlert, Wrench } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { InventoryItem, Technician, Ticket } from "@/types/domain";
import { sbFetchInventory, sbFetchTechnicians, sbFetchTickets } from "@/lib/supabase";
import { asArray, formatCurrency } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  Open: "var(--accent)",
  "In Progress": "var(--warning)",
  "Waiting for Parts": "var(--warning)",
  Completed: "var(--success)",
  Delivered: "var(--success)",
};
const STATUS_ORDER = ["Open", "In Progress", "Waiting for Parts", "Completed", "Delivered"];
const DAYS_WINDOW = 30;

interface BarRow {
  key: string;
  label: string;
  value: number;
  color?: string;
}

function BarList({ rows, formatValue = (v: number) => String(v) }: { rows: BarRow[]; formatValue?: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (rows.length === 0) return <p className="m-0 text-sm text-muted">Not enough data yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{r.label}</span>
            <span className="shrink-0 font-semibold text-foreground">{formatValue(r.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max((r.value / max) * 100, 3)}%`, backgroundColor: r.color || "var(--accent)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueTrend({ points }: { points: { date: string; amount: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 200;
  const padding = 24;
  const bottomAxis = 24;
  const max = Math.max(...points.map((p) => p.amount), 1);
  const plotBottom = height - bottomAxis;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: padding + i * stepX,
    y: plotBottom - (p.amount / max) * (plotBottom - padding),
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1]?.x || padding},${plotBottom} L${padding},${plotBottom} Z`;
  const labelIdx = [0, Math.floor((coords.length - 1) / 2), coords.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const fmtLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="relative">
      <svg className="w-full" preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}>
        <line stroke="var(--border)" strokeWidth="1" x1={padding} x2={width - padding} y1={plotBottom} y2={plotBottom} />
        <path d={areaPath} fill="var(--accent)" opacity="0.12" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        {coords.map((c, i) => (
          <circle
            key={c.date}
            cx={c.x}
            cy={c.y}
            fill={hover === i ? "var(--accent)" : "transparent"}
            r={hover === i ? 4 : 8}
            stroke="none"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          />
        ))}
        {labelIdx.map((i) => (
          <text key={i} fill="var(--muted)" fontSize="10" textAnchor={i === 0 ? "start" : i === coords.length - 1 ? "end" : "middle"} x={coords[i].x} y={height - 6}>
            {fmtLabel(coords[i].date)}
          </text>
        ))}
      </svg>
      {hover !== null && coords[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(coords[hover].x / width) * 100}%`, top: `${(coords[hover].y / height) * 100}%` }}
        >
          <strong className="block text-foreground">{formatCurrency(coords[hover].amount)}</strong>
          <span className="text-muted">{new Date(`${coords[hover].date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([sbFetchTickets(), sbFetchInventory(), sbFetchTechnicians()]).then(([t, i, tech]) => {
      setLoading(false);
      if (t.data) setTickets(t.data);
      if (i.data) setInventory(i.data);
      if (tech.data) setTechnicians(tech.data);
    });
  }, []);

  const revenueTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    const start = new Date();

    start.setDate(start.getDate() - (DAYS_WINDOW - 1));
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < DAYS_WINDOW; i++) {
      const d = new Date(start);

      d.setDate(d.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }

    for (const t of tickets) {
      for (const p of asArray<{ amount: number; at: string }>(t.payments)) {
        const day = (p.at || "").slice(0, 10);

        if (byDay.has(day)) byDay.set(day, (byDay.get(day) || 0) + Number(p.amount || 0));
      }
    }

    return Array.from(byDay.entries()).map(([date, amount]) => ({ date, amount }));
  }, [tickets]);

  const totalRevenue30d = revenueTrend.reduce((sum, p) => sum + p.amount, 0);
  const avgTicketValue = tickets.length ? tickets.reduce((sum, t) => sum + Number(t.price || 0), 0) / tickets.length : 0;
  const openTickets = tickets.filter((t) => t.status !== "Completed" && t.status !== "Delivered").length;
  const lowStockCount = inventory.filter((i) => i.stock <= i.low).length;

  const statusRows: BarRow[] = STATUS_ORDER.map((s) => ({
    key: s,
    label: s,
    value: tickets.filter((t) => t.status === s).length,
    color: STATUS_COLOR[s],
  })).filter((r) => r.value > 0);

  const issueRows: BarRow[] = useMemo(() => {
    const counts = new Map<string, number>();

    for (const t of tickets) {
      const key = t.issue.trim();

      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ key: label, label, value }));
  }, [tickets]);

  const technicianRows: BarRow[] = useMemo(() => {
    const revenueByTech = new Map<number, number>();

    for (const t of tickets) {
      if (!t.assigned_to) continue;
      const paid = asArray<{ amount: number }>(t.payments).reduce((s, p) => s + Number(p.amount || 0), 0);

      revenueByTech.set(t.assigned_to, (revenueByTech.get(t.assigned_to) || 0) + paid);
    }

    return technicians
      .map((tech) => ({ key: String(tech.id), label: tech.name, value: revenueByTech.get(tech.id) || 0, color: tech.color }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [tickets, technicians]);

  const inventoryByCategory: BarRow[] = useMemo(() => {
    const totals = new Map<string, number>();

    for (const i of inventory) {
      const key = i.category || "Uncategorized";

      totals.set(key, (totals.get(key) || 0) + Number(i.price || 0) * Number(i.stock || 0));
    }

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ key: label, label, value }));
  }, [inventory]);

  return (
    <div>
      <PageHeader
        description="Revenue, ticket volume, and inventory value at a glance."
        eyebrow="Insights"
        title="Reports"
      />

      {loading ? (
        <p className="m-0 text-sm text-muted">Loading reports…</p>
      ) : tickets.length === 0 && inventory.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
            <BarChart3 className="size-8" />
          </span>
          <h4 className="m-0 text-lg font-bold text-foreground">Nothing to report yet</h4>
          <p className="m-0 max-w-md text-sm text-muted">Once you have tickets and inventory, revenue and volume trends will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[22px] border border-border bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <DollarSign className="size-[18px]" />
              </span>
              <strong className="mt-3 block text-2xl font-extrabold text-foreground">{formatCurrency(totalRevenue30d)}</strong>
              <span className="text-sm text-muted">Revenue (30 days)</span>
            </div>
            <div className="rounded-[22px] border border-border bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <TrendingUp className="size-[18px]" />
              </span>
              <strong className="mt-3 block text-2xl font-extrabold text-foreground">{formatCurrency(avgTicketValue)}</strong>
              <span className="text-sm text-muted">Avg. ticket value</span>
            </div>
            <div className="rounded-[22px] border border-border bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Wrench className="size-[18px]" />
              </span>
              <strong className="mt-3 block text-2xl font-extrabold text-foreground">{openTickets}</strong>
              <span className="text-sm text-muted">Open tickets</span>
            </div>
            <div className="rounded-[22px] border border-border bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <TriangleAlert className="size-[18px]" />
              </span>
              <strong className="mt-3 block text-2xl font-extrabold text-foreground">{lowStockCount}</strong>
              <span className="text-sm text-muted">Low stock items</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-surface p-6">
            <h3 className="m-0 mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <CalendarClock className="size-4" />
              Revenue — Last {DAYS_WINDOW} Days
            </h3>
            <RevenueTrend points={revenueTrend} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-border bg-surface p-6">
              <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Tickets by Status</h3>
              <BarList rows={statusRows} />
            </div>

            <div className="rounded-[28px] border border-border bg-surface p-6">
              <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Top Repair Issues</h3>
              <BarList rows={issueRows} />
            </div>

            <div className="rounded-[28px] border border-border bg-surface p-6">
              <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Technician Revenue Leaderboard</h3>
              <BarList formatValue={(v) => formatCurrency(v)} rows={technicianRows} />
              {technicianRows.length === 0 && (
                <p className="m-0 text-sm text-muted">Assign tickets to technicians (Tickets → open a ticket) to see this leaderboard.</p>
              )}
            </div>

            <div className="rounded-[28px] border border-border bg-surface p-6">
              <h3 className="m-0 mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                <Package className="size-4" />
                Inventory Value by Category
              </h3>
              <BarList formatValue={(v) => formatCurrency(v)} rows={inventoryByCategory} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

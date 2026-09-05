import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Tabs } from "@heroui/react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Calculator,
  CalendarClock,
  CircleAlert,
  CloudOff,
  Coins,
  DollarSign,
  Download,
  Globe,
  Landmark,
  Package,
  Receipt,
  RefreshCw,
  Repeat,
  ShoppingCart,
  Ticket as TicketIcon,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import DataTable from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type {
  Customer,
  InventoryItem,
  PosSale,
  ShopSettings,
  Technician,
  Ticket,
  TicketPart,
  TicketPayment,
  TradeIn,
  WebsiteOrder,
} from "@/types/domain";
import {
  sbFetchCustomers,
  sbFetchInventory,
  sbFetchPosSales,
  sbFetchShopSettings,
  sbFetchTechnicians,
  sbFetchTickets,
  sbFetchTradeIns,
  sbFetchWebsiteOrders,
} from "@/lib/supabase";
import { getSquarePayments, getSquarePayouts, type SquarePayment, type SquarePayout } from "@/lib/square";
import { asArray, downloadCsv, formatCurrency, parseDateOnly, ticketBalanceDue } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────
// Shared chart primitives (unchanged from the old Reports page)
// ─────────────────────────────────────────────────────────────────────────

interface BarRow {
  key: string;
  label: string;
  value: number;
  color?: string;
}

function BarList({ rows, formatValue = (v: number) => String(v) }: { rows: BarRow[]; formatValue?: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);

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
              style={{ width: `${Math.max((Math.abs(r.value) / max) * 100, 3)}%`, backgroundColor: r.color || "var(--accent)" }}
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

function formatSigned(amount: number): string {
  return amount < 0 ? `−${formatCurrency(Math.abs(amount))}` : formatCurrency(amount);
}

// Tailwind can only generate CSS for class names it finds as literal
// substrings during its build-time scan — a template-interpolated
// `bg-${tone}-soft` would never match, so each tone maps to a fully
// spelled-out class string instead.
const TONE_CLASSES: Record<"accent" | "success" | "warning" | "danger", string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

function StatTile({ icon: Icon, label, value, sub, tone = "accent" }: { icon: typeof TrendingUp; label: string; value: string; sub?: string; tone?: "accent" | "success" | "warning" | "danger" }) {
  return (
    <div className="rounded-[22px] border border-border bg-surface p-5">
      <span className={`flex size-10 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <Icon className="size-[18px]" />
      </span>
      <strong className="mt-3 block text-2xl font-extrabold text-foreground">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
      {sub && <p className="m-0 mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Date range handling
// ─────────────────────────────────────────────────────────────────────────

type RangeKey = "7d" | "30d" | "90d" | "mtd" | "qtd" | "ytd" | "all" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
];

function startOfDay(d: Date): Date {
  const c = new Date(d);

  c.setHours(0, 0, 0, 0);

  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);

  c.setHours(23, 59, 59, 999);

  return c;
}

function getRangeBounds(key: RangeKey, customStart: string, customEnd: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = endOfDay(now);

  switch (key) {
    case "7d": {
      const s = startOfDay(now);

      s.setDate(s.getDate() - 6);

      return { start: s, end, label: "Last 7 Days" };
    }
    case "30d": {
      const s = startOfDay(now);

      s.setDate(s.getDate() - 29);

      return { start: s, end, label: "Last 30 Days" };
    }
    case "90d": {
      const s = startOfDay(now);

      s.setDate(s.getDate() - 89);

      return { start: s, end, label: "Last 90 Days" };
    }
    case "mtd":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: "Month to Date" };
    case "qtd": {
      const q = Math.floor(now.getMonth() / 3);

      return { start: new Date(now.getFullYear(), q * 3, 1), end, label: "Quarter to Date" };
    }
    case "ytd":
      return { start: new Date(now.getFullYear(), 0, 1), end, label: "Year to Date" };
    case "custom": {
      const s = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : startOfDay(now);
      const e = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : end;

      return { start: s, end: e, label: "Custom Range" };
    }
    case "all":
    default:
      return { start: new Date(2000, 0, 1), end, label: "All Time" };
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

// Buckets a date range into at most ~60 points so the trend chart stays
// readable whether you're looking at 7 days or all time.
function pickGranularity(days: number): "day" | "week" | "month" {
  if (days <= 62) return "day";
  if (days <= 370) return "week";

  return "month";
}

function bucketStart(date: Date, granularity: "day" | "week" | "month"): Date {
  const d = startOfDay(date);

  if (granularity === "month") {
    d.setDate(1);

    return d;
  }
  if (granularity === "week") {
    const dow = (d.getDay() + 6) % 7; // 0 = Monday

    d.setDate(d.getDate() - dow);

    return d;
  }

  return d;
}

function bucketKey(date: Date, granularity: "day" | "week" | "month"): string {
  return bucketStart(date, granularity).toISOString().slice(0, 10);
}

function advanceBucket(date: Date, granularity: "day" | "week" | "month"): Date {
  const d = new Date(date);

  if (granularity === "day") d.setDate(d.getDate() + 1);
  else if (granularity === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);

  return d;
}

// ─────────────────────────────────────────────────────────────────────────
// Unified revenue-event model — one shape every revenue/expense source
// (repair payments, POS sales, website orders, trade-in payouts) is
// normalized into, so the trend chart, payment-method breakdown, P&L, and
// ledger all read from one list instead of four separately-filtered ones.
// ─────────────────────────────────────────────────────────────────────────

type RevenueSource = "repair" | "retail" | "website" | "trade-in";

interface RevenueEvent {
  id: string;
  date: Date;
  source: RevenueSource;
  description: string;
  method: string;
  amount: number; // positive = revenue in; negative = trade-in payout (cash out)
  tax: number; // sales tax portion of `amount`, when known (POS + website only)
  customerName: string;
  refPath?: string;
}

function buildEvents(
  tickets: Ticket[],
  posSales: PosSale[],
  websiteOrders: WebsiteOrder[],
  tradeIns: TradeIn[],
  customersById: Map<number, Customer>,
): RevenueEvent[] {
  const events: RevenueEvent[] = [];

  for (const t of tickets) {
    const customerName = t.customer_id ? customersById.get(t.customer_id)?.name || "" : "";

    asArray<TicketPayment>(t.payments).forEach((p, idx) => {
      if (!p.at) return;
      events.push({
        id: `ticket-${t.id}-${idx}`,
        date: new Date(p.at),
        source: "repair",
        description: `Ticket #${t.id} — ${t.device} ${t.device_model}`.trim(),
        method: p.method || "unknown",
        amount: Number(p.amount) || 0,
        tax: 0,
        customerName,
        refPath: `/tickets?open=${t.id}`,
      });
    });
  }

  for (const s of posSales) {
    if (s.status !== "completed") continue;
    const customerName = s.customer_id ? customersById.get(s.customer_id)?.name || "" : "";

    events.push({
      id: `pos-${s.id}`,
      date: new Date(s.created_at),
      source: "retail",
      description: s.note || `POS Sale #${s.id}`,
      method: s.payment_method || "unknown",
      amount: Number(s.total) || 0,
      tax: Number(s.tax) || 0,
      customerName,
    });
  }

  for (const o of websiteOrders) {
    if (!["paid", "processing", "shipped", "delivered"].includes(o.status)) continue;
    events.push({
      id: `order-${o.id}`,
      date: new Date(o.created_at),
      source: "website",
      description: `Order #${String(o.id).slice(0, 8).toUpperCase()} (${asArray(o.order_items).length} item${asArray(o.order_items).length === 1 ? "" : "s"})`,
      method: "Stripe",
      amount: Number(o.total) || 0,
      tax: Number(o.tax) || 0,
      customerName: o.customer_name || "",
    });
  }

  for (const ti of tradeIns) {
    if (ti.status !== "Accepted" && ti.status !== "Completed") continue;
    if (!ti.offer_price) continue;
    const customerName = ti.customer_id ? customersById.get(ti.customer_id)?.name || "" : "";

    events.push({
      id: `tradein-${ti.id}`,
      date: new Date(ti.updated_at || ti.created_at),
      source: "trade-in",
      description: `Trade-In — ${ti.brand} ${ti.model}`.trim(),
      method: "Trade-In Payout",
      amount: -Number(ti.offer_price),
      tax: 0,
      customerName,
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Best-effort COGS: matches a POS line's SKU (or a ticket part's
// inventory_id) against inventory's *current* cost. Inventory cost can
// change after the sale, and website products have no cost field at all —
// so this is an estimate, always labeled as one in the UI.
function posSaleCogs(sale: PosSale, inventoryBySku: Map<string, InventoryItem>): number {
  if (sale.status !== "completed") return 0;

  return asArray<PosSale["items"][number]>(sale.items).reduce((sum, item) => {
    const inv = item.sku ? inventoryBySku.get(item.sku.toUpperCase()) : undefined;

    return sum + (inv ? Number(inv.cost) * item.quantity : 0);
  }, 0);
}

function ticketPartsCogs(t: Ticket, inventoryById: Map<number, InventoryItem>): number {
  return asArray<TicketPart>(t.parts).reduce((sum, p) => {
    const inv = p.inventory_id ? inventoryById.get(p.inventory_id) : undefined;

    return sum + (inv ? Number(inv.cost) * p.qty : 0);
  }, 0);
}

const SOURCE_LABEL: Record<RevenueSource, string> = {
  repair: "Repair",
  retail: "Retail (POS)",
  website: "Website",
  "trade-in": "Trade-In",
};

const SOURCE_COLOR: Record<RevenueSource, string> = {
  repair: "var(--accent)",
  retail: "var(--success)",
  website: "var(--warning)",
  "trade-in": "var(--danger)",
};

const SOURCE_ICON: Record<RevenueSource, typeof TicketIcon> = {
  repair: Wrench,
  retail: ShoppingCart,
  website: Globe,
  "trade-in": Repeat,
};

const STATUS_COLOR: Record<string, string> = {
  Open: "var(--accent)",
  "In Progress": "var(--warning)",
  "Waiting for Parts": "var(--warning)",
  Completed: "var(--success)",
  Delivered: "var(--success)",
};
const STATUS_ORDER = ["Open", "In Progress", "Waiting for Parts", "Completed", "Delivered"];

const FILING_LABEL: Record<string, string> = { monthly: "monthly", quarterly: "quarterly", annually: "annually" };

// Common US convention: sales tax is due the 20th of the month after the
// filing period ends. Exact rules vary by state — this is a planning
// estimate, not a filing deadline, and the UI says so.
function nextFilingDue(frequency: string, asOf: Date): Date {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();

  if (frequency === "monthly") return new Date(y, m + 1, 20);
  if (frequency === "annually") return new Date(y + 1, 0, 20);

  const q = Math.floor(m / 3);

  return new Date(y, (q + 1) * 3, 20);
}

type LedgerFilter = "all" | RevenueSource;

export default function Accounting() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [posSales, setPosSales] = useState<PosSale[]>([]);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>([]);
  const [websiteOrdersError, setWebsiteOrdersError] = useState<string | null>(null);
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("all");

  const [squareLoading, setSquareLoading] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);
  const [squarePayments, setSquarePayments] = useState<SquarePayment[]>([]);
  const [squarePayouts, setSquarePayouts] = useState<SquarePayout[]>([]);
  const [squareLoaded, setSquareLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      sbFetchTickets(),
      sbFetchPosSales(),
      sbFetchWebsiteOrders(),
      sbFetchTradeIns(),
      sbFetchInventory(),
      sbFetchTechnicians(),
      sbFetchCustomers(),
      sbFetchShopSettings(),
    ]).then(([t, pos, orders, ti, inv, tech, cust, settings]) => {
      setLoading(false);
      if (t.data) setTickets(t.data);
      if (pos.data) setPosSales(pos.data);
      if (orders.data) setWebsiteOrders(orders.data);
      else if (orders.error) setWebsiteOrdersError(orders.error);
      if (ti.data) setTradeIns(ti.data);
      if (inv.data) setInventory(inv.data);
      if (tech.data) setTechnicians(tech.data);
      if (cust.data) setCustomers(cust.data);
      if (settings.data) setShopSettings(settings.data);
    });
  }, []);

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const inventoryBySku = useMemo(
    () => new Map(inventory.filter((i) => i.sku).map((i) => [i.sku.toUpperCase(), i])),
    [inventory],
  );
  const inventoryById = useMemo(() => new Map(inventory.map((i) => [i.id, i])), [inventory]);

  const allEvents = useMemo(
    () => buildEvents(tickets, posSales, websiteOrders, tradeIns, customersById),
    [tickets, posSales, websiteOrders, tradeIns, customersById],
  );

  const range = useMemo(() => getRangeBounds(rangeKey, customStart, customEnd), [rangeKey, customStart, customEnd]);

  const inRange = (d: Date) => d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime();

  const events = useMemo(() => allEvents.filter((e) => inRange(e.date)), [allEvents, range]);

  const revenueEvents = useMemo(() => events.filter((e) => e.amount > 0), [events]);
  const tradeInEvents = useMemo(() => events.filter((e) => e.source === "trade-in"), [events]);

  const revenueBySource = useMemo(() => {
    const totals = new Map<RevenueSource, number>();

    for (const e of revenueEvents) totals.set(e.source, (totals.get(e.source) || 0) + e.amount);

    return totals;
  }, [revenueEvents]);

  const repairRevenue = revenueBySource.get("repair") || 0;
  const retailRevenue = revenueBySource.get("retail") || 0;
  const websiteRevenue = revenueBySource.get("website") || 0;
  const tradeInPayouts = tradeInEvents.reduce((s, e) => s + e.amount, 0); // already negative
  const grossRevenue = repairRevenue + retailRevenue + websiteRevenue;
  const taxCollected = revenueEvents.reduce((s, e) => s + e.tax, 0);

  const refundedPosTotal = useMemo(
    () => posSales.filter((s) => s.status === "refunded" && inRange(new Date(s.created_at))).reduce((s, x) => s + Number(x.total), 0),
    [posSales, range],
  );
  const refundedWebsiteTotal = useMemo(
    () => websiteOrders.filter((o) => o.status === "refunded" && inRange(new Date(o.created_at))).reduce((s, x) => s + Number(x.total), 0),
    [websiteOrders, range],
  );

  const cogs = useMemo(() => {
    const posCogs = posSales.filter((s) => inRange(new Date(s.created_at))).reduce((s, sale) => s + posSaleCogs(sale, inventoryBySku), 0);
    const partsCogs = tickets.filter((t) => inRange(new Date(t.created_at))).reduce((s, t) => s + ticketPartsCogs(t, inventoryById), 0);

    return { posCogs, partsCogs, total: posCogs + partsCogs };
  }, [posSales, tickets, inventoryBySku, inventoryById, range]);

  const grossProfit = grossRevenue - cogs.total;
  const netProfit = grossProfit + tradeInPayouts;
  const reservePct = Number(shopSettings?.income_tax_reserve_pct ?? 25);
  const taxReserve = Math.max(0, netProfit) * (reservePct / 100);
  const netAfterReserve = netProfit - taxReserve;

  // Accounts receivable — a live snapshot (not range-scoped): every ticket
  // with money still owed, aged from its due date (or creation if none).
  const arAging = useMemo(() => {
    const now = Date.now();
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    let openCount = 0;

    for (const t of tickets) {
      const balance = ticketBalanceDue(t);

      if (balance <= 0.01) continue;
      openCount++;
      // due_date is date-only (parse it local, not UTC); created_at is a
      // full timestamp and parses correctly on its own.
      const basis = (parseDateOnly(t.due_date) ?? new Date(t.created_at)).getTime();
      const ageDays = Math.floor((now - basis) / 86400000);

      if (ageDays <= 0) buckets.current += balance;
      else if (ageDays <= 30) buckets.d1_30 += balance;
      else if (ageDays <= 60) buckets.d31_60 += balance;
      else if (ageDays <= 90) buckets.d61_90 += balance;
      else buckets.d90plus += balance;
    }

    const total = Object.values(buckets).reduce((a, b) => a + b, 0);

    return { buckets, total, openCount };
  }, [tickets]);

  const revenueTrend = useMemo(() => {
    const granularity = pickGranularity(daysBetween(range.start, range.end));
    const keys: string[] = [];
    let cur = bucketStart(range.start, granularity);
    const endKey = bucketKey(range.end, granularity);

    for (let guard = 0; guard < 400; guard++) {
      const key = cur.toISOString().slice(0, 10);

      keys.push(key);
      if (key >= endKey) break;
      cur = advanceBucket(cur, granularity);
    }

    const byBucket = new Map(keys.map((k) => [k, 0]));

    for (const e of revenueEvents) {
      const key = bucketKey(e.date, granularity);

      if (byBucket.has(key)) byBucket.set(key, (byBucket.get(key) || 0) + e.amount);
    }

    return keys.map((date) => ({ date, amount: byBucket.get(date) || 0 }));
  }, [revenueEvents, range]);

  const revenueBySourceRows: BarRow[] = (["repair", "retail", "website"] as RevenueSource[])
    .map((s) => ({ key: s, label: SOURCE_LABEL[s], value: revenueBySource.get(s) || 0, color: SOURCE_COLOR[s] }))
    .filter((r) => r.value !== 0);

  const paymentMethodRows: BarRow[] = useMemo(() => {
    const totals = new Map<string, number>();

    for (const e of revenueEvents) {
      const key = e.method || "unknown";

      totals.set(key, (totals.get(key) || 0) + e.amount);
    }

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ key: label, label: label.charAt(0).toUpperCase() + label.slice(1), value }));
  }, [revenueEvents]);

  const monthlyTaxRows = useMemo(() => {
    const totals = new Map<string, number>();

    for (const e of revenueEvents) {
      if (!e.tax) continue;
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;

      totals.set(key, (totals.get(key) || 0) + e.tax);
    }

    return Array.from(totals.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, value]) => ({
        key,
        label: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        value,
      }));
  }, [revenueEvents]);

  const taxableBase = useMemo(
    () => revenueEvents.filter((e) => e.source === "retail" || e.source === "website").reduce((s, e) => s + (e.amount - e.tax), 0),
    [revenueEvents],
  );
  const effectiveTaxRate = taxableBase > 0 ? (taxCollected / taxableBase) * 100 : 0;
  const configuredTaxRate = Number(shopSettings?.tax_rate || 0);
  const taxRateMismatch = taxableBase > 0 && Math.abs(effectiveTaxRate - configuredTaxRate) > 0.5;

  const filingFrequency = shopSettings?.tax_filing_frequency || "quarterly";
  const nextDue = useMemo(() => nextFilingDue(String(filingFrequency), new Date()), [filingFrequency]);

  const filteredLedger = useMemo(
    () => (ledgerFilter === "all" ? events : events.filter((e) => e.source === ledgerFilter)),
    [events, ledgerFilter],
  );

  const handleExportCsv = () => {
    const rows: (string | number)[][] = [["Date", "Source", "Description", "Method", "Customer", "Tax", "Amount"]];

    for (const e of filteredLedger) {
      rows.push([e.date.toISOString(), SOURCE_LABEL[e.source], e.description, e.method, e.customerName, e.tax.toFixed(2), e.amount.toFixed(2)]);
    }
    downloadCsv(`novaops-ledger-${range.start.toISOString().slice(0, 10)}-to-${range.end.toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleLoadSquare = async () => {
    setSquareLoading(true);
    setSquareError(null);
    try {
      const days = Math.min(365, daysBetween(range.start, new Date()));
      const [paymentsRes, payoutsRes] = await Promise.all([getSquarePayments(days), getSquarePayouts(Math.max(days, 90))]);

      setSquarePayments(paymentsRes.payments.filter((p) => inRange(new Date(p.createdAt))));
      setSquarePayouts(payoutsRes.payouts.filter((p) => inRange(new Date(p.createdAt))));
      setSquareLoaded(true);
    } catch (e) {
      setSquareError(e instanceof Error ? e.message : "Failed to load Square activity");
    } finally {
      setSquareLoading(false);
    }
  };

  const squareCardTotal = squarePayments.reduce((s, p) => s + p.amount, 0);
  const squareFeesTotal = squarePayments.reduce((s, p) => s + p.fee, 0);
  const internalCardTotal = revenueEvents
    .filter((e) => ["card", "terminal"].includes(e.method.toLowerCase()))
    .reduce((s, e) => s + e.amount, 0);
  const squareDelta = squareCardTotal - internalCardTotal;

  // Shop-insights figures (operational, not financial) — kept from the
  // original Reports page, scoped to the selected range for consistency.
  const ticketsInRange = useMemo(() => tickets.filter((t) => inRange(new Date(t.created_at))), [tickets, range]);
  const avgTicketValue = ticketsInRange.length ? ticketsInRange.reduce((s, t) => s + Number(t.price || 0), 0) / ticketsInRange.length : 0;
  const openTickets = tickets.filter((t) => t.status !== "Completed" && t.status !== "Delivered").length;
  const lowStockCount = inventory.filter((i) => i.stock <= i.low).length;

  const statusRows: BarRow[] = STATUS_ORDER.map((s) => ({
    key: s,
    label: s,
    value: ticketsInRange.filter((t) => t.status === s).length,
    color: STATUS_COLOR[s],
  })).filter((r) => r.value > 0);

  const issueRows: BarRow[] = useMemo(() => {
    const counts = new Map<string, number>();

    for (const t of ticketsInRange) {
      const key = t.issue.trim();

      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ key: label, label, value }));
  }, [ticketsInRange]);

  const technicianRows: BarRow[] = useMemo(() => {
    const revenueByTech = new Map<number, number>();

    for (const t of ticketsInRange) {
      if (!t.assigned_to) continue;
      const paid = asArray<TicketPayment>(t.payments).reduce((s, p) => s + Number(p.amount || 0), 0);

      revenueByTech.set(t.assigned_to, (revenueByTech.get(t.assigned_to) || 0) + paid);
    }

    return technicians
      .map((tech) => ({ key: String(tech.id), label: tech.name, value: revenueByTech.get(tech.id) || 0, color: tech.color }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [ticketsInRange, technicians]);

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

  const nothingYet = tickets.length === 0 && posSales.length === 0 && websiteOrders.length === 0 && inventory.length === 0 && tradeIns.length === 0;

  return (
    <div>
      <PageHeader
        description="Live revenue, tax, and profit across repairs, retail, and the website — plus your existing shop insights."
        eyebrow="Accounting"
        title="Accounting"
      />

      {loading ? (
        <p className="m-0 text-sm text-muted">Loading accounting data…</p>
      ) : nothingYet ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
            <Calculator className="size-8" />
          </span>
          <h4 className="m-0 text-lg font-bold text-foreground">Nothing to report yet</h4>
          <p className="m-0 max-w-md text-sm text-muted">Once you have tickets, POS sales, or inventory, revenue, tax, and profit will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Range picker */}
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  rangeKey === r.key ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:bg-surface-secondary"
                }`}
                type="button"
                onClick={() => setRangeKey(r.key)}
              >
                {r.label}
              </button>
            ))}
            {rangeKey === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <span className="text-xs text-muted">to</span>
                <input
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}
            <span className="ml-auto text-xs font-semibold text-muted">{range.label}</span>
          </div>

          <Tabs defaultSelectedKey="overview" variant="secondary">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Accounting view">
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="overview">
                  <TrendingUp className="size-4 shrink-0" />
                  <span>Overview</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="pl">
                  <Landmark className="size-4 shrink-0" />
                  <span>Revenue &amp; P&amp;L</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="tax">
                  <Receipt className="size-4 shrink-0" />
                  <span>Sales Tax</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="ledger">
                  <Coins className="size-4 shrink-0" />
                  <span>Ledger</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="square">
                  <RefreshCw className="size-4 shrink-0" />
                  <span>Square</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="insights">
                  <BarChart3 className="size-4 shrink-0" />
                  <span>Shop Insights</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* ── Overview ─────────────────────────────────────────────── */}
            <Tabs.Panel className="pt-4" id="overview">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <StatTile icon={DollarSign} label="Total Revenue" tone="accent" value={formatCurrency(grossRevenue)} />
                  <StatTile icon={TrendingUp} label="Gross Profit" tone="success" value={formatCurrency(grossProfit)} sub={`COGS est. ${formatCurrency(cogs.total)}`} />
                  <StatTile icon={Receipt} label="Tax Collected" tone="warning" value={formatCurrency(taxCollected)} />
                  <StatTile icon={Calculator} label="Net Profit (est.)" tone={netProfit >= 0 ? "success" : "danger"} value={formatSigned(netProfit)} />
                  <StatTile icon={Repeat} label="Trade-In Payouts" tone="danger" value={formatCurrency(Math.abs(tradeInPayouts))} />
                  <StatTile icon={TicketIcon} label="AR Outstanding" tone="accent" value={formatCurrency(arAging.total)} sub={`${arAging.openCount} open ticket${arAging.openCount === 1 ? "" : "s"}`} />
                </div>

                {(refundedPosTotal > 0 || refundedWebsiteTotal > 0) && (
                  <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <TriangleAlert className="size-4 shrink-0" />
                    <span>
                      Refunded this period: {refundedPosTotal > 0 && `${formatCurrency(refundedPosTotal)} (POS)`}
                      {refundedPosTotal > 0 && refundedWebsiteTotal > 0 && " · "}
                      {refundedWebsiteTotal > 0 && `${formatCurrency(refundedWebsiteTotal)} (Website)`} — excluded from revenue above.
                    </span>
                  </div>
                )}

                {websiteOrdersError && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary p-3 text-sm text-muted">
                    <CloudOff className="size-4 shrink-0" />
                    <span>
                      Website sales unavailable ({websiteOrdersError}) — this NovaOps account needs a row in the website&rsquo;s{" "}
                      <code className="rounded bg-surface-tertiary px-1 py-0.5">staff_users</code> table. See README.
                    </span>
                  </div>
                )}

                <div className="rounded-[28px] border border-border bg-surface p-6">
                  <h3 className="m-0 mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                    <CalendarClock className="size-4" />
                    Revenue — {range.label}
                  </h3>
                  <RevenueTrend points={revenueTrend} />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-border bg-surface p-6">
                    <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Revenue by Source</h3>
                    <BarList formatValue={(v) => formatCurrency(v)} rows={revenueBySourceRows} />
                  </div>
                  <div className="rounded-[28px] border border-border bg-surface p-6">
                    <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Revenue by Payment Method</h3>
                    <BarList formatValue={(v) => formatCurrency(v)} rows={paymentMethodRows} />
                  </div>
                </div>
              </div>
            </Tabs.Panel>

            {/* ── Revenue & P&L ────────────────────────────────────────── */}
            <Tabs.Panel className="pt-4" id="pl">
              <div className="flex flex-col gap-6">
                <div className="overflow-hidden rounded-[28px] border border-border bg-surface">
                  <div className="border-b border-border bg-surface-secondary/40 px-6 py-4">
                    <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-muted">Profit &amp; Loss — {range.label}</h3>
                  </div>
                  <div className="flex flex-col divide-y divide-border">
                    <PlRow label="Repair Revenue" value={repairRevenue} />
                    <PlRow label="Retail (POS) Revenue" value={retailRevenue} />
                    <PlRow label="Website Revenue" value={websiteRevenue} />
                    <PlRow bold label="Gross Revenue" value={grossRevenue} />
                    <PlRow indent label="POS Cost of Goods (est.)" value={-cogs.posCogs} />
                    <PlRow indent label="Repair Parts Cost (est.)" value={-cogs.partsCogs} />
                    <PlRow bold label="Gross Profit" value={grossProfit} />
                    <PlRow indent label="Trade-In Payouts" value={tradeInPayouts} />
                    <PlRow bold label="Net Profit (est.)" value={netProfit} />
                    <PlRow indent label={`Suggested Tax Reserve (${reservePct}% of profit)`} value={-taxReserve} />
                    <PlRow bold label="Net After Tax Reserve" value={netAfterReserve} />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4 text-xs text-muted">
                  <p className="m-0">
                    COGS is estimated from each item&rsquo;s <em>current</em> inventory cost, matched by SKU (POS) or part (repairs) — it can drift from the
                    true cost at time of sale if costs changed since. Website product costs aren&rsquo;t tracked (the storefront doesn&rsquo;t store a cost
                    field), so website COGS isn&rsquo;t included in Gross Profit. NovaOps doesn&rsquo;t track rent, payroll, or other overhead — add those
                    separately for a complete picture. The tax reserve is a suggestion based on Settings → Shop Settings, not a filing.
                  </p>
                </div>

                <div className="rounded-[28px] border border-border bg-surface p-6">
                  <h3 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-muted">Accounts Receivable Aging</h3>
                  <p className="m-0 mb-4 text-xs text-muted">A live snapshot of unpaid ticket balances — not scoped to the date range above.</p>
                  <BarList
                    formatValue={(v) => formatCurrency(v)}
                    rows={[
                      { key: "current", label: "Current", value: arAging.buckets.current, color: "var(--success)" },
                      { key: "1-30", label: "1–30 days overdue", value: arAging.buckets.d1_30, color: "var(--warning)" },
                      { key: "31-60", label: "31–60 days overdue", value: arAging.buckets.d31_60, color: "var(--warning)" },
                      { key: "61-90", label: "61–90 days overdue", value: arAging.buckets.d61_90, color: "var(--danger)" },
                      { key: "90+", label: "90+ days overdue", value: arAging.buckets.d90plus, color: "var(--danger)" },
                    ].filter((r) => r.value > 0)}
                  />
                  {arAging.total === 0 && <p className="m-0 text-sm text-muted">No outstanding balances — every ticket is paid in full.</p>}
                </div>
              </div>
            </Tabs.Panel>

            {/* ── Sales Tax ────────────────────────────────────────────── */}
            <Tabs.Panel className="pt-4" id="tax">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile icon={Receipt} label="Tax Collected" tone="warning" value={formatCurrency(taxCollected)} sub={range.label} />
                  <StatTile
                    icon={taxRateMismatch ? AlertTriangle : Calculator}
                    label="Effective Tax Rate"
                    tone={taxRateMismatch ? "danger" : "accent"}
                    value={`${effectiveTaxRate.toFixed(2)}%`}
                    sub={`Configured: ${configuredTaxRate}%`}
                  />
                  <StatTile
                    icon={CalendarClock}
                    label={`Next ${FILING_LABEL[String(filingFrequency)] || "quarterly"} filing (est.)`}
                    tone="accent"
                    value={nextDue.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  />
                </div>

                {taxRateMismatch && (
                  <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Your effective tax rate ({effectiveTaxRate.toFixed(2)}%) differs from the configured rate ({configuredTaxRate}%) by more than half a
                      point — double-check tax settings on Square, the website, and Settings → Shop Settings.
                    </span>
                  </div>
                )}

                <div className="rounded-[28px] border border-border bg-surface p-6">
                  <h3 className="m-0 mb-1 text-sm font-bold uppercase tracking-wide text-muted">Tax Collected by Month</h3>
                  <p className="m-0 mb-4 text-xs text-muted">From POS sales and website orders only — repair labor isn&rsquo;t taxed separately in NovaOps.</p>
                  <BarList formatValue={(v) => formatCurrency(v)} rows={monthlyTaxRows.map((r) => ({ ...r, color: "var(--warning)" }))} />
                </div>

                <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4 text-xs text-muted">
                  <p className="m-0">
                    The filing due date is a planning estimate (the common &ldquo;20th of the month after the period ends&rdquo; convention) — actual due
                    dates vary by state. Verify with your state&rsquo;s Department of Revenue. Set your filing frequency in Settings → Shop Settings.
                  </p>
                </div>
              </div>
            </Tabs.Panel>

            {/* ── Ledger ───────────────────────────────────────────────── */}
            <Tabs.Panel className="pt-4" id="ledger">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(["all", "repair", "retail", "website", "trade-in"] as LedgerFilter[]).map((f) => (
                  <button
                    key={f}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      ledgerFilter === f ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:bg-surface-secondary"
                    }`}
                    type="button"
                    onClick={() => setLedgerFilter(f)}
                  >
                    {f === "all" ? "All" : SOURCE_LABEL[f]}
                  </button>
                ))}
                <Button className="ml-auto" size="sm" variant="outline" onPress={handleExportCsv}>
                  <Download className="size-4" />
                  <span>Export CSV</span>
                </Button>
              </div>

              <DataTable
                ariaLabel="Transaction ledger"
                columns={[
                  { key: "date", header: "Date", render: (e: RevenueEvent) => e.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
                  {
                    key: "source",
                    header: "Source",
                    render: (e: RevenueEvent) => {
                      const Icon = SOURCE_ICON[e.source];

                      return (
                        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: SOURCE_COLOR[e.source] }}>
                          <Icon className="size-3.5" />
                          {SOURCE_LABEL[e.source]}
                        </span>
                      );
                    },
                  },
                  {
                    key: "description",
                    header: "Description",
                    render: (e: RevenueEvent) =>
                      e.refPath ? (
                        <Link className="truncate text-accent hover:underline" to={e.refPath}>
                          {e.description}
                        </Link>
                      ) : (
                        <span className="truncate">{e.description}</span>
                      ),
                  },
                  { key: "customer", header: "Customer", render: (e: RevenueEvent) => e.customerName || "—" },
                  { key: "method", header: "Method", render: (e: RevenueEvent) => <span className="capitalize">{e.method}</span> },
                  {
                    key: "amount",
                    header: "Amount",
                    headerClassName: "text-right",
                    cellClassName: "text-right",
                    render: (e: RevenueEvent) => (
                      <strong className={e.amount < 0 ? "text-danger" : "text-foreground"}>
                        {e.amount < 0 ? "−" : ""}
                        {formatCurrency(Math.abs(e.amount))}
                      </strong>
                    ),
                  },
                ]}
                data={filteredLedger}
                emptyState={{ icon: Coins, title: "No transactions in this range", description: "Try a wider date range or a different filter." }}
                rowKey={(e) => e.id}
              />
            </Tabs.Panel>

            {/* ── Square reconciliation ────────────────────────────────── */}
            <Tabs.Panel className="pt-4" id="square">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-4">
                  <p className="m-0 text-sm text-muted">
                    Pulls real payment and payout history directly from Square — independent of what NovaOps recorded — so you can confirm what actually
                    settled to your bank account.
                  </p>
                  <Button isDisabled={squareLoading} variant="outline" onPress={handleLoadSquare}>
                    <RefreshCw className={`size-4 ${squareLoading ? "animate-spin" : ""}`} />
                    <span>{squareLoading ? "Loading…" : "Load from Square"}</span>
                  </Button>
                </div>

                {squareError && (
                  <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                    <CircleAlert className="size-4 shrink-0" />
                    <span>{squareError} — configure Square in Settings first.</span>
                  </div>
                )}

                {squareLoaded && !squareError && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <StatTile icon={Banknote} label="Square Card Payments" tone="accent" value={formatCurrency(squareCardTotal)} sub={`${squarePayments.length} payment${squarePayments.length === 1 ? "" : "s"}`} />
                      <StatTile icon={TrendingDown} label="Processing Fees" tone="danger" value={formatCurrency(squareFeesTotal)} />
                      <StatTile
                        icon={squareDelta === 0 ? Calculator : AlertTriangle}
                        label="Vs. NovaOps Card/Terminal Total"
                        tone={Math.abs(squareDelta) < 0.01 ? "success" : "warning"}
                        value={formatSigned(squareDelta)}
                        sub={Math.abs(squareDelta) < 0.01 ? "Matches" : "Difference — investigate"}
                      />
                    </div>

                    <DataTable
                      ariaLabel="Square payouts"
                      columns={[
                        { key: "date", header: "Created", render: (p: SquarePayout) => new Date(p.createdAt).toLocaleDateString() },
                        { key: "arrival", header: "Arrival", render: (p: SquarePayout) => (p.arrivalDate ? new Date(p.arrivalDate).toLocaleDateString() : "—") },
                        { key: "status", header: "Status", render: (p: SquarePayout) => <span className="capitalize">{p.status.toLowerCase()}</span> },
                        { key: "amount", header: "Amount", headerClassName: "text-right", cellClassName: "text-right", render: (p: SquarePayout) => <strong>{formatCurrency(p.amount)}</strong> },
                      ]}
                      data={squarePayouts}
                      emptyState={{ icon: Landmark, title: "No payouts in this range", description: "Square batches deposits — none landed in the selected window." }}
                      rowKey={(p) => p.id}
                    />
                  </>
                )}
              </div>
            </Tabs.Panel>

            {/* ── Shop Insights (operational, not financial) ──────────── */}
            <Tabs.Panel className="pt-4" id="insights">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatTile icon={TrendingUp} label="Avg. Ticket Value" tone="accent" value={formatCurrency(avgTicketValue)} sub={range.label} />
                  <StatTile icon={Wrench} label="Open Tickets" tone="accent" value={String(openTickets)} />
                  <StatTile icon={Package} label="Low Stock Items" tone="warning" value={String(lowStockCount)} />
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
            </Tabs.Panel>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function PlRow({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 py-3 ${bold ? "bg-surface-secondary/40" : ""}`}>
      <span className={`text-sm ${bold ? "font-black text-foreground" : "text-muted"} ${indent ? "pl-4" : ""}`}>{label}</span>
      <span className={`text-sm ${bold ? "text-base font-black" : "font-semibold"} ${value < 0 ? "text-danger" : "text-foreground"}`}>
        {value < 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

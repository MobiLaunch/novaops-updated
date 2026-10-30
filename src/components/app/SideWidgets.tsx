import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, MessageSquare, Package, Pencil, ShoppingBag } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { ShopCounts } from "@/lib/useShopCounts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const GOAL_KEY = "novaops_revenue_goal";
const DONE = new Set(["Completed", "Delivered", "Closed"]);
const DAY = 86400000;

const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Rounds a goal up to a friendly number so the bar has somewhere sensible to end. */
const niceGoal = (n: number) => {
  if (n <= 0) return 5000;
  const step = n < 5000 ? 500 : n < 20000 ? 1000 : 5000;

  return Math.ceil((n * 1.1) / step) * step;
};

function Spark({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const w = 100;
  const h = 26;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - (p / max) * (h - 6)).toFixed(1)}`).join(" ");

  return (
    <svg aria-hidden="true" className="nv-spark" preserveAspectRatio="none" viewBox={`0 0 ${w} ${h}`}>
      <path d={`${d} L${w},${h} L0,${h} Z`} className="nv-spark-fill" />
      <path d={d} className="nv-spark-line" />
    </svg>
  );
}

/** Live shop numbers at the foot of the sidebar: revenue, tickets closed, and what needs attention. */
export function SideWidgets({ counts }: { counts: ShopCounts }) {
  const navigate = useNavigate();
  const tickets = useAppStore((s) => s.tickets);
  const inventory = useAppStore((s) => s.inventory);
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const [sales, setSales] = useState<{ total: number; created_at: string }[]>([]);
  const [goal, setGoal] = useState<number | null>(() => {
    try { const g = Number(localStorage.getItem(GOAL_KEY)); return g > 0 ? g : null; } catch { return null; }
  });

  useEffect(() => {
    const sb = getSupabase();

    if (!sb) return;
    const load = async () => {
      const since = new Date(monthStart().getTime() - 35 * DAY).toISOString();
      const s = await sb.from("pos_sales").select("total,created_at").gte("created_at", since).neq("status", "voided");

      if (s.data) setSales(s.data.map((r: any) => ({ total: Number(r.total) || 0, created_at: r.created_at })));
    };

    void load();
    const t = setInterval(() => void load(), 90000);

    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const start = monthStart(now).getTime();
    const prevStart = monthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1)).getTime();
    const dayOfMonth = now.getDate();
    const daily = new Array(14).fill(0) as number[];
    let cur$ = 0;
    let prev$ = 0;
    const add = (amount: number, iso?: string) => {
      const t = iso ? new Date(iso).getTime() : NaN;

      if (!Number.isFinite(t) || !amount) return;
      if (t >= start) cur$ += amount;
      else if (t >= prevStart && t < prevStart + dayOfMonth * DAY) prev$ += amount;
      const ago = Math.floor((now.getTime() - t) / DAY);

      if (ago >= 0 && ago < 14) daily[13 - ago] += amount;
    };

    tickets.forEach((t: any) => (t.payments || []).forEach((p: any) => add(Number(p.amount) || 0, p.date)));
    sales.forEach((s) => add(s.total, s.created_at));

    const closed = tickets.filter((t: any) => DONE.has(t.status) && new Date(t.updatedAt || t.createdAt || 0).getTime() >= start).length;
    const open = tickets.filter((t: any) => !DONE.has(t.status)).length;
    const low = inventory.filter((i: any) => i.itemType !== "service" && i.stock <= (i.low || 5)).length;

    return { cur$, prev$, daily, closed, open, low, change: prev$ > 0 ? Math.round(((cur$ - prev$) / prev$) * 100) : null };
  }, [tickets, sales, inventory]);

  const target = goal ?? niceGoal(Math.max(stats.prev$, stats.cur$));
  const pct = Math.min(100, Math.round((stats.cur$ / target) * 100));
  const closedPct = stats.closed + stats.open > 0 ? Math.round((stats.closed / (stats.closed + stats.open)) * 100) : 0;

  const editGoal = () => {
    const v = window.prompt("Monthly revenue goal", String(target));
    const n = Number(v);

    if (v === null || !(n > 0)) return;
    setGoal(n);
    try { localStorage.setItem(GOAL_KEY, String(n)); } catch { /* storage unavailable */ }
  };

  const chips = [
    { key: "low", label: "Low", value: counts.low, icon: Package, to: "/inventory" },
    { key: "ship", label: "To ship", value: counts.toShip, icon: ShoppingBag, to: "/website" },
    { key: "msg", label: "Unread", value: counts.unread, icon: MessageSquare, to: "/messages" },
  ];

  return (
    <div className="nv-widgets" aria-label="Shop at a glance">
      <section className="nv-widget" aria-label="Revenue this month">
        <header>
          <span>Revenue this month</span>
          <button aria-label="Set monthly goal" className="nv-widget-edit" type="button" onClick={editGoal}><Pencil size={12} aria-hidden="true" /></button>
        </header>
        <strong className="nv-widget-value">{formatCurrency(stats.cur$, cur)}</strong>
        <Spark points={stats.daily} />
        <div className="nv-bar" role="progressbar" aria-label="Progress to monthly goal" aria-valuemax={100} aria-valuemin={0} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
        <footer>
          <span>{pct}% of {formatCurrency(target, cur)}</span>
          {stats.change !== null && <span className="nv-delta" data-up={stats.change >= 0 ? "true" : "false"}>{stats.change >= 0 ? "+" : ""}{stats.change}% vs last month</span>}
        </footer>
      </section>

      <section className="nv-widget" aria-label="Tickets closed this month">
        <header><span>Tickets closed this month</span><CircleCheck size={13} aria-hidden="true" /></header>
        <strong className="nv-widget-value">{stats.closed}</strong>
        <div className="nv-bar" role="progressbar" aria-label="Closed against open tickets" aria-valuemax={100} aria-valuemin={0} aria-valuenow={closedPct}><span style={{ width: `${closedPct}%` }} /></div>
        <footer><span>{stats.open} still open</span></footer>
      </section>

      <div className="nv-chips">
        {chips.map(({ key, label, value, icon: Icon, to }) => (
          <button key={key} className="nv-chip" data-alert={value > 0 ? "true" : "false"} type="button" onClick={() => navigate(to)}>
            <Icon size={13} aria-hidden="true" /><strong>{value}</strong><span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

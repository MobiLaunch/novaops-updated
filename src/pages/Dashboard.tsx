import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, CloudSun, Package, Plus, Receipt, Users, Wrench } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { SortableDataTable, type DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import { UpcomingPanel } from "@/components/app/UpcomingPanel";
import { PageHead } from "@/components/app/PageHead";
import { StatCard } from "@/components/app/StatCard";
import { getGreeting, useWeather } from "@/hooks/useWeather";
import { formatCurrency, statusTone } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { useUi } from "@/lib/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const DAY = 86400000;
const isDone = (s: string) => s === "Completed" || s === "Delivered";
const sameDay = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

import { WebSummary } from "@/components/app/WebSummary";

export default function Dashboard() {
  const navigate = useNavigate();
  const open = useUi((u) => u.openQuickAction);
  const { tickets, customers, inventory, appointments, settings } = useAppStore();
  const weather = useWeather();
  const cur = settings.currency || "$";

  useEffect(() => {
    const w = useWeather.getState();

    if (!w.loaded && !w.loading) void w.fetchWeather();
  }, []);

  const d = useMemo(() => {
    const done = tickets.filter((t) => isDone(t.status));
    const active = tickets.filter((t) => t.status !== "Closed" && t.status !== "Delivered");
    const doneToday = done.filter((t) => sameDay(t.updatedAt));
    const lowStock = inventory.filter((i) => (i.itemType || "product") !== "service" && i.stock <= (i.low || 5)).length;
    const upcoming = appointments.filter((a: any) => a.status === "scheduled").length;
    const expiring = done
      .filter((t) => t.warrantyDays > 0 && t.warrantyStart)
      .map((t) => ({ t, left: Math.ceil((new Date(t.warrantyStart!).getTime() + t.warrantyDays * DAY - Date.now()) / DAY) }))
      .filter((x) => x.left >= 0 && x.left <= 14)
      .sort((a, b) => a.left - b.left);

    return {
      revenue: tickets.filter((t) => t.price > 0 && isDone(t.status)).reduce((a, t) => a + t.price, 0),
      jobs: done.length,
      active: active.length,
      doneToday: doneToday.length,
      todayRevenue: doneToday.filter((t) => t.price > 0).reduce((a, t) => a + t.price, 0),
      lowStock,
      upcoming,
      expiring,
      waiting: tickets.filter((t) => t.status === "Waiting for Parts"),
      recent: [...tickets].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8),
    };
  }, [tickets, inventory, appointments]);

  const name = (id: number) => customers.find((c) => c.id === id)?.name || "Unknown";
  const age = (t: any) => (t.createdAt ? Math.floor((Date.now() - new Date(t.createdAt).getTime()) / DAY) : 0);

  const columns: DataColumn<Record<string, unknown>>[] = [
    { key: "id", label: "#", width: 96, render: (v) => `#${v}` },
    { key: "customer", label: "Customer" },
    { key: "device", label: "Device" },
    { key: "status", label: "Status", width: 190, render: (_v, r: any) => (
      <span className="nv-actions">
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
        {r.age >= 3 && !isDone(r.status) && <Badge tone={r.age >= 7 ? "danger" : "warning"} size="sm">{r.age}d</Badge>}
      </span>
    ) },
    { key: "price", label: "Price", numeric: true, width: 110, render: (v) => formatCurrency(v as number, cur) },
  ];
  const rows = d.recent.map((t: any) => ({ id: t.id, customer: name(t.customerId), device: `${t.device} ${t.deviceModel || ""}`.trim(), status: t.status, price: t.price || 0, age: age(t) }));

  const actions = [
    { label: "New sale", icon: Receipt, go: () => navigate("/pos") },
    { label: "New ticket", icon: Plus, go: () => open("ticket") },
    { label: "Schedule", icon: CalendarDays, go: () => navigate("/bookings") },
    { label: "Inventory", icon: Package, go: () => navigate("/inventory") },
    { label: "Customers", icon: Users, go: () => navigate("/customers") },
    { label: "House call", icon: Wrench, go: () => open("housecall") },
  ];

  return (
    <>
      <PageHead title="Dashboard" subtitle={`${getGreeting()} · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}>
        <Button onClick={() => open("ticket")}><Plus size={14} />New ticket</Button>
      </PageHead>

      <div className="nv-stack" style={{ gap: 16 }}>
        {weather.loaded ? (
          <Alert tone="info" title={`${weather.temp}°F · ${weather.description} in ${weather.location}`} />
        ) : !weather.loading && (
          <Button variant="secondary" size="sm" onClick={() => void weather.fetchWeather()}><CloudSun size={14} />Load local weather</Button>
        )}
        {d.expiring.slice(0, 2).map(({ t, left }) => <Alert key={`w${t.id}`} tone="warning" title={`#${t.id} · ${t.device}`} >Warranty ends in {left} days</Alert>)}
        {d.waiting.slice(0, 2).map((t) => <Alert key={`p${t.id}`} tone="danger" title={`#${t.id} · ${t.device}`}>Waiting for parts</Alert>)}

        <div className="nv-grid cols-4">
          <StatCard label="Revenue" value={formatCurrency(d.revenue, cur)} context={`${d.jobs} completed ${d.jobs === 1 ? "job" : "jobs"}`} />
          <MetricCard label="Active tickets" value={d.active} context={`${d.doneToday} finished today`} />
          <MetricCard label="Customers" value={customers.length} context="In your list" />
          <MetricCard label="Low stock" value={d.lowStock} context={`${d.upcoming} upcoming ${d.upcoming === 1 ? "appointment" : "appointments"}`} />
        </div>

        <div className="nv-grid cols-3">
          {actions.map((a) => (
            <Button key={a.label} variant="secondary" size="lg" onClick={a.go}><a.icon size={16} />{a.label}</Button>
          ))}
        </div>

        <WebSummary />

        <UpcomingPanel />

        <div className="nv-panel">
          <div className="nv-actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Recent tickets</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>View all<ArrowRight size={14} /></Button>
          </div>
          <div className="nv-table-wrap">
            <SortableDataTable rows={rows} columns={columns} rowKey="id" caption="Recent tickets" emptyMessage="No tickets yet. Create your first one." />
          </div>
          <p className="nv-muted" style={{ margin: "12px 0 0", fontSize: 13 }}>Today: {formatCurrency(d.todayRevenue, cur)} collected · {d.doneToday} completed</p>
        </div>
      </div>
    </>
  );
}

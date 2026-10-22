import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Home } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
function fromNow(d: Date) {
  const mins = Math.round((d.getTime() - Date.now()) / 60000);

  if (mins < 60) return `In ${Math.max(mins, 1)} min`;
  if (mins < 1440) return `In ${Math.round(mins / 60)} h`;

  const days = Math.round(mins / 1440);

  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

/** Upcoming appointments and house calls, plus the latest notifications. */
export function UpcomingPanel() {
  const navigate = useNavigate();
  const { houseCalls, appointments, customers } = useAppStore();
  const { notifications, markAllAsRead } = useNotifications();

  const items = useMemo(() => {
    const now = new Date();
    const out: { id: string; kind: "housecall" | "appointment"; title: string; subtitle: string; date: Date }[] = [];

    (houseCalls as any[]).forEach((c) => {
      const d = new Date(`${c.date}T${c.time || "00:00"}`);

      if (c.date && d >= now && !["Cancelled", "Completed", "cancelled", "completed"].includes(c.status)) out.push({ id: `h${c.id}`, kind: "housecall", title: c.issue || c.description || "House call", subtitle: c.address || "", date: d });
    });
    (appointments as any[]).forEach((a) => {
      const d = new Date(`${a.date}T${a.time || "00:00"}`);

      if (a.date && d >= now && !["cancelled", "completed"].includes(String(a.status).toLowerCase())) out.push({ id: `a${a.id}`, kind: "appointment", title: a.title || a.description || "Appointment", subtitle: customers.find((c) => c.id === a.customerId)?.name || "", date: d });
    });

    return out.sort((x, y) => x.date.getTime() - y.date.getTime()).slice(0, 5);
  }, [houseCalls, appointments, customers]);

  return (
    <div className="nv-grid cols-2">
      <div className="nv-panel">
        <div className="nv-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}><h2 style={{ margin: 0 }}>Upcoming</h2><Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>View all</Button></div>
        {items.length === 0 ? <EmptyState icon={<CalendarClock size={18} />} title="Nothing coming up" description="Appointments and house calls show here." /> : items.map((i) => (
          <div key={i.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => navigate("/bookings")}>
            {i.kind === "housecall" ? <Home size={16} /> : <CalendarClock size={16} />}
            <div className="nv-row-main"><strong>{i.title}</strong><span>{i.subtitle}</span></div>
            <span className="nv-muted" style={{ fontSize: 13 }}>{fromNow(i.date)}</span>
          </div>
        ))}
      </div>
      <div className="nv-panel">
        <div className="nv-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}><h2 style={{ margin: 0 }}>Activity</h2>{notifications.length > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all read</Button>}</div>
        {notifications.length === 0 ? <EmptyState title="No activity yet" description="New tickets, sales and emails appear here." /> : notifications.slice(0, 5).map((n) => (
          <div key={n.id} className="nv-row"><div className="nv-row-main"><strong style={{ opacity: n.read ? 0.6 : 1 }}>{n.title}</strong><span>{n.message}</span></div><span className="nv-muted" style={{ fontSize: 12 }}>{new Date(n.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>
        ))}
      </div>
    </div>
  );
}

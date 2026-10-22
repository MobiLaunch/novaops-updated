import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SegmentedControl } from "@/components/arc/segmented-control/segmented-control";
import { useAppStore } from "@/lib/store";
import type { BadgeTone } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const KINDS = { appointment: "Appointment", housecall: "House call", ticket: "Repair ticket" } as const;

const tone = (s?: string): BadgeTone => {
  const st = (s || "").toLowerCase();

  if (["scheduled", "open"].includes(st)) return "info";
  if (st === "in progress") return "warning";
  if (["completed", "delivered"].includes(st)) return "success";
  if (st === "cancelled") return "danger";

  return "neutral";
};

export function CalendarTab() {
  const appointments = useAppStore((s) => s.appointments) as any[];
  const houseCalls = useAppStore((s) => s.houseCalls) as any[];
  const tickets = useAppStore((s) => s.tickets) as any[];
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const today = iso(new Date());

  const events = useMemo(() => [
    ...appointments.map((a) => ({ ...a, _id: `a${a.id}`, _kind: a.type === "housecall" ? "housecall" : "appointment", label: a.title || a.description || "Untitled" })),
    ...houseCalls.map((h) => ({ ...h, _id: `h${h.id}`, _kind: "housecall", label: h.address || h.description || "House call" })),
    ...tickets.filter((t) => t.date || t.createdAt).map((t) => ({ ...t, _id: `t${t.id}`, _kind: "ticket", date: t.date || t.createdAt.split("T")[0], label: `#${t.id} ${t.device || ""}`.trim() })),
  ], [appointments, houseCalls, tickets]);
  const on = (d: string) => events.filter((e) => e.date === d);

  const days = useMemo(() => {
    if (view === "week") {
      const start = new Date(cursor);

      start.setDate(cursor.getDate() - cursor.getDay());

      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return { d, date: iso(d), cur: true }; });
    }

    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const total = Math.ceil((first.getDay() + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7) * 7;

    return Array.from({ length: total }, (_, i) => { const d = new Date(first); d.setDate(1 - first.getDay() + i); return { d, date: iso(d), cur: d.getMonth() === cursor.getMonth() }; });
  }, [cursor, view]);

  const move = (dir: number) => setCursor((c) => {
    const n = new Date(c);

    if (view === "week") n.setDate(n.getDate() + 7 * dir);
    else n.setMonth(n.getMonth() + dir, 1);

    return n;
  });

  const label = view === "week"
    ? `${days[0].d.toLocaleDateString([], { month: "short", day: "numeric" })} – ${days[6].d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
    : cursor.toLocaleDateString([], { month: "long", year: "numeric" });

  const agenda = useMemo(() => {
    const prefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const by = new Map<string, any[]>();

    for (const e of events) if (e.date?.startsWith(prefix)) by.set(e.date, [...(by.get(e.date) ?? []), e]);

    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events, cursor]);

  return (
    <div className="nv-stack" style={{ marginTop: 16 }}>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <div className="nv-actions">
          <Button variant="ghost" size="sm" aria-label="Previous" onClick={() => move(-1)}><ChevronLeft size={16} /></Button>
          <strong style={{ fontWeight: 500, minWidth: 150, textAlign: "center" }}>{label}</strong>
          <Button variant="ghost" size="sm" aria-label="Next" onClick={() => move(1)}><ChevronRight size={16} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <SegmentedControl label="View" value={view} onValueChange={(v: string) => setView(v)} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "agenda", label: "Agenda" }]} />
      </div>

      {view === "agenda" ? (
        agenda.length === 0 ? <EmptyState title="Nothing scheduled" description="Appointments, house calls and tickets for this month show up here." /> : (
          <div className="nv-panel">
            {agenda.map(([date, list]) => (
              <div key={date} style={{ marginBottom: 12 }}>
                <h2>{new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</h2>
                {list.map((e) => (
                  <div key={e._id} className="nv-row">
                    <div className="nv-row-main"><strong>{e.label}</strong><span>{KINDS[e._kind as keyof typeof KINDS]}{e.time ? ` · ${e.time}` : ""}</span></div>
                    {e.status && <Badge tone={tone(e.status)}>{e.status}</Badge>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="nv-cal">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="nv-cal-dow">{d}</div>)}
          {days.map(({ d, date, cur }) => {
            const list = on(date);

            return (
              <div key={date} className={`nv-cal-cell${cur ? "" : " off"}${date === today ? " today" : ""}`}>
                <span className="nv-cal-num">{d.getDate()}</span>
                {list.slice(0, view === "week" ? 8 : 3).map((e) => <span key={e._id} className={`nv-cal-ev ${e._kind}`} title={e.label}>{e.label}</span>)}
                {list.length > (view === "week" ? 8 : 3) && <span className="nv-muted" style={{ fontSize: 11 }}>+{list.length - 3} more</span>}
                {list.length > 0 && <span className="dot" style={{ display: "none" }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

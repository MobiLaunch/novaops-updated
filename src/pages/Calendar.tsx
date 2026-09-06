import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Home,
  MapPin,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { Appointment, BookingRecord, Customer, HouseCall, Ticket } from "@/types/domain";
import {
  sbCreateAppointment,
  sbCreateHouseCall,
  sbDeleteAppointment,
  sbDeleteHouseCall,
  sbFetchAppointments,
  sbFetchBookings,
  sbFetchCustomers,
  sbFetchHouseCalls,
  sbFetchTickets,
  sbUpdateAppointment,
  sbUpdateHouseCall,
} from "@/lib/supabase";
import { toastWriteFailed } from "@/lib/toast";
import { parseDateOnly, startOfToday, useRefetchOnFocus } from "@/lib/utils";

const APPT_STATUSES = ["scheduled", "confirmed", "completed", "cancelled", "no-show"];
const CALL_STATUSES = ["scheduled", "completed", "cancelled"];
// Monday-first, matching the business-hours list in Settings.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Times are stored as free text and older rows hold things like "2:00 PM",
// so 24h values from the time input are prettified and anything else is
// passed through untouched rather than mangled.
function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) return value.trim();
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${((hours + 11) % 12) + 1}:${match[2]} ${suffix}`;
}

// Normalises both the 24h values the time input produces and the older
// free-text "2:00 PM" rows to HH:MM, so the two sort together and a legacy
// row still loads into the time input instead of showing up blank.
function to24h(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/.exec(value.trim());

  if (!match) return null;
  let hours = Number(match[1]);

  if (match[3]) hours = (hours % 12) + (match[3].toLowerCase() === "pm" ? 12 : 0);
  if (hours > 23) return null;

  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

// Blank and unparseable times sort last, so an all-day entry doesn't jump
// above a 9am one.
function timeSortKey(value: string): string {
  return to24h(value) ?? "99:99";
}

type EventKind = "appointment" | "house-call" | "booking" | "due";

const KIND_META: Record<EventKind, { label: string; icon: typeof CalendarClock; dot: string; chip: string }> = {
  appointment: { label: "Appointment", icon: CalendarClock, dot: "bg-accent", chip: "bg-accent-soft text-accent" },
  "house-call": { label: "House Call", icon: Home, dot: "bg-success", chip: "bg-success/15 text-success" },
  booking: { label: "Website Booking", icon: Globe, dot: "bg-warning", chip: "bg-warning/15 text-warning" },
  due: { label: "Ticket Due", icon: Wrench, dot: "bg-danger", chip: "bg-danger/15 text-danger" },
};

interface CalEvent {
  key: string;
  kind: EventKind;
  date: string;
  time: string;
  title: string;
  subtitle: string;
  status?: string;
  refPath?: string;
  appointment?: Appointment;
  houseCall?: HouseCall;
}

const emptyAppt = { title: "", description: "", date: "", time: "", customerId: "" };
const emptyCall = { description: "", address: "", date: "", time: "", customerId: "" };

export default function CalendarPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [houseCalls, setHouseCalls] = useState<HouseCall[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<"month" | "upcoming">("month");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = startOfToday();

    d.setDate(1);

    return d;
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(startOfToday()));

  const [creatingAppt, setCreatingAppt] = useState<typeof emptyAppt | null>(null);
  const [creatingCall, setCreatingCall] = useState<typeof emptyCall | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, h, b, t, c] = await Promise.all([
      sbFetchAppointments(),
      sbFetchHouseCalls(),
      sbFetchBookings(),
      sbFetchTickets(),
      sbFetchCustomers(),
    ]);

    setLoading(false);
    if (a.data) setAppointments(a.data);
    if (h.data) setHouseCalls(h.data);
    if (b.data) setBookings(b.data);
    if (t.data) setTickets(t.data);
    if (c.data) setCustomers(c.data);
  };

  useEffect(() => {
    load();
  }, []);

  // Front desk and bench run this side by side — pick the tab back up and
  // it refreshes instead of showing whatever was there when you left.
  useRefetchOnFocus(load);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  // One list from every source that puts something on the shop's day — the
  // page used to show only its own two tables, so a website booking or a
  // repair promised for today was invisible here.
  const events = useMemo<CalEvent[]>(() => {
    const all: CalEvent[] = [];

    for (const a of appointments) {
      if (!a.date) continue;
      const customer = a.customer_id ? customerById.get(a.customer_id) : undefined;

      all.push({
        key: `apt-${a.id}`,
        kind: "appointment",
        date: a.date.slice(0, 10),
        time: a.time || "",
        title: a.title || "Appointment",
        subtitle: [customer?.name, a.description].filter(Boolean).join(" · "),
        status: a.status,
        appointment: a,
      });
    }

    for (const h of houseCalls) {
      if (!h.date) continue;
      const customer = h.customer_id ? customerById.get(h.customer_id) : undefined;

      all.push({
        key: `hc-${h.id}`,
        kind: "house-call",
        date: h.date.slice(0, 10),
        time: h.time || "",
        title: h.description || "House call",
        subtitle: [customer?.name, h.address].filter(Boolean).join(" · "),
        status: h.status,
        houseCall: h,
      });
    }

    for (const b of bookings) {
      if (!b.appt_date || b.status === "cancelled") continue;
      all.push({
        key: `bk-${b.id}`,
        kind: "booking",
        date: b.appt_date.slice(0, 10),
        time: b.appt_time || "",
        title: `${b.customer_name} — ${b.service || b.device_type}`.trim(),
        subtitle: [b.device_type, b.device_model].filter(Boolean).join(" "),
        status: b.status,
        refPath: "/bookings",
      });
    }

    for (const t of tickets) {
      if (!t.due_date || t.status === "Completed" || t.status === "Delivered") continue;
      const customer = t.customer_id ? customerById.get(t.customer_id) : undefined;

      all.push({
        key: `due-${t.id}`,
        kind: "due",
        date: t.due_date.slice(0, 10),
        time: "",
        title: `Due: ${t.device} ${t.device_model}`.trim(),
        subtitle: [customer?.name, t.issue].filter(Boolean).join(" · "),
        status: t.status,
        refPath: `/tickets?open=${t.id}`,
      });
    }

    return all.sort((x, y) => {
      if (x.date !== y.date) return x.date < y.date ? -1 : 1;
      const kx = timeSortKey(x.time);
      const ky = timeSortKey(y.time);

      return kx === ky ? 0 : kx < ky ? -1 : 1;
    });
  }, [appointments, houseCalls, bookings, tickets, customerById]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();

    for (const e of events) {
      const list = map.get(e.date);

      if (list) list.push(e);
      else map.set(e.date, [e]);
    }

    return map;
  }, [events]);

  // Six weeks starting on the Monday on or before the 1st, so every month
  // renders the same height and doesn't jump as you page through.
  const grid = useMemo(() => {
    const first = new Date(viewMonth);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);

    start.setDate(first.getDate() - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start);

      day.setDate(start.getDate() + i);

      return day;
    });
  }, [viewMonth]);

  const todayKey = toDateKey(startOfToday());

  const upcoming = useMemo(() => {
    const horizon = startOfToday();

    horizon.setDate(horizon.getDate() + 30);

    return events.filter((e) => {
      const d = parseDateOnly(e.date);

      return d !== null && d >= startOfToday() && d <= horizon;
    });
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  const handleCreateAppt = async () => {
    if (!creatingAppt?.title.trim() || !creatingAppt.date) return;
    setSaving(true);
    const { data } = await sbCreateAppointment({
      title: creatingAppt.title,
      description: creatingAppt.description,
      date: creatingAppt.date,
      time: creatingAppt.time,
      customer_id: creatingAppt.customerId ? Number(creatingAppt.customerId) : null,
      status: "scheduled",
    });

    setSaving(false);
    if (!data) {
      toastWriteFailed("this appointment");

      return;
    }
    setAppointments((rows) => [...rows, data]);
    setSelectedDate(creatingAppt.date);
    setCreatingAppt(null);
  };

  const handleCreateCall = async () => {
    if (!creatingCall?.description.trim() || !creatingCall.date) return;
    setSaving(true);
    const { data } = await sbCreateHouseCall({
      description: creatingCall.description,
      address: creatingCall.address,
      date: creatingCall.date,
      time: creatingCall.time,
      customer_id: creatingCall.customerId ? Number(creatingCall.customerId) : null,
      status: "scheduled",
    });

    setSaving(false);
    if (!data) {
      toastWriteFailed("this house call");

      return;
    }
    setHouseCalls((rows) => [...rows, data]);
    setSelectedDate(creatingCall.date);
    setCreatingCall(null);
  };

  // Commit only once the write lands, so a rejected change never sits on
  // screen looking saved.
  const handleApptStatus = async (id: number, status: string) => {
    if (!(await sbUpdateAppointment(id, { status }))) {
      toastWriteFailed("this appointment");

      return;
    }
    setAppointments((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleCallStatus = async (id: number, status: string) => {
    if (!(await sbUpdateHouseCall(id, { status }))) {
      toastWriteFailed("this house call");

      return;
    }
    setHouseCalls((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleReschedule = async (event: CalEvent, date: string, time: string) => {
    if (event.appointment) {
      if (!(await sbUpdateAppointment(event.appointment.id, { date, time }))) {
        toastWriteFailed("this appointment");

        return;
      }
      setAppointments((rows) => rows.map((r) => (r.id === event.appointment!.id ? { ...r, date, time } : r)));
    } else if (event.houseCall) {
      if (!(await sbUpdateHouseCall(event.houseCall.id, { date, time }))) {
        toastWriteFailed("this house call");

        return;
      }
      setHouseCalls((rows) => rows.map((r) => (r.id === event.houseCall!.id ? { ...r, date, time } : r)));
    }
    setSelectedDate(date);
  };

  const handleDelete = async (event: CalEvent) => {
    if (event.appointment) {
      if (!(await sbDeleteAppointment(event.appointment.id))) {
        toastWriteFailed("this appointment");

        return;
      }
      setAppointments((rows) => rows.filter((r) => r.id !== event.appointment!.id));
    } else if (event.houseCall) {
      if (!(await sbDeleteHouseCall(event.houseCall.id))) {
        toastWriteFailed("this house call");

        return;
      }
      setHouseCalls((rows) => rows.filter((r) => r.id !== event.houseCall!.id));
    }
  };

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shiftMonth = (delta: number) => {
    const next = new Date(viewMonth);

    next.setMonth(next.getMonth() + delta);
    setViewMonth(next);
  };

  const customerPicker = (value: string, onChange: (v: string) => void) => (
    <div className="flex flex-col gap-1.5">
      <Label>Customer (optional)</Label>
      <Select placeholder="No customer" selectedKey={value || null} onSelectionChange={(k) => onChange(k ? String(k) : "")}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {customers.map((c) => (
              <ListBox.Item key={c.id} id={String(c.id)}>
                {c.name}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        action={
          <div className="flex gap-2">
            <Button variant="outline" onPress={() => setCreatingCall({ ...emptyCall, date: selectedDate })}>
              <Home className="size-4" />
              <span>House Call</span>
            </Button>
            <Button variant="primary" onPress={() => setCreatingAppt({ ...emptyAppt, date: selectedDate })}>
              <Plus className="size-4" />
              <span>Appointment</span>
            </Button>
          </div>
        }
        description="Appointments, house calls, website bookings, and repairs due — all on one calendar."
        eyebrow="Schedule"
        title="Calendar"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
            view === "month" ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:bg-surface-secondary"
          }`}
          type="button"
          onClick={() => setView("month")}
        >
          Month
        </button>
        <button
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
            view === "upcoming" ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:bg-surface-secondary"
          }`}
          type="button"
          onClick={() => setView("upcoming")}
        >
          Next 30 Days ({upcoming.length})
        </button>
        <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted">
          {(Object.keys(KIND_META) as EventKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${KIND_META[k].dot}`} />
              {KIND_META[k].label}
            </span>
          ))}
        </span>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="overflow-hidden rounded-[28px] border border-border bg-surface xl:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <strong className="text-sm font-black text-foreground">{monthLabel}</strong>
              <div className="flex items-center gap-1">
                <Button isIconOnly aria-label="Previous month" size="sm" variant="ghost" onPress={() => shiftMonth(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    const d = startOfToday();

                    d.setDate(1);
                    setViewMonth(d);
                    setSelectedDate(todayKey);
                  }}
                >
                  Today
                </Button>
                <Button isIconOnly aria-label="Next month" size="sm" variant="ghost" onPress={() => shiftMonth(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-surface-secondary/40">
              {WEEKDAYS.map((d) => (
                <span key={d} className="px-2 py-2 text-center text-micro font-bold uppercase text-muted">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((day) => {
                const key = toDateKey(day);
                const dayEvents = eventsByDate.get(key) ?? [];
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;

                return (
                  <button
                    key={key}
                    className={`flex min-h-[92px] flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0 ${
                      isSelected ? "bg-accent-soft/60" : inMonth ? "bg-surface hover:bg-surface-secondary/60" : "bg-surface-secondary/30"
                    }`}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isToday ? "bg-accent text-accent-foreground" : inMonth ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.key} className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold ${KIND_META[e.kind].chip}`}>
                          {e.time ? `${formatTime(e.time)} ` : ""}
                          {e.title}
                        </span>
                      ))}
                      {dayEvents.length > 3 && <span className="px-1 text-[10px] text-muted">+{dayEvents.length - 3} more</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <DayPanel
            events={selectedEvents}
            loading={loading}
            selectedDate={selectedDate}
            onDelete={handleDelete}
            onNavigate={navigate}
            onReschedule={handleReschedule}
            onStatus={(e, status) =>
              e.appointment ? handleApptStatus(e.appointment.id, status) : e.houseCall ? handleCallStatus(e.houseCall.id, status) : undefined
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
                <CalendarDays className="size-8" />
              </span>
              <h4 className="m-0 text-lg font-bold text-foreground">{loading ? "Loading…" : "Nothing in the next 30 days"}</h4>
            </div>
          ) : (
            upcoming.map((e) => {
              const Icon = KIND_META[e.kind].icon;

              return (
                <button
                  key={e.key}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent/40"
                  type="button"
                  onClick={() => {
                    if (e.refPath) navigate(e.refPath);
                    else {
                      setView("month");
                      setSelectedDate(e.date);
                    }
                  }}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${KIND_META[e.kind].chip}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-foreground">{e.title}</strong>
                    <span className="block truncate text-xs text-muted">{e.subtitle || KIND_META[e.kind].label}</span>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <span className="block font-semibold text-foreground">
                      {parseDateOnly(e.date)?.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    {e.time && <span className="text-muted">{formatTime(e.time)}</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* New appointment */}
      <Modal>
        <Modal.Backdrop isOpen={!!creatingAppt} onOpenChange={(open) => !open && setCreatingAppt(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New Appointment</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={creatingAppt?.title || ""}
                  onChange={(v) => setCreatingAppt((f) => f && { ...f, title: v })}
                >
                  <Label>Title</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Date</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    type="date"
                    value={creatingAppt?.date || ""}
                    onChange={(e) => setCreatingAppt((f) => f && { ...f, date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Time</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    type="time"
                    value={creatingAppt?.time || ""}
                    onChange={(e) => setCreatingAppt((f) => f && { ...f, time: e.target.value })}
                  />
                </div>
                {customerPicker(creatingAppt?.customerId || "", (v) => setCreatingAppt((f) => f && { ...f, customerId: v }))}
                <TextField
                  className="flex flex-col gap-1.5"
                  value={creatingAppt?.description || ""}
                  onChange={(v) => setCreatingAppt((f) => f && { ...f, description: v })}
                >
                  <Label>Description</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setCreatingAppt(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleCreateAppt}>
                  {saving ? "Saving…" : "Create Appointment"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* New house call */}
      <Modal>
        <Modal.Backdrop isOpen={!!creatingCall} onOpenChange={(open) => !open && setCreatingCall(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New House Call</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={creatingCall?.description || ""}
                  onChange={(v) => setCreatingCall((f) => f && { ...f, description: v })}
                >
                  <Label>Description</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="Screen repair at customer's home" />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={creatingCall?.address || ""}
                  onChange={(v) => setCreatingCall((f) => f && { ...f, address: v })}
                >
                  <Label>Address</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Date</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    type="date"
                    value={creatingCall?.date || ""}
                    onChange={(e) => setCreatingCall((f) => f && { ...f, date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Time</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    type="time"
                    value={creatingCall?.time || ""}
                    onChange={(e) => setCreatingCall((f) => f && { ...f, time: e.target.value })}
                  />
                </div>
                {customerPicker(creatingCall?.customerId || "", (v) => setCreatingCall((f) => f && { ...f, customerId: v }))}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setCreatingCall(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleCreateCall}>
                  {saving ? "Saving…" : "Create House Call"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function DayPanel({
  selectedDate,
  events,
  loading,
  onStatus,
  onReschedule,
  onDelete,
  onNavigate,
}: {
  selectedDate: string;
  events: CalEvent[];
  loading: boolean;
  onStatus: (event: CalEvent, status: string) => void;
  onReschedule: (event: CalEvent, date: string, time: string) => void;
  onDelete: (event: CalEvent) => void;
  onNavigate: (path: string) => void;
}) {
  const label = parseDateOnly(selectedDate)?.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-[28px] border border-border bg-surface p-5">
      <h3 className="m-0 mb-1 text-sm font-black text-foreground">{label}</h3>
      <p className="m-0 mb-4 text-xs text-muted">
        {events.length} {events.length === 1 ? "entry" : "entries"}
      </p>

      {events.length === 0 ? (
        <p className="m-0 text-sm text-muted">{loading ? "Loading…" : "Nothing scheduled for this day."}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => {
            const Icon = KIND_META[e.kind].icon;
            const editable = e.appointment || e.houseCall;
            const statuses = e.appointment ? APPT_STATUSES : CALL_STATUSES;

            return (
              <div key={e.key} className="rounded-2xl border border-border p-3">
                <div className="mb-2 flex items-start gap-2">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${KIND_META[e.kind].chip}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-foreground">{e.title}</strong>
                    <span className="block truncate text-xs text-muted">
                      {e.time ? `${formatTime(e.time)} · ` : ""}
                      {e.subtitle || KIND_META[e.kind].label}
                    </span>
                  </div>
                  {editable && (
                    <Button
                      isIconOnly
                      aria-label="Delete"
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        if (window.confirm(`Delete "${e.title}"? This can't be undone.`)) onDelete(e);
                      }}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  )}
                </div>

                {editable ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        aria-label="Reschedule date"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        type="date"
                        value={e.date}
                        onChange={(ev) => ev.target.value && onReschedule(e, ev.target.value, e.time)}
                      />
                      <input
                        aria-label="Reschedule time"
                        className="w-[110px] shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        type="time"
                        value={to24h(e.time) ?? ""}
                        onChange={(ev) => onReschedule(e, e.date, ev.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Status"
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                      value={e.status || "scheduled"}
                      onChange={(ev) => onStatus(e, ev.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {cap(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">{e.status ? cap(e.status) : ""}</span>
                    {e.refPath && (
                      <Button size="sm" variant="outline" onPress={() => onNavigate(e.refPath!)}>
                        <MapPin className="size-3.5" />
                        <span>Open</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

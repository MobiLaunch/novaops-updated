import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "@heroui/react";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Home,
  Mail,
  MessageCircle,
  Package,
  Ticket as TicketIcon,
  TriangleAlert,
  Users,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import type { Appointment, BookingRecord, Customer, HouseCall, Message, Ticket } from "@/types/domain";
import {
  sbFetchAppointments,
  sbFetchBookings,
  sbFetchCustomerMessages,
  sbFetchCustomers,
  sbFetchHouseCalls,
  sbFetchInventory,
  sbFetchMessages,
  sbFetchTickets,
} from "@/lib/supabase";
import { formatCurrency, timeAgo } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-accent-soft text-accent",
  "In Progress": "bg-warning/15 text-warning",
  "Waiting for Parts": "bg-warning/15 text-warning",
  Completed: "bg-success/15 text-success",
  Delivered: "bg-success/15 text-success",
};

interface ScheduleEntry {
  key: string;
  kind: "appointment" | "house_call" | "booking";
  title: string;
  date: string;
  time: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [houseCalls, setHouseCalls] = useState<HouseCall[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    sbFetchTickets().then(({ data }) => data && setTickets(data));
    sbFetchCustomers().then(({ data }) => data && setCustomers(data));
    sbFetchInventory().then(({ data }) => {
      if (!data) return;
      setInventoryCount(data.length);
      setLowStockCount(data.filter((i) => i.stock <= i.low).length);
    });
    sbFetchBookings().then(({ data }) => data && setBookings(data));
    sbFetchAppointments().then(({ data }) => data && setAppointments(data));
    sbFetchHouseCalls().then(({ data }) => data && setHouseCalls(data));
    sbFetchMessages().then(({ data }) => data && setMessages(data));
    sbFetchCustomerMessages().then(({ data }) => data && setUnreadChats(data.filter((m) => m.direction === "inbound" && !m.read).length));
  }, []);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const openTickets = tickets.filter((t) => t.status !== "Completed" && t.status !== "Delivered");
  const activeValue = openTickets.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const unreadMail = messages.filter((m) => m.direction === "inbound" && !m.read).length;

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 6),
    [tickets],
  );

  const upcomingSchedule = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const entries: ScheduleEntry[] = [
      ...appointments.map((a) => ({ key: `apt-${a.id}`, kind: "appointment" as const, title: a.title || "Appointment", date: a.date || "", time: a.time || "" })),
      ...houseCalls.map((h) => ({ key: `hc-${h.id}`, kind: "house_call" as const, title: h.description || "House call", date: h.date || "", time: h.time || "" })),
      ...pendingBookings.map((b) => ({
        key: `bk-${b.id}`,
        kind: "booking" as const,
        title: `${b.customer_name} — ${b.service || b.device_type}`,
        date: b.appt_date || "",
        time: b.appt_time || "",
      })),
    ];

    return entries
      .filter((e) => e.date && new Date(e.date) >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 6);
  }, [appointments, houseCalls, pendingBookings]);

  return (
    <div>
      <PageHeader
        description="Live overview of tickets, customers, inventory, and website bookings."
        eyebrow="Repair Shop"
        title="Dashboard"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TicketIcon} path="/tickets">
          <strong className="text-2xl font-extrabold text-foreground">{openTickets.length}</strong>
          <span className="mt-1 block text-sm text-muted">Open tickets</span>
          {activeValue > 0 && <span className="mt-1 block text-xs font-semibold text-accent">{formatCurrency(activeValue)} in progress</span>}
        </StatCard>
        <StatCard icon={Users} path="/customers">
          <strong className="text-2xl font-extrabold text-foreground">{customers.length}</strong>
          <span className="mt-1 block text-sm text-muted">Customers</span>
          {unreadChats > 0 && (
            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
              <MessageCircle className="size-3" />
              {unreadChats} unread chat{unreadChats !== 1 ? "s" : ""}
            </span>
          )}
        </StatCard>
        <StatCard icon={Package} path="/inventory">
          <strong className="text-2xl font-extrabold text-foreground">{lowStockCount}</strong>
          <span className="mt-1 flex items-center gap-1 text-sm text-muted">
            {lowStockCount > 0 && <TriangleAlert className="size-3.5 text-warning" />}
            Low stock items
          </span>
          <span className="mt-1 block text-xs text-muted">{inventoryCount} total SKUs</span>
        </StatCard>
        <StatCard icon={CalendarDays} path="/bookings">
          <strong className="text-2xl font-extrabold text-foreground">{pendingBookings.length}</strong>
          <span className="mt-1 block text-sm text-muted">Pending bookings</span>
          {unreadMail > 0 && (
            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
              <Mail className="size-3" />
              {unreadMail} unread email{unreadMail !== 1 ? "s" : ""}
            </span>
          )}
        </StatCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[22px] border border-border bg-surface p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-muted">Recent Tickets</h3>
            <button
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              type="button"
              onClick={() => navigate("/tickets")}
            >
              View all
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {recentTickets.length === 0 ? (
            <p className="m-0 text-sm text-muted">No tickets yet — create one from the Tickets page.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTickets.map((t) => {
                const customer = t.customer_id ? customerById.get(t.customer_id) : null;

                return (
                  <button
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/40 p-3 text-left text-sm transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
                    type="button"
                    onClick={() => navigate(`/tickets?open=${t.id}`)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <TicketIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-foreground">
                          {t.device} {t.device_model}
                        </strong>
                        <span className="block truncate text-xs text-muted">
                          {customer?.name || "Walk-in"} · {t.issue}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pl-3">
                      <Chip className={STATUS_STYLES[t.status] || "bg-surface-secondary text-muted"} size="sm" variant="soft">
                        <Chip.Label>{t.status}</Chip.Label>
                      </Chip>
                      <span className="text-xs text-muted">{timeAgo(t.updated_at || t.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-muted">Upcoming Schedule</h3>
            <button
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              type="button"
              onClick={() => navigate("/calendar")}
            >
              Calendar
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {upcomingSchedule.length === 0 ? (
            <p className="m-0 text-sm text-muted">Nothing scheduled yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingSchedule.map((entry) => {
                const Icon = entry.kind === "house_call" ? Home : entry.kind === "booking" ? CalendarDays : CalendarClock;

                return (
                  <div key={entry.key} className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3 text-sm">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-foreground">{entry.title}</strong>
                      <span className="block text-xs text-muted">
                        {entry.date} {entry.time && `· ${entry.time}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

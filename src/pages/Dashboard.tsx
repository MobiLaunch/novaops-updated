import { useEffect, useState } from "react";
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
import type { DashboardSummary } from "@/lib/supabase";
import { sbFetchDashboard } from "@/lib/supabase";
import { formatCurrency, parseDateOnly, timeAgo, to24h, useRefetchOnFocus } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-accent-soft text-accent",
  "In Progress": "bg-warning/15 text-warning",
  "Waiting for Parts": "bg-warning/15 text-warning",
  Completed: "bg-success/15 text-success",
  Delivered: "bg-success/15 text-success",
};

// Schedule rows hold free text, so a legacy "2:00 PM" is shown as-is and a
// 24h value from a time input is prettified to match it.
function formatTime(value: string): string {
  const normalised = to24h(value);

  if (!normalised) return value.trim();
  const hours = Number(normalised.slice(0, 2));

  return `${((hours + 11) % 12) + 1}:${normalised.slice(3)} ${hours >= 12 ? "PM" : "AM"}`;
}

const EMPTY: DashboardSummary = {
  openTickets: 0,
  activeValue: 0,
  customers: 0,
  inventoryCount: 0,
  lowStock: 0,
  pendingBookings: 0,
  unreadMail: 0,
  unreadChats: 0,
  recentTickets: [],
  schedule: [],
};

// Placeholder rows while the first load is in flight, so the panels keep
// their height instead of the whole page snapping taller when data lands.
function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[58px] animate-pulse rounded-xl border border-border bg-surface-secondary/40" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = () => {
    sbFetchDashboard().then((next) => {
      setData(next);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  // Front desk and bench run this side by side — pick the tab back up and
  // it refreshes instead of showing whatever was there when you left.
  useRefetchOnFocus(load);

  const { openTickets, activeValue, customers, inventoryCount, lowStock, pendingBookings, unreadMail, unreadChats, recentTickets, schedule } =
    data;

  return (
    <div>
      <PageHeader
        description="Live overview of tickets, customers, inventory, and website bookings."
        eyebrow="Repair Shop"
        title="Dashboard"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TicketIcon} path="/tickets">
          <strong className="text-2xl font-extrabold text-foreground">{openTickets}</strong>
          <span className="mt-1 block text-sm text-muted">Open tickets</span>
          {activeValue > 0 && <span className="mt-1 block text-xs font-semibold text-accent">{formatCurrency(activeValue)} in progress</span>}
        </StatCard>
        <StatCard icon={Users} path="/customers">
          <strong className="text-2xl font-extrabold text-foreground">{customers}</strong>
          <span className="mt-1 block text-sm text-muted">Customers</span>
          {unreadChats > 0 && (
            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
              <MessageCircle className="size-3" />
              {unreadChats} unread chat{unreadChats !== 1 ? "s" : ""}
            </span>
          )}
        </StatCard>
        <StatCard icon={Package} path="/inventory">
          <strong className="text-2xl font-extrabold text-foreground">{lowStock}</strong>
          <span className="mt-1 flex items-center gap-1 text-sm text-muted">
            {lowStock > 0 && <TriangleAlert className="size-3.5 text-warning" />}
            Low stock items
          </span>
          <span className="mt-1 block text-xs text-muted">{inventoryCount} total SKUs</span>
        </StatCard>
        <StatCard icon={CalendarDays} path="/bookings">
          <strong className="text-2xl font-extrabold text-foreground">{pendingBookings}</strong>
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

          {loading ? (
            <SkeletonRows count={4} />
          ) : recentTickets.length === 0 ? (
            <p className="m-0 text-sm text-muted">No tickets yet — create one from the Tickets page.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTickets.map((t) => {
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
                          {t.customer_name || "Walk-in"} · {t.issue}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pl-3">
                      <Chip className={STATUS_STYLES[t.status] || "bg-surface-secondary text-muted"} size="sm" variant="soft">
                        <Chip.Label>{t.status}</Chip.Label>
                      </Chip>
                      <span className="text-xs text-muted">{timeAgo(t.updated_at)}</span>
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

          {loading ? (
            <SkeletonRows count={3} />
          ) : schedule.length === 0 ? (
            <p className="m-0 text-sm text-muted">Nothing scheduled yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {schedule.map((entry) => {
                const Icon = entry.kind === "house_call" ? Home : entry.kind === "booking" ? CalendarDays : CalendarClock;

                return (
                  <div key={entry.key} className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3 text-sm">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-foreground">{entry.title}</strong>
                      <span className="block text-xs text-muted">
                        {parseDateOnly(entry.date)?.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) ||
                          entry.date}
                        {entry.time && ` · ${formatTime(entry.time)}`}
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

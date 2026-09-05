import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListBox, Modal, Select } from "@heroui/react";
import { CalendarDays, CalendarX, CloudOff, ExternalLink, Home, RefreshCw, Store, Wrench } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { BookingRecord } from "@/types/domain";
import {
  isSupabaseConfigured,
  sbConvertBookingToTicket,
  sbFetchBookings,
  sbUpdateBookingStatus,
} from "@/lib/supabase";
import { toastWriteFailed } from "@/lib/toast";

// Reads the same `bookings` table the Mobicare website's booking widget
// writes to (via its /api/create-booking function) — this is the "connect
// the two" surface: a customer books online, it shows up here immediately,
// and "Convert to Ticket" turns it into a NovaOps repair ticket.

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "no-show"] as const;
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-accent-soft text-accent",
  completed: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  "no-show": "bg-danger/15 text-danger",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<BookingRecord | null>(null);
  const [converting, setConverting] = useState(false);

  const load = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const { data, error } = await sbFetchBookings();

    setLoading(false);
    setLoadError(error);
    if (data) setBookings(data);
  };

  useEffect(() => {
    load();
  }, []);

  // Bookings live in the website's table behind its own RLS, so a rejected
  // write here is most likely a permissions problem — commit only once it
  // lands, rather than showing a change the website never accepted.
  const handleStatusChange = async (id: string | number, status: string) => {
    if (!(await sbUpdateBookingStatus(id, status))) {
      toastWriteFailed("this booking");

      return;
    }
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    if (selected?.id === id) setSelected((s) => s && { ...s, status });
  };

  const handleConvert = async () => {
    if (!selected) return;
    setConverting(true);
    const { ticket, error } = await sbConvertBookingToTicket(selected);

    setConverting(false);
    if (ticket) {
      setBookings((bs) =>
        bs.map((b) => (b.id === selected.id ? { ...b, novaops_ticket_id: ticket.id, status: "confirmed" } : b)),
      );
      setSelected((s) => s && { ...s, novaops_ticket_id: ticket.id, status: "confirmed" });
    } else if (error) {
      setLoadError(error);
    }
  };

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  const columns: DataTableColumn<BookingRecord>[] = [
    {
      key: "schedule",
      header: "Schedule",
      render: (b) => (
        <div>
          <strong className="block text-sm text-accent">{b.appt_date}</strong>
          <span className="text-xs text-muted">{b.appt_time}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (b) => (
        <div>
          <strong className="block text-sm text-foreground">{b.customer_name}</strong>
          <span className="text-xs text-muted">{b.customer_phone || b.customer_email || "No contact"}</span>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (b) => (
        <div className="flex items-center gap-1.5">
          <Wrench className="size-4 text-accent" />
          <strong className="text-label capitalize">{b.service?.replace(/-/g, " ") || "Repair"}</strong>
        </div>
      ),
    },
    {
      key: "visit",
      header: "Visit",
      render: (b) =>
        b.visit_type === "home" ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <Home className="size-3.5 text-accent" />
            Home
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <Store className="size-3.5 text-accent" />
            Store
          </span>
        ),
    },
    {
      key: "ticket",
      header: "Ticket",
      render: (b) =>
        b.novaops_ticket_id ? (
          <Chip color="success" size="sm" variant="soft">
            <Chip.Label>#{b.novaops_ticket_id}</Chip.Label>
          </Chip>
        ) : (
          <span className="text-xs text-muted">Not created</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Select
          className={`w-[132px] rounded-full text-xs font-bold ${STATUS_STYLES[b.status] || "bg-surface-tertiary"}`}
          selectedKey={STATUS_OPTIONS.includes(b.status as (typeof STATUS_OPTIONS)[number]) ? b.status : "pending"}
          onSelectionChange={(key) => handleStatusChange(b.id, String(key))}
        >
          <Select.Trigger className="rounded-full border-0">
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUS_OPTIONS.map((s) => (
                <ListBox.Item key={s} id={s}>
                  {cap(s)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (b) => (
        <Button size="sm" variant="ghost" onPress={() => setSelected(b)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        description={`${bookings.length} appointment${bookings.length !== 1 ? "s" : ""} booked from the website`}
        eyebrow="Website Bookings"
        title="Bookings"
        action={
          <Button isDisabled={loading} variant="outline" onPress={load}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", ...STATUS_OPTIONS] as const).map((status) => (
          <button
            key={status}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              statusFilter === status
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface text-muted hover:bg-surface-secondary"
            }`}
            type="button"
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : cap(status)}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured() ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
            <CloudOff className="size-8" />
          </span>
          <h4 className="m-0 text-lg font-bold text-foreground">Supabase Not Connected</h4>
          <p className="m-0 max-w-[440px] text-sm text-muted">
            Connect Supabase credentials in Settings to see live appointments booked from your website.
          </p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border border-danger/30 bg-danger/5 p-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-danger/15 text-danger">
            <CloudOff className="size-8" />
          </span>
          <h4 className="m-0 text-lg font-bold text-foreground">Couldn&rsquo;t Load Bookings</h4>
          <p className="m-0 max-w-[440px] text-sm text-muted">
            This is usually a Row Level Security issue — this account must be added to the website&rsquo;s
            <code className="mx-1 rounded bg-surface-tertiary px-1.5 py-0.5">staff_users</code>
            table before it can read bookings. See the README for setup.
          </p>
          <code className="max-w-full overflow-x-auto rounded-xl bg-surface-tertiary px-3 py-2 text-xs text-danger">
            {loadError}
          </code>
          <Button variant="outline" onPress={load}>
            <RefreshCw className="size-4" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : (
        <DataTable
          ariaLabel="Bookings"
          columns={columns}
          data={filtered}
          emptyState={{
            icon: CalendarX,
            title: "No bookings found",
            description:
              statusFilter === "all"
                ? "Appointments booked on your website will appear here automatically."
                : `No bookings currently marked "${statusFilter}".`,
          }}
          rowKey={(b) => String(b.id)}
        />
      )}

      <Modal>
        <Modal.Backdrop isOpen={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              {selected && (
                <>
                  <Modal.Header>
                    <div>
                      <Chip className="mb-1.5" color="accent" size="sm" variant="soft">
                        <Chip.Label>Website Booking</Chip.Label>
                      </Chip>
                      <Modal.Heading>{selected.customer_name}</Modal.Heading>
                    </div>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-secondary/60 p-4 text-sm">
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Appointment</span>
                        <strong>{selected.appt_date}</strong>
                        <span className="ml-1 text-xs text-muted">{selected.appt_time}</span>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Service</span>
                        <strong className="capitalize">{selected.service?.replace(/-/g, " ")}</strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Device</span>
                        <strong>
                          {selected.device_type} {selected.device_model}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Contact</span>
                        <strong>{selected.customer_phone || selected.customer_email || "—"}</strong>
                      </div>
                      {selected.issue && (
                        <div className="col-span-2">
                          <span className="block text-micro font-bold uppercase text-muted">Issue</span>
                          <p className="m-0">{selected.issue}</p>
                        </div>
                      )}
                    </div>

                    {selected.novaops_ticket_id ? (
                      <div className="flex items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success/10 p-3 text-sm text-success">
                        <span className="flex items-center gap-2">
                          <ExternalLink className="size-4" />
                          Converted to ticket #{selected.novaops_ticket_id}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => navigate(`/tickets?open=${selected.novaops_ticket_id}`)}
                        >
                          View Ticket
                        </Button>
                      </div>
                    ) : (
                      <Button isDisabled={converting} variant="primary" onPress={handleConvert}>
                        <CalendarDays className="size-4" />
                        <span>{converting ? "Creating ticket…" : "Convert to Ticket"}</span>
                      </Button>
                    )}
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

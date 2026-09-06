import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Chip,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  CheckCheck,
  ClipboardList,
  CreditCard,
  Eye,
  Link as LinkIcon,
  Mail,
  Phone,
  Plus,
  Printer,
  Search,
  Ticket as TicketIcon,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import PaymentModal from "@/components/payments/PaymentModal";
import SignaturePad from "@/components/SignaturePad";
import type { Customer, InventoryItem, ShopSettings, Technician, Ticket, TicketPayment, TicketStatus } from "@/types/domain";
import {
  getCurrentProfileId,
  sbAssignPartToTicket,
  sbCreateMessage,
  sbCreateTicket,
  sbFetchCustomers,
  sbFetchInventory,
  sbFetchShopSettings,
  sbFetchTechnicians,
  sbFetchTickets,
  sbFindOrCreateCustomer,
  sbRemovePartFromTicket,
  sbUpdateTicket,
} from "@/lib/supabase";
import { printBarcodeLabel } from "@/lib/print";
import { toastWriteFailed } from "@/lib/toast";
import { asArray, parseDateOnly, startOfToday, ticketBalanceDue, useDebounced, useRefetchOnFocus } from "@/lib/utils";

const STATUSES: TicketStatus[] = ["Open", "In Progress", "Waiting for Parts", "Completed", "Delivered"];
const STATUS_STYLES: Record<string, string> = {
  Open: "bg-accent-soft text-accent",
  "In Progress": "bg-warning/15 text-warning",
  "Waiting for Parts": "bg-warning/15 text-warning",
  Completed: "bg-success/15 text-success",
  Delivered: "bg-success/15 text-success",
};

interface NewTicketForm {
  customerName: string;
  customerPhone: string;
  device: string;
  deviceModel: string;
  issue: string;
  price: string;
}

const emptyNewForm: NewTicketForm = { customerName: "", customerPhone: "", device: "", deviceModel: "", issue: "", price: "0" };

// A ticket's core details used to be frozen at creation, so a quote that
// changed once the device was opened up couldn't be corrected. These save on
// blur (or Enter) to match how due date, technician, and labels already
// behave in this modal, rather than adding a second nested edit dialog.
function InlineField({
  label,
  value,
  type = "text",
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  type?: "text" | "number";
  multiline?: boolean;
  onSave: (next: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-sync when the row comes back from the server, or when a different
  // ticket is opened into the same modal.
  useEffect(() => setDraft(value), [value]);

  const commit = async () => {
    if (busy || draft === value) return;
    setBusy(true);
    const ok = await onSave(draft);

    setBusy(false);
    if (!ok) {
      setDraft(value); // the failure already surfaced as a toast

      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent disabled:opacity-60";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-micro font-bold uppercase text-muted">
        {label}
        {saved && <span className="font-bold text-success">Saved</span>}
      </span>
      {multiline ? (
        <textarea
          className={`${inputClass} min-h-[62px] resize-y`}
          disabled={busy}
          value={draft}
          onBlur={commit}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          disabled={busy}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
          type={type}
          value={draft}
          onBlur={commit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setDraft(value);
          }}
        />
      )}
    </div>
  );
}

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState<NewTicketForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [payingTicket, setPayingTicket] = useState<Ticket | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [partSelection, setPartSelection] = useState<{ inventoryId: string; qty: string }>({ inventoryId: "", qty: "1" });
  const [linkCopied, setLinkCopied] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [labelDraft, setLabelDraft] = useState("");

  const handleCopyTrackLink = async (ticket: Ticket) => {
    const url = `${window.location.origin}/track/${ticket.public_token}`;

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt("Copy this tracking link:", url);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchTickets();

    setLoading(false);
    if (data) setTickets(data);
  };

  useEffect(() => {
    load();
    sbFetchInventory().then(({ data }) => data && setInventory(data));
    sbFetchCustomers().then(({ data }) => data && setCustomers(data));
    sbFetchShopSettings().then(({ data }) => data && setShopSettings(data));
    sbFetchTechnicians().then(({ data }) => data && setTechnicians(data));
  }, []);

  // Front desk and bench run this side by side — pick the tab back up and
  // it refreshes instead of showing whatever was there when you left.
  useRefetchOnFocus(load);

  useEffect(() => {
    const openId = searchParams.get("open");

    if (openId && tickets.length > 0) {
      const match = tickets.find((t) => String(t.id) === openId);

      if (match) setSelected(match);
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [tickets, searchParams, setSearchParams]);

  // ?new=<customerId> — "New Ticket" from a customer's record, so their
  // details don't have to be retyped (and can't be typo'd into a duplicate).
  useEffect(() => {
    const newFor = searchParams.get("new");

    if (!newFor || customers.length === 0) return;
    const customer = customers.find((c) => String(c.id) === newFor);

    if (customer) {
      setCreating({ ...emptyNewForm, customerName: customer.name, customerPhone: customer.phone });
    }
    searchParams.delete("new");
    setSearchParams(searchParams, { replace: true });
  }, [customers, searchParams, setSearchParams]);

  const handleCreate = async () => {
    if (!creating?.device.trim() || !creating.issue.trim()) return;
    setSaving(true);
    const { data: customer } = await sbFindOrCreateCustomer({
      name: creating.customerName || "Walk-in",
      phone: creating.customerPhone,
    });
    const { data: ticket } = await sbCreateTicket({
      customer_id: customer?.id ?? null,
      device: creating.device,
      device_model: creating.deviceModel,
      issue: creating.issue,
      price: Number(creating.price) || 0,
      status: "Open",
      priority: "normal",
    });

    setSaving(false);
    if (ticket) {
      setTickets((ts) => [ticket, ...ts]);
      setCreating(null);
    }
  };

  // Status drives a customer-facing email, so the write lands before
  // anything else moves: no optimistic flash to undo, and no way to notify
  // a customer about a change the database rejected.
  const handleStatusChange = async (id: number, status: string) => {
    const ticket = tickets.find((t) => t.id === id);
    const { error } = await sbUpdateTicket(id, { status });

    if (error) {
      toastWriteFailed(`ticket #${id}`, error);

      return;
    }

    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selected?.id === id) setSelected((s) => s && { ...s, status });

    if (ticket && shopSettings?.notify_on_status_change) {
      await notifyCustomerOfStatusChange(ticket, status);
    }
  };

  // Best-effort — a failed notification should never block the status
  // change itself, so errors here are swallowed rather than surfaced.
  const notifyCustomerOfStatusChange = async (ticket: Ticket, status: string) => {
    const customer = customers.find((c) => c.id === ticket.customer_id);

    if (!customer?.email) return;

    const trackUrl = `${window.location.origin}/track/${ticket.public_token}`;
    const subject = `Update on your repair — ${ticket.device} ${ticket.device_model}`.trim();
    const body = `Hi ${customer.name.split(" ")[0] || "there"},\n\nYour repair status has been updated to: ${status}.\n\nTrack your repair anytime: ${trackUrl}\n\nThanks,\nThe repair team`;

    try {
      const profileId = await getCurrentProfileId();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: customer.email, subject, body, profileId }),
      });
      const data = await res.json();

      await sbCreateMessage({
        customer_id: customer.id,
        customer_email: customer.email,
        customer_name: customer.name,
        channel: "email",
        direction: "outbound",
        subject,
        body,
        ticket_id: ticket.id,
        read: true,
        delivered: !!data.delivered,
      });
    } catch {
      // Notification failure shouldn't interrupt the shop's workflow.
    }
  };

  const applyTicketPatch = async (id: number, patch: Partial<Ticket>): Promise<boolean> => {
    const { data, error } = await sbUpdateTicket(id, patch);

    if (!data) {
      toastWriteFailed(`ticket #${id}`, error);

      return false;
    }

    setTickets((ts) => ts.map((t) => (t.id === id ? data : t)));
    if (selected?.id === id) setSelected(data);

    return true;
  };

  const handleDueDateChange = (id: number, dueDate: string) => applyTicketPatch(id, { due_date: dueDate || null });

  const handleAssignedToChange = (id: number, technicianId: string) =>
    applyTicketPatch(id, { assigned_to: technicianId ? Number(technicianId) : null });

  const handleAddLabel = (ticket: Ticket) => {
    const label = labelDraft.trim();

    if (!label || ticket.labels.includes(label)) return;
    applyTicketPatch(ticket.id, { labels: [...ticket.labels, label] });
    setLabelDraft("");
  };

  const handleRemoveLabel = (ticket: Ticket, label: string) => {
    applyTicketPatch(ticket.id, { labels: ticket.labels.filter((l) => l !== label) });
  };

  const handlePaid = async (payment: TicketPayment): Promise<boolean> => {
    if (!payingTicket) return false;
    const payments = [...(payingTicket.payments || []), payment];
    const { data } = await sbUpdateTicket(payingTicket.id, { payments });

    if (data) {
      setTickets((ts) => ts.map((t) => (t.id === data.id ? data : t)));
      if (selected?.id === data.id) setSelected(data);
      setPayingTicket(null);

      return true;
    }

    return false;
  };

  const handleSaveSignature = async (dataUrl: string) => {
    if (!selected) return;
    const { data } = await sbUpdateTicket(selected.id, { signature: dataUrl });

    if (data) {
      setSelected(data);
      setTickets((ts) => ts.map((t) => (t.id === data.id ? data : t)));
    }
  };

  const handleAddPart = async () => {
    if (!selected || !partSelection.inventoryId) return;
    const item = inventory.find((i) => String(i.id) === partSelection.inventoryId);
    const qty = Number(partSelection.qty) || 1;

    if (!item) return;
    const { data } = await sbAssignPartToTicket(selected, item, qty);

    if (data) {
      setSelected(data);
      setTickets((ts) => ts.map((t) => (t.id === data.id ? data : t)));
      setInventory((rows) => rows.map((r) => (r.id === item.id ? { ...r, stock: Math.max(r.stock - qty, 0) } : r)));
      setPartSelection({ inventoryId: "", qty: "1" });
    }
  };

  const handleRemovePart = async (index: number) => {
    if (!selected) return;
    const removed = asArray<Ticket["parts"][number]>(selected.parts)[index];
    const { data } = await sbRemovePartFromTicket(selected, index);

    if (data) {
      setSelected(data);
      setTickets((ts) => ts.map((t) => (t.id === data.id ? data : t)));
      if (removed?.inventory_id) {
        setInventory((rows) => rows.map((r) => (r.id === removed.inventory_id ? { ...r, stock: r.stock + removed.qty } : r)));
      }
    }
  };

  const handleAddNote = async () => {
    if (!selected || !noteDraft.trim()) return;
    const notes = [...asArray<Ticket["notes"][number]>(selected.notes), { text: noteDraft.trim(), at: new Date().toISOString() }];
    const { data } = await sbUpdateTicket(selected.id, { notes });

    if (data) {
      setSelected(data);
      setTickets((ts) => ts.map((t) => (t.id === data.id ? data : t)));
      setNoteDraft("");
    }
  };

  // Re-filtering rebuilds the table's whole row collection, so that runs once
  // typing pauses rather than on every keystroke.
  const debouncedQuery = useDebounced(query);
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      const customerName = t.customer_id ? customerById.get(t.customer_id)?.name || "" : "";
      const haystack = `${t.id} ${t.device} ${t.device_model} ${t.issue} ${customerName} ${asArray<string>(t.labels).join(" ")}`;

      return haystack.toLowerCase().includes(q);
    });
  }, [tickets, statusFilter, debouncedQuery, customerById]);

  const selectedCustomer = selected?.customer_id ? customerById.get(selected.customer_id) : undefined;

  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "device",
      header: "Device",
      render: (t) => (
        <div>
          <strong className="block text-sm text-foreground">{t.device}</strong>
          <span className="text-xs text-muted">{t.device_model}</span>
        </div>
      ),
    },
    { key: "issue", header: "Issue", render: (t) => <span className="text-sm">{t.issue}</span> },
    { key: "price", header: "Price", render: (t) => <span className="text-sm font-semibold">${Number(t.price).toFixed(2)}</span> },
    {
      key: "technician",
      header: "Technician",
      render: (t) => {
        const tech = technicians.find((x) => x.id === t.assigned_to);

        return tech ? (
          <span className="flex items-center gap-1.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tech.color }} />
            {tech.name}
          </span>
        ) : (
          <span className="text-sm text-muted">Unassigned</span>
        );
      },
    },
    {
      key: "due",
      header: "Due",
      render: (t) => {
        const due = parseDateOnly(t.due_date);

        if (!due) return <span className="text-sm text-muted">—</span>;
        const overdue = due < startOfToday() && t.status !== "Completed" && t.status !== "Delivered";

        return <span className={`text-sm ${overdue ? "font-semibold text-danger" : "text-foreground"}`}>{t.due_date}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Select
          className={`w-[168px] rounded-full text-xs font-bold ${STATUS_STYLES[t.status] || "bg-surface-tertiary"}`}
          selectedKey={t.status}
          onSelectionChange={(key) => handleStatusChange(t.id, String(key))}
        >
          <Select.Trigger className="rounded-full border-0">
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUSES.map((s) => (
                <ListBox.Item key={s} id={s}>
                  {s}
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
      render: (t) => (
        <div className="flex justify-end gap-1">
          {ticketBalanceDue(t) > 0 && (
            <Button isIconOnly aria-label="Take payment" variant="ghost" onPress={() => setPayingTicket(t)}>
              <CreditCard className="size-4" />
            </Button>
          )}
          <Button isIconOnly aria-label="View ticket" variant="ghost" onPress={() => setSelected(t)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        action={
          <Button variant="primary" onPress={() => setCreating(emptyNewForm)}>
            <Plus className="size-4" />
            <span>New Ticket</span>
          </Button>
        }
        description={`${tickets.length} total ticket${tickets.length !== 1 ? "s" : ""}`}
        eyebrow="Repair Tickets"
        title="Tickets"
      />

      <div className="relative mb-3 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
          placeholder="Search device, issue, customer, label, or #id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((status) => (
          <button
            key={status}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              statusFilter === status ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:bg-surface-secondary"
            }`}
            type="button"
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <DataTable
        ariaLabel="Tickets"
        columns={columns}
        data={filtered}
        emptyState={{
          icon: loading ? TicketIcon : ClipboardList,
          title: loading ? "Loading tickets…" : debouncedQuery ? "No matches" : "No tickets found",
          description: debouncedQuery
            ? `No tickets match "${debouncedQuery}"${statusFilter === "all" ? "" : ` in "${statusFilter}"`}.`
            : statusFilter === "all"
              ? "New tickets will appear here."
              : `No tickets currently marked "${statusFilter}".`,
        }}
        rowKey={(t) => String(t.id)}
      />

      {/* New ticket modal */}
      <Modal>
        <Modal.Backdrop isOpen={!!creating} onOpenChange={(open) => !open && setCreating(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New Ticket</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  className="flex flex-col gap-1.5"
                  value={creating?.customerName || ""}
                  onChange={(v) => setCreating((f) => f && { ...f, customerName: v })}
                >
                  <Label>Customer Name</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={creating?.customerPhone || ""}
                  onChange={(v) => setCreating((f) => f && { ...f, customerPhone: v })}
                >
                  <Label>Customer Phone</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5"
                  value={creating?.device || ""}
                  onChange={(v) => setCreating((f) => f && { ...f, device: v })}
                >
                  <Label>Device</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={creating?.deviceModel || ""}
                  onChange={(v) => setCreating((f) => f && { ...f, deviceModel: v })}
                >
                  <Label>Model</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={creating?.issue || ""}
                  onChange={(v) => setCreating((f) => f && { ...f, issue: v })}
                >
                  <Label>Issue</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  type="number"
                  value={creating?.price || "0"}
                  onChange={(v) => setCreating((f) => f && { ...f, price: v })}
                >
                  <Label>Price</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setCreating(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleCreate}>
                  {saving ? "Creating…" : "Create Ticket"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Ticket detail modal */}
      <Modal>
        <Modal.Backdrop isOpen={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <Modal.Container scroll="inside" size="lg">
            <Modal.Dialog>
              {selected && (
                <>
                  <Modal.Header>
                    <div>
                      <Chip className="mb-1.5" color="accent" size="sm" variant="soft">
                        <Chip.Label>Ticket #{selected.id}</Chip.Label>
                      </Chip>
                      <Modal.Heading>{selected.device}</Modal.Heading>
                    </div>
                    <Button variant="outline" onPress={() => handleCopyTrackLink(selected)}>
                      {linkCopied ? <CheckCheck className="size-4 text-success" /> : <LinkIcon className="size-4" />}
                      <span>{linkCopied ? "Copied!" : "Track Repair Link"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onPress={() =>
                        printBarcodeLabel({ value: String(selected.id), name: `${selected.device} ${selected.device_model}`.trim(), format: "CODE128" })
                      }
                    >
                      <Printer className="size-4" />
                      <span>Print Tag</span>
                    </Button>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4">
                    {/* Whose device this is — previously the detail view never
                        said, so you couldn't tell without leaving the page. */}
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-secondary/60 p-4 text-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <UserRound className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-foreground">{selectedCustomer?.name || "Walk-in"}</strong>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                          {selectedCustomer?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {selectedCustomer.phone}
                            </span>
                          )}
                          {selectedCustomer?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" />
                              {selectedCustomer.email}
                            </span>
                          )}
                          {!selectedCustomer && "No customer record linked"}
                        </span>
                      </div>
                      {selectedCustomer && (
                        <Button size="sm" variant="outline" onPress={() => navigate(`/customers?open=${selectedCustomer.id}`)}>
                          View Customer
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2">
                      <InlineField
                        label="Device"
                        value={selected.device}
                        onSave={(v) => applyTicketPatch(selected.id, { device: v.trim() })}
                      />
                      <InlineField
                        label="Model"
                        value={selected.device_model}
                        onSave={(v) => applyTicketPatch(selected.id, { device_model: v.trim() })}
                      />
                      <InlineField
                        label="Price"
                        type="number"
                        value={String(selected.price ?? 0)}
                        onSave={(v) => applyTicketPatch(selected.id, { price: Number(v) || 0 })}
                      />
                      <div className="hidden sm:block" />
                      <div className="sm:col-span-2">
                        <InlineField
                          multiline
                          label="Issue"
                          value={selected.issue}
                          onSave={(v) => applyTicketPatch(selected.id, { issue: v.trim() })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label>Due Date</Label>
                        <input
                          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                          type="date"
                          value={selected.due_date || ""}
                          onChange={(e) => handleDueDateChange(selected.id, e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Technician</Label>
                        <Select
                          placeholder="Unassigned"
                          selectedKey={selected.assigned_to ? String(selected.assigned_to) : null}
                          onSelectionChange={(key) => handleAssignedToChange(selected.id, key ? String(key) : "")}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {technicians.map((t) => (
                                <ListBox.Item key={t.id} id={String(t.id)}>
                                  {t.name}
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label>Labels</Label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selected.labels.map((label) => (
                            <span key={label} className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                              {label}
                              <button aria-label={`Remove ${label}`} type="button" onClick={() => handleRemoveLabel(selected, label)}>
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            className="min-w-[120px] flex-1 rounded-full border border-dashed border-border bg-transparent px-3 py-1 text-xs outline-none focus:border-accent"
                            placeholder="Add a label + Enter"
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddLabel(selected);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Balance Due</span>
                        <strong className="text-xl text-foreground">${ticketBalanceDue(selected).toFixed(2)}</strong>
                        {asArray<TicketPayment>(selected.payments).length > 0 && (
                          <p className="m-0 mt-1 text-xs text-muted">
                            {asArray<TicketPayment>(selected.payments).length} payment
                            {asArray<TicketPayment>(selected.payments).length !== 1 ? "s" : ""} recorded
                          </p>
                        )}
                      </div>
                      {ticketBalanceDue(selected) > 0 && (
                        <Button variant="primary" onPress={() => setPayingTicket(selected)}>
                          <CreditCard className="size-4" />
                          <span>Take Payment</span>
                        </Button>
                      )}
                    </div>

                    <div>
                      <span className="mb-2 block text-micro font-bold uppercase text-muted">Parts Used</span>
                      <div className="flex flex-col gap-2">
                        {asArray<Ticket["parts"][number]>(selected.parts).length === 0 && (
                          <p className="m-0 text-sm text-muted">No parts assigned yet.</p>
                        )}
                        {asArray<Ticket["parts"][number]>(selected.parts).map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Wrench className="size-4 text-accent" />
                              <div>
                                <strong className="block text-foreground">{p.name}</strong>
                                <span className="text-xs text-muted">
                                  Qty {p.qty} · ${Number(p.price).toFixed(2)} each
                                </span>
                              </div>
                            </div>
                            <Button isIconOnly aria-label="Remove part" size="sm" variant="ghost" onPress={() => handleRemovePart(idx)}>
                              <Trash2 className="size-4 text-danger" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <Select
                          className="min-w-[220px] flex-1"
                          placeholder="Select a part…"
                          selectedKey={partSelection.inventoryId || null}
                          onSelectionChange={(key) => setPartSelection((s) => ({ ...s, inventoryId: String(key) }))}
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {inventory.map((i) => (
                                <ListBox.Item key={i.id} id={String(i.id)}>
                                  {i.name} ({i.stock} in stock)
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                        <TextField
                          className="flex w-20 flex-col gap-1.5"
                          type="number"
                          value={partSelection.qty}
                          onChange={(v) => setPartSelection((s) => ({ ...s, qty: v }))}
                        >
                          <Label>Qty</Label>
                          <InputGroup>
                            <InputGroup.Input />
                          </InputGroup>
                        </TextField>
                        <Button isDisabled={!partSelection.inventoryId} variant="outline" onPress={handleAddPart}>
                          <Plus className="size-4" />
                          <span>Add Part</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span className="mb-2 block text-micro font-bold uppercase text-muted">Notes</span>
                      <div className="flex flex-col gap-2">
                        {asArray<Ticket["notes"][number]>(selected.notes).length === 0 && (
                          <p className="m-0 text-sm text-muted">No notes yet.</p>
                        )}
                        {asArray<Ticket["notes"][number]>(selected.notes).map((n, idx) => (
                          <div key={idx} className="rounded-xl border border-border bg-surface p-3 text-sm">
                            <p className="m-0">{n.text}</p>
                            <span className="text-xs text-muted">{new Date(n.at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <TextArea
                          className="flex-1"
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                        />
                        <Button isDisabled={!noteDraft.trim()} variant="outline" onPress={handleAddNote}>
                          Add
                        </Button>
                      </div>
                    </div>

                    <SignaturePad label="Customer Pickup Signature" value={selected.signature} onSave={handleSaveSignature} />
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <PaymentModal
        amount={payingTicket ? ticketBalanceDue(payingTicket) : 0}
        note={payingTicket ? `NovaOps Ticket #${payingTicket.id}` : ""}
        open={!!payingTicket}
        referenceId={payingTicket ? `ticket-${payingTicket.id}` : ""}
        title={payingTicket ? `Take Payment — Ticket #${payingTicket.id}` : ""}
        onClose={() => setPayingTicket(null)}
        onPaid={handlePaid}
      />
    </div>
  );
}

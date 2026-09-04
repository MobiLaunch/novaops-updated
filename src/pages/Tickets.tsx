import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { ClipboardList, CreditCard, Eye, Plus, Printer, Ticket as TicketIcon, Trash2, Wrench } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import PaymentModal from "@/components/payments/PaymentModal";
import SignaturePad from "@/components/SignaturePad";
import type { InventoryItem, Ticket, TicketPayment, TicketStatus } from "@/types/domain";
import {
  sbAssignPartToTicket,
  sbCreateTicket,
  sbFetchInventory,
  sbFetchTickets,
  sbFindOrCreateCustomer,
  sbRemovePartFromTicket,
  sbUpdateTicket,
} from "@/lib/supabase";
import { printBarcodeLabel } from "@/lib/print";
import { asArray } from "@/lib/utils";

function balanceDue(t: Ticket) {
  return Number(t.price) - asArray<TicketPayment>(t.payments).reduce((sum, p) => sum + Number(p.amount), 0);
}

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

export default function Tickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState<NewTicketForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [payingTicket, setPayingTicket] = useState<Ticket | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [partSelection, setPartSelection] = useState<{ inventoryId: string; qty: string }>({ inventoryId: "", qty: "1" });

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchTickets();

    setLoading(false);
    if (data) setTickets(data);
  };

  useEffect(() => {
    load();
    sbFetchInventory().then(({ data }) => data && setInventory(data));
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");

    if (openId && tickets.length > 0) {
      const match = tickets.find((t) => String(t.id) === openId);

      if (match) setSelected(match);
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [tickets, searchParams, setSearchParams]);

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

  const handleStatusChange = async (id: number, status: string) => {
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selected?.id === id) setSelected((s) => s && { ...s, status });
    await sbUpdateTicket(id, { status });
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

  const filtered = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

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
          {balanceDue(t) > 0 && (
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
          title: loading ? "Loading tickets…" : "No tickets found",
          description: statusFilter === "all" ? "New tickets will appear here." : `No tickets currently marked "${statusFilter}".`,
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
                    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-secondary/60 p-4 text-sm">
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Model</span>
                        <strong>{selected.device_model || "—"}</strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Price</span>
                        <strong>${Number(selected.price).toFixed(2)}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-micro font-bold uppercase text-muted">Issue</span>
                        <p className="m-0">{selected.issue}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Balance Due</span>
                        <strong className="text-xl text-foreground">${balanceDue(selected).toFixed(2)}</strong>
                        {asArray<TicketPayment>(selected.payments).length > 0 && (
                          <p className="m-0 mt-1 text-xs text-muted">
                            {asArray<TicketPayment>(selected.payments).length} payment
                            {asArray<TicketPayment>(selected.payments).length !== 1 ? "s" : ""} recorded
                          </p>
                        )}
                      </div>
                      {balanceDue(selected) > 0 && (
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

      <PaymentModal ticket={payingTicket} onClose={() => setPayingTicket(null)} onPaid={handlePaid} />
    </div>
  );
}

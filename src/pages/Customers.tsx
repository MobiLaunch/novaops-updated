import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Chip, FieldError, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { CircleAlert, Mail, MapPin, Phone, Plus, RefreshCw, Search, Ticket as TicketIcon, UserRoundX, Users, Wrench } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { Customer, Ticket } from "@/types/domain";
import { sbFetchCustomers, sbFetchTickets, sbUpsertCustomer } from "@/lib/supabase";
import { asArray, formatCurrency, initials } from "@/lib/utils";

const emptyForm: Partial<Customer> = { name: "", phone: "", email: "", address: "", notes: "" };

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
      {initials(name || "?")}
    </span>
  );
}

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: tix }] = await Promise.all([sbFetchCustomers(), sbFetchTickets()]);

    setLoading(false);
    setLoadError(error);
    if (data) setCustomers(data);
    if (tix) setTickets(tix);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");

    if (openId && customers.length > 0) {
      const match = customers.find((c) => String(c.id) === openId);

      if (match) setViewing(match);
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [customers, searchParams, setSearchParams]);

  const handleSave = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const { data, error } = await sbUpsertCustomer(editing);

    setSaving(false);
    if (data) {
      setCustomers((cs) => {
        const exists = cs.some((c) => c.id === data.id);

        return exists ? cs.map((c) => (c.id === data.id ? data : c)) : [data, ...cs];
      });
      setEditing(null);
      if (viewing?.id === data.id) setViewing(data);
    } else if (error) {
      setLoadError(error);
    }
  };

  const ticketsFor = (customerId: number) => tickets.filter((t) => t.customer_id === customerId);
  const lifetimeValue = (customerId: number) =>
    ticketsFor(customerId).reduce((sum, t) => sum + asArray<{ amount: number }>(t.payments).reduce((s, p) => s + Number(p.amount), 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return customers;

    return customers.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
  }, [customers, query]);

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <button className="flex items-center gap-3 text-left" type="button" onClick={() => setViewing(c)}>
          <Avatar name={c.name} />
          <strong className="text-sm text-foreground hover:text-accent">{c.name}</strong>
        </button>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div>
          <span className="block text-sm text-foreground">{c.phone || "—"}</span>
          <span className="text-xs text-muted">{c.email || "No email"}</span>
        </div>
      ),
    },
    {
      key: "tickets",
      header: "Tickets",
      render: (c) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Wrench className="size-3.5 text-muted" />
          {ticketsFor(c.id).length}
        </span>
      ),
    },
    {
      key: "value",
      header: "Lifetime Value",
      render: (c) => <span className="text-sm font-semibold text-success">{formatCurrency(lifetimeValue(c.id))}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {asArray<string>(c.tags).map((t) => (
            <Chip key={t} size="sm" variant="soft">
              <Chip.Label>{t}</Chip.Label>
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <Button size="sm" variant="ghost" onPress={() => setEditing(c)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        action={
          <Button variant="primary" onPress={() => setEditing(emptyForm)}>
            <Plus className="size-4" />
            <span>New Customer</span>
          </Button>
        }
        description={`${customers.length} customer${customers.length !== 1 ? "s" : ""} on file`}
        eyebrow="Customers"
        title="Customer Directory"
      />

      {loadError && (
        <Alert className="mb-4" role="alert" status="danger">
          <Alert.Indicator>
            <CircleAlert className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>
              Couldn&rsquo;t load customers: {loadError}
            </Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="outline" onPress={load}>
            <RefreshCw className="size-4" />
            <span>Retry</span>
          </Button>
        </Alert>
      )}

      {customers.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
            placeholder="Search by name, phone, or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <DataTable
        ariaLabel="Customers"
        columns={columns}
        data={filtered}
        emptyState={{
          icon: loading ? Users : UserRoundX,
          title: loading ? "Loading customers…" : query ? "No matches" : "No customers yet",
          description: query ? `No customers match "${query}".` : "Customers you create or that come from tickets will show up here.",
        }}
        rowKey={(c) => String(c.id)}
      />

      {/* Edit / new customer */}
      <Modal>
        <Modal.Backdrop isOpen={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editing?.id ? "Edit Customer" : "New Customer"}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5"
                  value={editing?.name || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, name: v })}
                >
                  <Label>Name *</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.phone || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, phone: v })}
                >
                  <Label>Phone</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.email || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, email: v })}
                >
                  <Label>Email</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.address || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, address: v })}
                >
                  <Label>Address</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleSave}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Customer detail — profile + ticket history */}
      <Modal>
        <Modal.Backdrop isOpen={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
          <Modal.Container scroll="inside" size="lg">
            <Modal.Dialog>
              {viewing && (
                <>
                  <Modal.Header>
                    <div className="flex items-center gap-3">
                      <Avatar name={viewing.name} />
                      <Modal.Heading>{viewing.name}</Modal.Heading>
                    </div>
                    <Button variant="outline" onPress={() => setEditing(viewing)}>
                      Edit
                    </Button>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-surface-secondary/60 p-4 text-sm sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-accent" />
                        {viewing.phone || "No phone"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-accent" />
                        {viewing.email || "No email"}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-accent" />
                        {viewing.address || "No address"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border p-4 text-center">
                        <strong className="block text-2xl font-extrabold text-foreground">{ticketsFor(viewing.id).length}</strong>
                        <span className="text-xs text-muted">Total tickets</span>
                      </div>
                      <div className="rounded-2xl border border-border p-4 text-center">
                        <strong className="block text-2xl font-extrabold text-success">{formatCurrency(lifetimeValue(viewing.id))}</strong>
                        <span className="text-xs text-muted">Lifetime value</span>
                      </div>
                    </div>

                    {viewing.notes && (
                      <div>
                        <span className="mb-1 block text-micro font-bold uppercase text-muted">Notes</span>
                        <p className="m-0 text-sm text-foreground">{viewing.notes}</p>
                      </div>
                    )}

                    <div>
                      <span className="mb-2 block text-micro font-bold uppercase text-muted">Ticket History</span>
                      {ticketsFor(viewing.id).length === 0 ? (
                        <p className="m-0 text-sm text-muted">No tickets yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {ticketsFor(viewing.id).map((t) => (
                            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <TicketIcon className="size-4 text-accent" />
                                <div>
                                  <strong className="block text-foreground">
                                    {t.device} {t.device_model}
                                  </strong>
                                  <span className="text-xs text-muted">{t.issue}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <Chip size="sm" variant="soft">
                                  <Chip.Label>{t.status}</Chip.Label>
                                </Chip>
                                <span className="mt-1 block text-xs text-muted">{formatCurrency(t.price)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

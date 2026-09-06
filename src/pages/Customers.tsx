import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Chip, FieldError, InputGroup, Label, ListBox, Modal, Select, Switch, TextArea, TextField } from "@heroui/react";
import {
  Cake,
  CircleAlert,
  Gift,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Ticket as TicketIcon,
  UserRoundX,
  Users,
  Wrench,
  X,
} from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { Customer, CustomerWithStats, PreferredContact, Ticket } from "@/types/domain";
import { sbFetchCustomerTickets, sbFetchCustomersPage, sbUpsertCustomer } from "@/lib/supabase";
import { useServerList } from "@/lib/useServerList";
import { asArray, formatCurrency, initials } from "@/lib/utils";

const emptyForm: Partial<Customer> = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  tags: [],
  secondary_phone: "",
  preferred_contact: "phone",
  referral_source: "",
  birthday: null,
  vip: false,
};

const CONTACT_METHODS: { value: PreferredContact; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "sms", label: "Text (SMS)" },
];

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
      {initials(name || "?")}
    </span>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [viewing, setViewing] = useState<CustomerWithStats | null>(null);
  const [viewingTickets, setViewingTickets] = useState<Ticket[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // One page of the directory at a time. Ticket counts and lifetime value
  // come back on each row from the customers_with_stats view — the page used
  // to fetch every customer, every ticket, and every sale to work them out.
  const fetchPage = useCallback((page: number, search: string) => sbFetchCustomersPage({ page, search }), []);
  const list = useServerList<CustomerWithStats>(fetchPage, []);
  const customers = list.rows;

  // A customer's own tickets are loaded when their record is opened.
  const openCustomer = (customer: CustomerWithStats) => {
    setViewing(customer);
    setViewingTickets(null);
    sbFetchCustomerTickets(customer.id).then(setViewingTickets);
  };

  useEffect(() => {
    const openId = searchParams.get("open");

    if (!openId) return;
    searchParams.delete("open");
    setSearchParams(searchParams, { replace: true });
    // The linked customer may be on any page, so ask for them by name-free
    // lookup rather than searching the rows currently loaded.
    sbFetchCustomersPage({ page: 0, pageSize: 1000 }).then(({ rows }) => {
      const match = rows.find((c) => String(c.id) === openId);

      if (match) openCustomer(match);
    });
  }, [searchParams, setSearchParams]);

  const handleSave = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const { data, error } = await sbUpsertCustomer(editing);

    setSaving(false);
    if (data) {
      setEditing(null);
      // The row's ticket count and lifetime value are computed server-side,
      // so the edited fields are merged onto the stats already in hand
      // rather than guessed at here.
      if (viewing?.id === data.id) setViewing({ ...viewing, ...data });
      list.reload();
    } else if (error) {
      setSaveError(error);
    }
  };

  const columns: DataTableColumn<CustomerWithStats>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <button className="flex items-center gap-3 text-left" type="button" onClick={() => openCustomer(c)}>
          <Avatar name={c.name} />
          <span className="flex items-center gap-1.5">
            <strong className="text-sm text-foreground hover:text-accent">{c.name}</strong>
            {c.vip && <Star className="size-3.5 fill-warning text-warning" />}
          </span>
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
          {c.ticket_count}
        </span>
      ),
    },
    {
      key: "value",
      header: "Lifetime Value",
      render: (c) => <span className="text-sm font-semibold text-success">{formatCurrency(c.lifetime_value)}</span>,
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

      {(list.error || saveError) && (
        <Alert className="mb-4" role="alert" status="danger">
          <Alert.Indicator>
            <CircleAlert className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>
              Couldn&rsquo;t load customers: {list.error || saveError}
            </Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="outline" onPress={list.reload}>
            <RefreshCw className="size-4" />
            <span>Retry</span>
          </Button>
        </Alert>
      )}

      {(list.total > 0 || list.query) && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
            placeholder="Search by name, phone, or email…"
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
          />
        </div>
      )}

      <DataTable
        ariaLabel="Customers"
        columns={columns}
        data={customers}
        emptyState={{
          icon: list.loading ? Users : UserRoundX,
          title: list.loading ? "Loading customers…" : list.query ? "No matches" : "No customers yet",
          description: list.query
            ? `No customers match "${list.query}".`
            : "Customers you create or that come from tickets will show up here.",
        }}
        page={list.page}
        rowKey={(c) => String(c.id)}
        totalRows={list.total}
        onPageChange={list.setPage}
      />

      {/* Edit / new customer */}
      <Modal>
        <Modal.Backdrop isOpen={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <Modal.Container scroll="inside" size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editing?.id ? "Edit Customer" : "New Customer"}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={editing?.name || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, name: v })}
                >
                  <Label>Name</Label>
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
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.secondary_phone || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, secondary_phone: v })}
                >
                  <Label>Secondary Phone</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Preferred Contact Method</Label>
                  <Select
                    selectedKey={editing?.preferred_contact || "phone"}
                    onSelectionChange={(key) => setEditing((f) => f && { ...f, preferred_contact: String(key) as PreferredContact })}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CONTACT_METHODS.map((m) => (
                          <ListBox.Item key={m.value} id={m.value}>
                            {m.label}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.referral_source || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, referral_source: v })}
                >
                  <Label>How did they find us?</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="Google, referral, walk-in…" />
                  </InputGroup>
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Birthday</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    type="date"
                    value={editing?.birthday || ""}
                    onChange={(e) => setEditing((f) => f && { ...f, birthday: e.target.value || null })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch isSelected={!!editing?.vip} onChange={(v) => setEditing((f) => f && { ...f, vip: v })}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Content>
                  </Switch>
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <Star className="size-4 text-warning" />
                    VIP customer
                  </span>
                </div>

                {/* Tags rendered as a table column and notes showed on the
                    detail view, but neither could ever be set from the UI. */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border p-2">
                    {asArray<string>(editing?.tags).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                        {tag}
                        <button
                          aria-label={`Remove ${tag}`}
                          type="button"
                          onClick={() => setEditing((f) => f && { ...f, tags: asArray<string>(f.tags).filter((x) => x !== tag) })}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      className="min-w-[140px] flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                      placeholder="Add a tag + Enter"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const tag = tagDraft.trim();

                        if (!tag) return;
                        setEditing((f) => (f && asArray<string>(f.tags).includes(tag) ? f : f && { ...f, tags: [...asArray<string>(f.tags), tag] }));
                        setTagDraft("");
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Notes</Label>
                  <TextArea
                    placeholder="Anything worth remembering about this customer…"
                    rows={3}
                    value={editing?.notes || ""}
                    onChange={(e) => setEditing((f) => f && { ...f, notes: e.target.value })}
                  />
                </div>
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
                      <div className="flex items-center gap-2">
                        <Modal.Heading>{viewing.name}</Modal.Heading>
                        {viewing.vip && (
                          <Chip color="warning" size="sm" variant="soft">
                            <Chip.Label className="flex items-center gap-1">
                              <Star className="size-3 fill-warning" />
                              VIP
                            </Chip.Label>
                          </Chip>
                        )}
                      </div>
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
                      {viewing.secondary_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-muted" />
                          {viewing.secondary_phone} <span className="text-xs text-muted">(alt)</span>
                        </div>
                      )}
                      {viewing.birthday && (
                        <div className="flex items-center gap-2">
                          <Cake className="size-4 text-accent" />
                          {new Date(`${viewing.birthday}T00:00:00`).toLocaleDateString()}
                        </div>
                      )}
                      {viewing.referral_source && (
                        <div className="flex items-center gap-2">
                          <Gift className="size-4 text-accent" />
                          Found us via {viewing.referral_source}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border p-4 text-center">
                        <strong className="block text-2xl font-extrabold text-foreground">{viewing.ticket_count}</strong>
                        <span className="text-xs text-muted">Total tickets</span>
                      </div>
                      <div className="rounded-2xl border border-border p-4 text-center">
                        <strong className="block text-2xl font-extrabold text-success">{formatCurrency(viewing.lifetime_value)}</strong>
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
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-micro font-bold uppercase text-muted">Ticket History</span>
                        <Button size="sm" variant="outline" onPress={() => navigate(`/tickets?new=${viewing.id}`)}>
                          <Plus className="size-3.5" />
                          <span>New Ticket</span>
                        </Button>
                      </div>
                      {viewingTickets === null ? (
                        <p className="m-0 text-sm text-muted">Loading tickets…</p>
                      ) : viewingTickets.length === 0 ? (
                        <p className="m-0 text-sm text-muted">No tickets yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {viewingTickets.map((t) => (
                            <button
                              key={t.id}
                              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3 text-left text-sm transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
                              type="button"
                              onClick={() => navigate(`/tickets?open=${t.id}`)}
                            >
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
                            </button>
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

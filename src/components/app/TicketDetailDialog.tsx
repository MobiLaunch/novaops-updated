import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { ExternalLink, Mail, Printer, Star, Trash2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Drawer, DrawerContent } from "@/components/arc/drawer/drawer";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Input } from "@/components/arc/input/input";
import { SearchField } from "@/components/arc/search-field/search-field";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Select } from "@/components/arc/select/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { Textarea } from "@/components/arc/textarea/textarea";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { openMailto } from "@/lib/contact";
import { formatCurrency, formatDate, statusTone } from "@/lib/format";
import { printBarcodeLabel } from "@/lib/print";
import { emails, notifyCustomer, readyEmailEnabled } from "@/lib/notify";
import { loadShopConfig } from "@/lib/shopConfig";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const HOURLY = 75;
const METHODS = ["cash", "card", "zelle", "venmo", "check", "other"];
const timeRate = (minutes: number, hourly = HOURLY) => Math.round(((minutes || 0) / 60) * hourly * 100) / 100;
const mins = (m: number) => (!m ? "—" : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);

interface Props { ticketId: number | null; onClose: () => void }

export function TicketDetailDialog({ ticketId, onClose }: Props) {
  const navigate = useNavigate();
  const ticket = useAppStore((s) => s.tickets.find((t) => t.id === ticketId)) as any;
  const customers = useAppStore((s) => s.customers);
  const inventory = useAppStore((s) => s.inventory);
  const settings = useAppStore((s) => s.settings);
  const cur = settings.currency || "$";
  const customer = customers.find((c) => c.id === ticket?.customerId);

  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({ device: "", deviceModel: "", issue: "", deviceDescription: "", serialNumber: "", priority: "normal", tracking: "", warrantyDays: 0 });
  const [catalog, setCatalog] = useState<any[]>([]);
  const [svcQ, setSvcQ] = useState("");
  const [partQ, setPartQ] = useState("");
  const [custom, setCustom] = useState({ name: "", rate: 0, minutes: 0 });
  const [manual, setManual] = useState({ name: "", price: 0 });
  const [note, setNote] = useState("");
  const [pay, setPay] = useState({ amount: 0, method: "", note: "" });
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    if (!ticket) return;
    setTab("info");
    setEditing(false);
    setSvcQ("");
    setPartQ("");
    setInfo({ device: ticket.device || "", deviceModel: ticket.deviceModel || "", issue: ticket.issue || "", deviceDescription: ticket.deviceDescription || "", serialNumber: ticket.serialNumber || "", priority: ticket.priority || "normal", tracking: ticket.tracking || "", warrantyDays: ticket.warrantyDays || 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    void getSupabase()?.from("services").select("*").eq("active", true).order("category").order("name").then(({ data }) => data && setCatalog(data));
  }, []);

  useEffect(() => {
    const model = ticket?.deviceModel?.trim();

    setGuides([]);
    if (!model) return;
    fetch(`https://www.ifixit.com/api/2.0/wikis/CATEGORY/${model.replace(/\s+/g, "_")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Array.isArray(d?.guides) && setGuides(d.guides))
      .catch(() => undefined);
  }, [ticket?.deviceModel]);

  const services: any[] = ticket?.services ?? [];
  const parts: any[] = ticket?.parts ?? [];
  const payments: any[] = ticket?.payments ?? [];
  const notes: any[] = ticket?.notes ?? [];
  const labor = services.reduce((s, x) => s + (x.useTime ? timeRate(x.actualMinutes || x.minutes, x.hourlyRate) : x.rate || 0), 0);
  const partsTotal = parts.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0);
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = labor + partsTotal - paid;
  const statuses = useMemo(() => [...new Set((settings.statuses || "Open,In Progress,Completed").split(",").map((s) => s.trim()).filter(Boolean).concat(ticket?.status ? [ticket.status] : []))], [settings.statuses, ticket?.status]);

  // `price` is the new ticket total when services or parts change.
  const save = async (patch: Record<string, any>, price?: number) => {
    try {
      await useAppStore.getState().updateTicket(ticket.id, price === undefined ? patch : { ...patch, price });
    } catch (e) {
      toast.danger("Could not save", (e as Error).message);
    }
  };
  // Totals change with the list being edited, so compute the new price from the new list.
  const saveServices = (next: any[]) => {
    const l = next.reduce((s, x) => s + (x.useTime ? timeRate(x.actualMinutes || x.minutes, x.hourlyRate) : x.rate || 0), 0);

    return save({ services: next }, l + partsTotal);
  };
  const saveParts = (next: any[]) => {
    const p = next.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);

    return save({ parts: next }, labor + p);
  };

  const setStatus = async (status: string) => {
    await save({ status });
    toast.success("Status updated", `Ticket #${ticket.id} is now ${status}`);
    addNotification("Ticket updated", `#${ticket.id} → ${status}`, "info");
    if (status === "Completed") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (customer?.email && readyEmailEnabled()) {
        const mail = emails.ticketReady(customer.name, ticket.device, ticket.id);

        void notifyCustomer(customer.email, mail.subject, mail.body);
      }
    }
  };

  const saveInfo = async () => {
    await save({ device: info.device, device_model: info.deviceModel, issue: info.issue, device_description: info.deviceDescription, serial_number: info.serialNumber, priority: info.priority, tracking: info.tracking, warranty_days: info.warrantyDays });
    setEditing(false);
    toast.success("Ticket saved", `#${ticket.id} updated`);
  };

  const remove = async () => {
    try {
      await useAppStore.getState().deleteTicket(ticket.id);
      toast.success("Ticket deleted", `#${ticket.id}`);
      onClose();
    } catch (e) {
      toast.danger("Could not delete", (e as Error).message);
    }
  };

  const catalogHits = svcQ ? catalog.filter((s) => s.name.toLowerCase().includes(svcQ.toLowerCase()) || (s.category || "").toLowerCase().includes(svcQ.toLowerCase())).slice(0, 8) : [];
  const partHits = partQ ? inventory.filter((i: any) => i.name.toLowerCase().includes(partQ.toLowerCase()) || (i.sku || "").toLowerCase().includes(partQ.toLowerCase())).slice(0, 8) : [];

  return (
    <Drawer open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="nv-drawer-wide" title={ticket ? `Ticket #${ticket.id}` : ""} description={ticket ? `${ticket.device} ${ticket.deviceModel || ""} · ${customer?.name || "Unknown customer"}` : undefined}>
        {ticket && (
          <div className="nv-stack" style={{ gap: 16 }}>
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <Select label="Status" value={ticket.status} onValueChange={setStatus} options={statuses.map((s) => ({ value: s, label: s }))} />
              <div style={{ textAlign: "right" }}>
                <div className="nv-muted" style={{ fontSize: 13 }}>Balance due</div>
                <div style={{ fontSize: 22, fontWeight: 500 }}>{formatCurrency(Math.max(balance, 0), cur)}</div>
              </div>
            </div>
            <div className="nv-actions">
              <Button size="sm" variant="secondary" onClick={() => { onClose(); navigate(`/pos?ticket=${ticket.id}`); }}><Wallet size={14} />Collect payment</Button>
              <Button size="sm" variant="secondary" disabled={!customer?.email} onClick={() => { onClose(); openMailto(customer!.email, `Ticket #${ticket.id} — ${ticket.device || "Repair"}`, `Hello,\n\nRegarding service for ticket #${ticket.id}:\n\n`); }}><Mail size={14} />Email</Button>
              {["Completed", "Delivered", "Closed"].includes(ticket.status) && customer?.email && (
                <Button size="sm" variant="secondary" onClick={async () => {
                  const { reviewUrl } = await loadShopConfig();

                  if (!reviewUrl) return toast.warning("Add your review link first", "Website, then Shop settings, then Review link.");
                  const mail = emails.reviewRequest(customer.name, ticket.device, reviewUrl);

                  await notifyCustomer(customer.email, mail.subject, mail.body);
                }}><Star size={14} />Ask for a review</Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => void printBarcodeLabel({ sku: `TKT-${ticket.id}`, name: `Ticket #${ticket.id} - ${ticket.device}`, price: labor + partsTotal, customerName: customer?.name || "Unknown", format: "CODE128" })}><Printer size={14} />Label</Button>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="services">Services{services.length ? ` (${services.length})` : ""}</TabsTrigger>
                <TabsTrigger value="parts">Parts{parts.length ? ` (${parts.length})` : ""}</TabsTrigger>
                <TabsTrigger value="payments">Payments{payments.length ? ` (${payments.length})` : ""}</TabsTrigger>
                <TabsTrigger value="notes">Notes{notes.length ? ` (${notes.length})` : ""}</TabsTrigger>
                <TabsTrigger value="guides">Repair guides</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <div className="nv-form" style={{ marginTop: 16 }}>
                  {editing ? (
                    <>
                      <div className="nv-form-row">
                        <Input label="Brand" value={info.device} onChange={(e) => setInfo({ ...info, device: e.target.value })} />
                        <Input label="Model" value={info.deviceModel} onChange={(e) => setInfo({ ...info, deviceModel: e.target.value })} />
                      </div>
                      <Textarea label="Issue" rows={2} value={info.issue} onChange={(e) => setInfo({ ...info, issue: e.target.value })} />
                      <Textarea label="Condition notes" rows={2} value={info.deviceDescription} onChange={(e) => setInfo({ ...info, deviceDescription: e.target.value })} />
                      <div className="nv-form-row">
                        <Input label="Serial or IMEI" value={info.serialNumber} onChange={(e) => setInfo({ ...info, serialNumber: e.target.value })} />
                        <Input label="Tracking number" value={info.tracking} onChange={(e) => setInfo({ ...info, tracking: e.target.value })} />
                      </div>
                      <div className="nv-form-row">
                        <SegmentedControl label="Priority" value={info.priority} onValueChange={(v: string) => setInfo({ ...info, priority: v })} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }]} />
                        <Input label="Warranty days" type="number" min={0} value={info.warrantyDays} onChange={(e) => setInfo({ ...info, warrantyDays: Number(e.target.value) })} />
                      </div>
                      <div className="nv-actions"><Button onClick={saveInfo}>Save</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
                    </>
                  ) : (
                    <>
                      <div className="nv-panel nv-stack">
                        <div className="nv-total"><span className="nv-muted">Issue</span><span>{ticket.issue || "—"}</span></div>
                        <div className="nv-total"><span className="nv-muted">Priority</span><Badge tone={ticket.priority === "high" ? "danger" : ticket.priority === "low" ? "neutral" : "info"}>{ticket.priority}</Badge></div>
                        <div className="nv-total"><span className="nv-muted">Status</span><Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge></div>
                        <div className="nv-total"><span className="nv-muted">Serial or IMEI</span><span>{ticket.serialNumber || "—"}</span></div>
                        <div className="nv-total"><span className="nv-muted">Tracking</span><span>{ticket.tracking || "—"}</span></div>
                        <div className="nv-total"><span className="nv-muted">Warranty</span><span>{ticket.warrantyDays ? `${ticket.warrantyDays} days` : "None"}</span></div>
                        <div className="nv-total"><span className="nv-muted">Created</span><span>{formatDate(ticket.createdAt)}</span></div>
                        {ticket.deviceDescription && <p className="nv-muted" style={{ margin: 0 }}>{ticket.deviceDescription}</p>}
                      </div>
                      {ticket.photos?.length > 0 && (
                        <div className="nv-chip-row">{ticket.photos.map((p: string, i: number) => <img key={i} src={p} alt={`Intake photo ${i + 1}`} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />)}</div>
                      )}
                      {ticket.signature && <img src={ticket.signature} alt="Customer signature" style={{ maxHeight: 90, alignSelf: "flex-start", background: "var(--surface-muted)", borderRadius: 10 }} />}
                      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                        <Button variant="secondary" onClick={() => setEditing(true)}>Edit details</Button>
                        <HoldToConfirm label="Hold to delete ticket" confirmedLabel="Deleted" tone="danger" icon={<Trash2 />} onConfirm={remove} />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="services">
                <div className="nv-stack" style={{ marginTop: 16 }}>
                  <SearchField label="Add from service catalog" value={svcQ} onValueChange={setSvcQ} />
                  {catalogHits.map((s) => (
                    <Button key={s.id} variant="ghost" size="sm" onClick={() => { setSvcQ(""); void saveServices([...services, { name: s.name, rate: s.price || s.flat_rate || 0, hourlyRate: s.hourly_rate || HOURLY, minutes: s.estimated_minutes || s.duration || 0, actualMinutes: s.estimated_minutes || s.duration || 0, useTime: false, catalogId: s.id }]); }}>
                      {s.name} · {formatCurrency(s.price || 0, cur)}
                    </Button>
                  ))}
                  <div className="nv-form-row">
                    <Input label="Custom service" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
                    <div className="nv-form-row">
                      <Input label="Rate" type="number" min={0} value={custom.rate} onChange={(e) => setCustom({ ...custom, rate: Number(e.target.value) })} />
                      <Input label="Minutes" type="number" min={0} value={custom.minutes} onChange={(e) => setCustom({ ...custom, minutes: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div><Button size="sm" variant="secondary" disabled={!custom.name} onClick={() => { void saveServices([...services, { name: custom.name, rate: custom.rate, hourlyRate: HOURLY, minutes: custom.minutes, actualMinutes: custom.minutes, useTime: false }]); setCustom({ name: "", rate: 0, minutes: 0 }); }}>Add custom service</Button></div>
                  {services.length === 0 ? <EmptyState title="No services yet" description="Search the catalog or add a custom service." /> : services.map((s, i) => (
                    <div key={i} className="nv-row">
                      <div className="nv-row-main"><strong>{s.name}</strong><span>{s.useTime ? `${mins(s.actualMinutes || s.minutes)} at ${formatCurrency(s.hourlyRate || HOURLY, cur)}/hr` : `Flat rate · est. ${mins(s.minutes)}`}</span></div>
                      <Button size="sm" variant="ghost" onClick={() => void saveServices(services.map((x, j) => (j === i ? { ...x, useTime: !x.useTime } : x)))}>{s.useTime ? "Use flat rate" : "Bill by time"}</Button>
                      <strong style={{ fontWeight: 500 }}>{formatCurrency(s.useTime ? timeRate(s.actualMinutes || s.minutes, s.hourlyRate) : s.rate || 0, cur)}</strong>
                      <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => void saveServices(services.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                  <div className="nv-total strong"><span>Labor</span><span>{formatCurrency(labor, cur)}</span></div>
                </div>
              </TabsContent>

              <TabsContent value="parts">
                <div className="nv-stack" style={{ marginTop: 16 }}>
                  <SearchField label="Add from inventory" value={partQ} onValueChange={setPartQ} />
                  {partHits.map((i: any) => (
                    <Button key={i.id} variant="ghost" size="sm" onClick={() => {
                      setPartQ("");
                      const ex = parts.find((p) => p.inventoryId === i.id);

                      void saveParts(ex ? parts.map((p) => (p === ex ? { ...p, qty: (p.qty || 1) + 1 } : p)) : [...parts, { name: i.name, sku: i.sku, price: i.price, qty: 1, inventoryId: i.id }]);
                    }}>{i.name} · {formatCurrency(i.price, cur)} · {i.stock} in stock</Button>
                  ))}
                  <div className="nv-form-row">
                    <Input label="Part not in inventory" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
                    <Input label="Price" type="number" min={0} value={manual.price} onChange={(e) => setManual({ ...manual, price: Number(e.target.value) })} />
                  </div>
                  <div><Button size="sm" variant="secondary" disabled={!manual.name} onClick={() => { void saveParts([...parts, { name: manual.name, price: manual.price, qty: 1 }]); setManual({ name: "", price: 0 }); }}>Add part</Button></div>
                  {parts.length === 0 ? <EmptyState title="No parts yet" description="Search inventory or add a part by hand." /> : parts.map((p, i) => (
                    <div key={i} className="nv-row">
                      <div className="nv-row-main"><strong>{p.name}</strong><span>{p.sku ? `SKU ${p.sku} · ` : ""}{formatCurrency(p.price, cur)} each</span></div>
                      <Input label="Qty" type="number" min={1} value={p.qty || 1} style={{ width: 72 }} onChange={(e) => void saveParts(parts.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)))} />
                      <strong style={{ fontWeight: 500 }}>{formatCurrency((p.price || 0) * (p.qty || 1), cur)}</strong>
                      <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => void saveParts(parts.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                  <div className="nv-total strong"><span>Parts</span><span>{formatCurrency(partsTotal, cur)}</span></div>
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="nv-stack" style={{ marginTop: 16 }}>
                  <div className="nv-form-row">
                    <Input label="Amount" type="number" min={0} step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} />
                    <Select label="Method" value={pay.method} onValueChange={(v) => setPay({ ...pay, method: v })} placeholder="Choose" options={METHODS.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))} />
                  </div>
                  <Input label="Note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
                  <div><Button size="sm" disabled={!pay.amount || !pay.method} onClick={() => { void save({ payments: [...payments, { ...pay, date: new Date().toISOString() }] }); setPay({ amount: 0, method: "", note: "" }); }}>Record payment</Button></div>
                  {payments.length === 0 ? <EmptyState title="No payments yet" description="Recorded payments appear here." /> : payments.map((p, i) => (
                    <div key={i} className="nv-row">
                      <div className="nv-row-main"><strong>{formatCurrency(p.amount, cur)} · {p.method}</strong><span>{formatDate(p.date)}{p.note ? ` · ${p.note}` : ""}</span></div>
                      <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => void save({ payments: payments.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                  <div className="nv-total"><span>Total</span><span>{formatCurrency(labor + partsTotal, cur)}</span></div>
                  <div className="nv-total"><span>Paid</span><span>{formatCurrency(paid, cur)}</span></div>
                  <div className="nv-total strong"><span>Balance</span><span>{formatCurrency(balance, cur)}</span></div>
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="nv-stack" style={{ marginTop: 16 }}>
                  <Textarea label="Add a note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                  <div><Button size="sm" disabled={!note.trim()} onClick={() => { void save({ notes: [{ text: note.trim(), date: new Date().toISOString() }, ...notes] }); setNote(""); }}>Add note</Button></div>
                  {notes.length === 0 ? <EmptyState title="No notes yet" description="Add context for the next person on this ticket." /> : notes.map((n, i) => (
                    <div key={i} className="nv-row">
                      <div className="nv-row-main"><strong style={{ whiteSpace: "normal" }}>{n.text}</strong><span>{formatDate(n.date)}</span></div>
                      <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => void save({ notes: notes.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="guides">
                <div className="nv-stack" style={{ marginTop: 16 }}>
                  {guides.length === 0 ? <EmptyState title="No guides found" description={ticket.deviceModel ? `iFixit has no guides for ${ticket.deviceModel}.` : "Add a device model to look up repair guides."} /> : guides.slice(0, 12).map((g: any) => (
                    <a key={g.guideid ?? g.url} className="nv-row" href={g.url} target="_blank" rel="noreferrer">
                      <div className="nv-row-main"><strong>{g.title}</strong><span>{g.subject || "iFixit guide"}</span></div>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

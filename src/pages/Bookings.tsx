import { useMemo, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { ChipGroup } from "@/components/arc/chip-group/chip-group";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Input } from "@/components/arc/input/input";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Select } from "@/components/arc/select/select";
import { SortableDataTable, type DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { Textarea } from "@/components/arc/textarea/textarea";
import { CalendarTab } from "@/components/app/CalendarTab";
import { CustomerSelect } from "@/components/app/CustomerSelect";
import { HouseCallDialog } from "@/components/app/HouseCallDialog";
import { PageHead } from "@/components/app/PageHead";
import { TicketDetailDialog } from "@/components/app/TicketDetailDialog";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { toast } from "@/hooks/useToast";
import { formatCurrency, formatDate, housecallTone, priorityTone, statusTone, vendorTone } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { useUi } from "@/lib/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const HC_FILTERS = ["Scheduled", "In Progress", "Completed", "Cancelled"];
const VENDOR_STATUSES = ["Preparing to Ship", "Shipped to Vendor", "In Repair", "Shipped Back", "Received", "Returned to Customer", "Cancelled"];
const blankVendor = () => ({ customerId: null as number | null, device: "", issue: "", vendor: "", ticketRef: "", trackingNumber: "", status: "Preparing to Ship", sentDate: new Date().toISOString().split("T")[0], estReturn: "", notes: "" });
const overdue = (r: any) => !!r.estReturn && !["Returned to Customer", "Cancelled"].includes(r.status) && new Date(r.estReturn) < new Date();

export default function Bookings() {
  const { tickets, customers, settings, houseCalls, vendorRepairs } = useAppStore();
  const cur = settings.currency || "$";
  const openCreate = useUi((u) => u.openQuickAction);
  const { sendVendorRepairEmail, sendInternalAlert } = useEmailNotifications();
  const [tab, setTab] = useState("tickets");
  const [detail, setDetail] = useState<number | null>(null);

  const [tq, setTq] = useState("");
  const [tStatus, setTStatus] = useState<string[]>([]);
  const [hcQ, setHcQ] = useState("");
  const [hcStatus, setHcStatus] = useState<string[]>([]);
  const [hcOpen, setHcOpen] = useState(false);
  const [hcEdit, setHcEdit] = useState<any | null>(null);
  const [vq, setVq] = useState("");
  const [vStatus, setVStatus] = useState<string[]>([]);
  const [vOpen, setVOpen] = useState(false);
  const [vEdit, setVEdit] = useState<any | null>(null);
  const [vForm, setVForm] = useState(blankVendor());
  const [vSaving, setVSaving] = useState(false);

  const name = (id: number) => customers.find((c) => c.id === id)?.name || "Unknown";
  const statuses = useMemo(() => [...new Set([...(settings.statuses || "Open,In Progress,Completed").split(",").map((s) => s.trim()), ...tickets.map((t) => t.status)])].filter(Boolean), [settings.statuses, tickets]);

  const ticketRows = tickets
    .filter((t) => {
      const q = tq.toLowerCase();

      return (!q || t.device?.toLowerCase().includes(q) || t.issue?.toLowerCase().includes(q) || String(t.id).includes(q) || name(t.customerId).toLowerCase().includes(q)) && (!tStatus.length || tStatus.includes(t.status));
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .map((t) => ({ id: t.id, customer: name(t.customerId), device: `${t.device} ${t.deviceModel || ""}`.trim(), priority: t.priority, status: t.status, price: t.price || 0, date: t.createdAt ? t.createdAt.slice(0, 10) : "" }));
  const columns: DataColumn<Record<string, unknown>>[] = [
    { key: "id", label: "#", width: 90, render: (v) => <Button size="sm" variant="ghost" aria-label={`Open ticket ${v}`} onClick={() => setDetail(v as number)}>#{String(v)}</Button> },
    { key: "customer", label: "Customer" },
    { key: "device", label: "Device" },
    { key: "priority", label: "Priority", width: 100, render: (v) => <Badge tone={priorityTone(v as string)}>{String(v)[0].toUpperCase() + String(v).slice(1)}</Badge> },
    { key: "status", label: "Status", width: 170, render: (v) => <Badge tone={statusTone(v as string)}>{String(v)}</Badge> },
    { key: "price", label: "Price", numeric: true, width: 100, render: (v) => formatCurrency(v as number, cur) },
    { key: "date", label: "Created", width: 120, render: (v) => formatDate(v as string) },
  ];

  const hcList = (houseCalls as any[]).filter((c) => {
    const q = hcQ.toLowerCase();

    return (!q || name(c.customerId).toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q) || (c.issue || c.description || "").toLowerCase().includes(q)) && (!hcStatus.length || hcStatus.includes(c.status));
  });
  const hcCount = (s: string) => (houseCalls as any[]).filter((c) => c.status === s).length;

  const advance = async (c: any) => {
    try { await useAppStore.getState().updateHouseCall(c.id, { status: c.status === "Scheduled" ? "In Progress" : "Completed" }); } catch { toast.danger("Could not update status"); }
  };
  const removeHc = async (c: any) => {
    try { await useAppStore.getState().deleteHouseCall(c.id); toast.success("House call removed"); } catch { toast.danger("Could not delete house call"); }
  };

  const vList = (vendorRepairs as any[]).filter((r) => {
    const q = vq.toLowerCase();

    return (!q || [r.vendor, r.device, r.issue, r.trackingNumber].some((x) => (x || "").toLowerCase().includes(q))) && (!vStatus.length || vStatus.includes(r.status));
  }).sort((a, b) => (b.id || 0) - (a.id || 0));

  const editVendor = (r?: any) => {
    setVEdit(r ?? null);
    setVForm(r ? { ...blankVendor(), ...r } : blankVendor());
    setVOpen(true);
  };
  const saveVendor = async () => {
    setVSaving(true);
    try {
      const st = useAppStore.getState();
      const isNew = !vEdit;

      if (vEdit) await st.updateVendorRepair(vEdit.id, { ...vForm });
      else await st.createVendorRepair({ ...vForm });
      toast.success("Saved", isNew ? "Vendor repair created" : "Vendor repair updated");
      if (isNew) {
        void sendVendorRepairEmail(vForm);
        void sendInternalAlert({ eventType: "Vendor Repair", eventSummary: "New vendor repair dispatched", customerName: name(vForm.customerId as number), deviceName: vForm.device, issueDescription: vForm.issue });
      }
      setVOpen(false);
    } catch (e) {
      toast.danger("Could not save vendor repair", (e as Error).message);
    } finally {
      setVSaving(false);
    }
  };
  const removeVendor = async () => {
    try { await useAppStore.getState().deleteVendorRepair(vEdit.id); toast.success("Vendor repair deleted"); setVOpen(false); } catch (e) { toast.danger("Could not delete", (e as Error).message); }
  };
  const sv = <K extends keyof ReturnType<typeof blankVendor>>(k: K, v: ReturnType<typeof blankVendor>[K]) => setVForm((f) => ({ ...f, [k]: v }));

  const openTickets = tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;
  const activeHc = (houseCalls as any[]).filter((c) => c.status !== "Completed" && c.status !== "Cancelled").length;
  const activeV = (vendorRepairs as any[]).filter((r) => !["Returned to Customer", "Cancelled"].includes(r.status)).length;

  const action = tab === "tickets" ? <Button onClick={() => openCreate("ticket")}><Plus size={14} />New ticket</Button>
    : tab === "housecalls" ? <Button onClick={() => { setHcEdit(null); setHcOpen(true); }}><Plus size={14} />Schedule call</Button>
    : tab === "thirdparty" ? <Button onClick={() => editVendor()}><Plus size={14} />New vendor repair</Button> : null;

  return (
    <>
      <PageHead title="Bookings" subtitle="Tickets, house calls and vendor repairs">{action}</PageHead>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets{openTickets ? ` (${openTickets})` : ""}</TabsTrigger>
          <TabsTrigger value="housecalls">House calls{activeHc ? ` (${activeHc})` : ""}</TabsTrigger>
          <TabsTrigger value="thirdparty">Vendor repairs{activeV ? ` (${activeV})` : ""}</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="nv-grid cols-4" style={{ margin: "16px 0" }}>
            <MetricCard label="Open" value={tickets.filter((t) => t.status === "Open").length} context="Waiting to start" />
            <MetricCard label="In progress" value={tickets.filter((t) => t.status === "In Progress").length} context="On the bench" />
            <MetricCard label="Completed" value={tickets.filter((t) => t.status === "Completed").length} context="Ready for pickup" />
            <MetricCard label="Total" value={tickets.length} context="All tickets" />
          </div>
          <div className="nv-panel nv-stack" style={{ marginBottom: 16 }}>
            <SearchField label="Search tickets" value={tq} onValueChange={setTq} />
            <ChipGroup label="Status" multiple options={statuses.map((s) => ({ value: s, label: s }))} value={tStatus} onValueChange={setTStatus} />
          </div>
          {ticketRows.length === 0 ? (
            <EmptyState title="No tickets found" description="Create the first ticket to get started." action={<Button onClick={() => openCreate("ticket")}>Create ticket</Button>} />
          ) : (
            <div className="nv-panel nv-table-wrap">
              <SortableDataTable rows={ticketRows} columns={columns} rowKey="id" caption="Tickets" defaultSort={{ key: "id", direction: "desc" }} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="housecalls">
          <div className="nv-grid cols-4" style={{ margin: "16px 0" }}>
            <MetricCard label="All calls" value={houseCalls.length} context="Total scheduled" />
            <MetricCard label="Scheduled" value={hcCount("Scheduled")} context="Upcoming" />
            <MetricCard label="In progress" value={hcCount("In Progress")} context="On site now" />
            <MetricCard label="Completed" value={hcCount("Completed")} context="Done" />
          </div>
          <div className="nv-panel nv-stack" style={{ marginBottom: 16 }}>
            <SearchField label="Search name, address or issue" value={hcQ} onValueChange={setHcQ} />
            <ChipGroup label="Status" multiple options={HC_FILTERS.map((s) => ({ value: s, label: s }))} value={hcStatus} onValueChange={setHcStatus} />
          </div>
          {hcList.length === 0 ? (
            <EmptyState title="No house calls" description="Schedule your first on-site visit." action={<Button onClick={() => { setHcEdit(null); setHcOpen(true); }}>Schedule call</Button>} />
          ) : (
            <div className="nv-grid cols-3">
              {hcList.map((c) => (
                <div key={c.id} className="nv-panel nv-stack">
                  <button type="button" style={{ all: "unset", cursor: "pointer", display: "grid", gap: 6 }} onClick={() => { setHcEdit(c); setHcOpen(true); }}>
                    <span className="nv-actions" style={{ justifyContent: "space-between" }}><strong style={{ fontWeight: 500 }}>{name(c.customerId)}</strong><Badge tone={housecallTone(c.status)}>{c.status}</Badge></span>
                    <span className="nv-muted" style={{ fontSize: 13, display: "flex", gap: 6 }}><MapPin size={14} />{c.address || "No address"}</span>
                    <span style={{ fontSize: 13 }}>{formatDate(c.date)}{c.time ? ` at ${c.time}` : ""}</span>
                    <span className="nv-muted" style={{ fontSize: 13 }}>{c.issue || c.description}</span>
                  </button>
                  <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                    {c.status !== "Completed" && c.status !== "Cancelled" ? <Button size="sm" onClick={() => advance(c)}>{c.status === "Scheduled" ? "Start call" : "Complete"}</Button> : <span />}
                    <Button size="sm" variant="ghost" aria-label="Delete house call" onClick={() => removeHc(c)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="thirdparty">
          <div className="nv-grid cols-4" style={{ margin: "16px 0" }}>
            <MetricCard label="Total sent" value={vendorRepairs.length} context="All vendor repairs" />
            <MetricCard label="In transit" value={(vendorRepairs as any[]).filter((r) => r.status === "Shipped to Vendor" || r.status === "Shipped Back").length} context="On the way" />
            <MetricCard label="In repair" value={(vendorRepairs as any[]).filter((r) => r.status === "In Repair").length} context="At the vendor" />
            <MetricCard label="Overdue" value={(vendorRepairs as any[]).filter(overdue).length} context="Past expected return" />
          </div>
          <div className="nv-panel nv-stack" style={{ marginBottom: 16 }}>
            <SearchField label="Search vendor repairs" value={vq} onValueChange={setVq} />
            <ChipGroup label="Status" multiple options={VENDOR_STATUSES.map((s) => ({ value: s, label: s }))} value={vStatus} onValueChange={setVStatus} />
          </div>
          {vList.length === 0 ? (
            <EmptyState title="No vendor repairs" description="Track devices you send out to specialists." action={<Button onClick={() => editVendor()}>New vendor repair</Button>} />
          ) : (
            <div className="nv-panel">
              {vList.map((r) => (
                <div key={r.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => editVendor(r)}>
                  <div className="nv-row-main">
                    <strong>{r.vendor || "Vendor"}{r.ticketRef ? ` · #${r.ticketRef}` : ""}</strong>
                    <span>{name(r.customerId)} · {r.device} · {r.issue}</span>
                  </div>
                  {overdue(r) && <Badge tone="danger">Overdue</Badge>}
                  <Badge tone={vendorTone(r.status)}>{r.status}</Badge>
                  <span className="nv-muted" style={{ fontSize: 13 }}>{r.estReturn ? `Due ${formatDate(r.estReturn)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar"><CalendarTab /></TabsContent>
      </Tabs>

      <TicketDetailDialog ticketId={detail} onClose={() => setDetail(null)} />
      <HouseCallDialog open={hcOpen} onOpenChange={setHcOpen} editingCall={hcEdit} />

      <Dialog open={vOpen} onOpenChange={setVOpen}>
        <DialogContent className="nv-wide" title={vEdit ? "Edit vendor repair" : "New vendor repair"} description="Track a device sent to an outside specialist">
          <div className="nv-form">
            <CustomerSelect value={vForm.customerId} onChange={(v) => sv("customerId", v)} />
            <div className="nv-form-row">
              <Input label="Vendor" value={vForm.vendor} onChange={(e) => sv("vendor", e.target.value)} />
              <Input label="Device" value={vForm.device} onChange={(e) => sv("device", e.target.value)} />
            </div>
            <Textarea label="Issue" rows={2} value={vForm.issue} onChange={(e) => sv("issue", e.target.value)} />
            <div className="nv-form-row">
              <Input label="Linked ticket" value={vForm.ticketRef} onChange={(e) => sv("ticketRef", e.target.value)} />
              <Input label="Tracking number" value={vForm.trackingNumber} onChange={(e) => sv("trackingNumber", e.target.value)} />
            </div>
            <div className="nv-form-row">
              <Select label="Status" value={vForm.status} onValueChange={(v) => sv("status", v)} options={VENDOR_STATUSES.map((s) => ({ value: s, label: s }))} />
              <Input label="Sent date" type="date" value={vForm.sentDate ?? ""} onChange={(e) => sv("sentDate", e.target.value)} />
            </div>
            <Input label="Expected return" type="date" value={vForm.estReturn ?? ""} onChange={(e) => sv("estReturn", e.target.value)} />
            <Textarea label="Notes" rows={2} value={vForm.notes} onChange={(e) => sv("notes", e.target.value)} />
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              {vEdit ? <HoldToConfirm label="Hold to delete" confirmedLabel="Deleted" tone="danger" onConfirm={removeVendor} /> : <span />}
              <div className="nv-actions">
                <Button variant="ghost" onClick={() => setVOpen(false)}>Cancel</Button>
                <Button onClick={saveVendor} loading={vSaving} disabled={!vForm.customerId}>{vEdit ? "Save changes" : "Create"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

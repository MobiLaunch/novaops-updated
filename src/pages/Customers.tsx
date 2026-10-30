import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Pencil, Plus, Ticket as TicketIcon } from "lucide-react";

import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Drawer, DrawerContent } from "@/components/arc/drawer/drawer";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { SearchField } from "@/components/arc/search-field/search-field";
import { CustomerWebActivity } from "@/components/app/CustomerWebActivity";
import { CustomerEditDialog } from "@/components/app/CustomerEditDialog";
import { NewTicketDialog } from "@/components/app/NewTicketDialog";
import { PageHead } from "@/components/app/PageHead";
import { StatCard } from "@/components/app/StatCard";
import { toast } from "@/hooks/useToast";
import { openCustomerContact } from "@/lib/contact";
import { formatCurrency, formatDate, statusTone } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { Customer } from "@/types";

export default function Customers() {
  const { customers, tickets, settings } = useAppStore();
  const cur = settings.currency || "$";
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined);
  const [ticketFor, setTicketFor] = useState<number | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const id = Number(params.get("highlight"));
    const c = customers.find((x) => x.id === id);

    if (c) { setSelected(c); params.delete("highlight"); setParams(params, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, customers]);

  const stats = useMemo(() => {
    const by = new Map<number, { revenue: number; count: number }>();

    for (const t of tickets) {
      const e = by.get(t.customerId) ?? { revenue: 0, count: 0 };

      e.revenue += t.price || 0;
      e.count += 1;
      by.set(t.customerId, e);
    }

    return by;
  }, [tickets]);

  const total = tickets.reduce((a, t) => a + (t.price || 0), 0);
  const list = customers.filter((c) => {
    const s = q.toLowerCase();

    return !s || c.name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(q);
  });
  const sel = selected ? customers.find((c) => c.id === selected.id) ?? selected : null;
  const selTickets = sel ? tickets.filter((t) => t.customerId === sel.id) : [];

  const contact = (c: Customer) => { if (!openCustomerContact(c)) toast.warning("No contact method", "Add an email or phone for this customer."); };

  return (
    <>
      <PageHead title="Customers" subtitle={`${customers.length} total`}>
        <Button onClick={() => setEditing(null)}><Plus size={14} />Add customer</Button>
      </PageHead>

      <div className="nv-grid cols-4" style={{ marginBottom: 16 }}>
        <MetricCard label="Customers" value={customers.length} context="In your list" />
        <StatCard label="Total revenue" value={formatCurrency(total, cur)} context="Across all tickets" />
        <StatCard label="Average per customer" value={formatCurrency(customers.length ? total / customers.length : 0, cur)} context="Lifetime value" />
        <MetricCard label="Tickets" value={tickets.length} context="All time" />
      </div>

      <div className="nv-panel">
        <SearchField label="Search customers" value={q} onValueChange={setQ} />
        {list.length === 0 ? (
          <EmptyState title={q ? "No matches" : "No customers yet"} description={q ? "Try a different name, email or phone." : "Add your first customer to get started."} action={!q ? <Button onClick={() => setEditing(null)}>Add customer</Button> : undefined} />
        ) : (
          <div style={{ marginTop: 8 }}>
            {list.map((c) => {
              const st = stats.get(c.id);

              return (
                <div key={c.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                  <Avatar name={c.name} size="md" />
                  <div className="nv-row-main"><strong>{c.name}</strong><span>{[c.phone, c.email].filter(Boolean).join(" · ") || "No contact info"}</span></div>
                  <span className="nv-muted">{st?.count ?? 0} {st?.count === 1 ? "ticket" : "tickets"}</span>
                  <strong style={{ fontWeight: 500, minWidth: 80, textAlign: "right" }}>{formatCurrency(st?.revenue ?? 0, cur)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Drawer open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent title={sel?.name ?? ""} description={sel ? `Customer since ${formatDate(sel.created_at)}` : undefined}>
          {sel && (
            <div className="nv-stack" style={{ gap: 16 }}>
              <div className="nv-stack">
                {sel.phone && <div>{sel.phone}</div>}
                {sel.email && <div>{sel.email}</div>}
                {sel.address && <div className="nv-muted">{sel.address}</div>}
                {sel.driversLicense && <div className="nv-muted">License {sel.driversLicense}</div>}
                {sel.notes && <p className="nv-muted" style={{ margin: 0 }}>{sel.notes}</p>}
              </div>
              <div className="nv-actions">
                <Button size="sm" onClick={() => contact(sel)} disabled={!sel.email && !sel.phone}><Mail size={14} />Contact</Button>
                <Button size="sm" variant="secondary" onClick={() => { setTicketFor(sel.id); }}><TicketIcon size={14} />New ticket</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(sel)}><Pencil size={14} />Edit</Button>
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>Tickets ({selTickets.length})</h2>
                {selTickets.length === 0 ? <p className="nv-muted">No tickets yet.</p> : selTickets.slice(0, 10).map((t) => (
                  <div key={t.id} className="nv-row">
                    <div className="nv-row-main"><strong>#{t.id} · {t.device} {t.deviceModel}</strong><span>{t.issue}</span></div>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    <span>{formatCurrency(t.price, cur)}</span>
                  </div>
                ))}
              </div>
              <CustomerWebActivity cur={cur} email={sel.email || ""} />
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <CustomerEditDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} customer={editing ?? null} onDeleted={() => setSelected(null)} />
      <NewTicketDialog open={ticketFor !== null} onOpenChange={(o) => !o && setTicketFor(null)} presetCustomerId={ticketFor} />
    </>
  );
}

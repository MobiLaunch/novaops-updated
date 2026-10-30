import { useMemo, useState } from "react";
import { ArrowLeft, FileText, Plus, Printer, ShieldCheck, Trash2, ClipboardCheck, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Textarea } from "@/components/arc/textarea/textarea";
import { CustomerSelect } from "@/components/app/CustomerSelect";
import { TradeInWizard } from "@/components/app/TradeInWizard";
import { formatCurrency } from "@/lib/format";
import { getDocuments } from "@/lib/documents";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const AUTH_DEFAULT = "I authorize the above repair shop to perform diagnostics and repairs on my device as described. I understand that additional costs may be incurred if further issues are found, and that I will be contacted for approval before any additional work is performed.";
const authText = () => getDocuments().liabilityWaiver.trim() || AUTH_DEFAULT;
const TEMPLATES = [
  { label: "Invoice", desc: "Itemized billing invoice for parts and labor", icon: FileText, color: "#059669" },
  { label: "Repair Receipt", desc: "Print a receipt for completed repairs", icon: ClipboardCheck, color: "#2563eb" },
  { label: "Service Agreement", desc: "Customer authorization and consent form", icon: ShieldCheck, color: "#7c3aed" },
  { label: "Trade-In Evaluator", desc: "Multi-step trade-in wizard with market pricing", icon: ArrowLeftRight, color: "#d97706", tradeIn: true },
];

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function buildHtml(d: { customer: any; ticket: any; business: any; f: any; total: number; type: string; color: string; docNum: number; lineItems: any[] }) {
  const { customer, ticket, business, f, total, type, color, docNum, lineItems } = d;
  const cur = esc(business.currency || "$");
  const rows = lineItems.map((li) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${esc(li.description)}</td><td style="text-align:center;border-bottom:1px solid #f3f4f6">${esc(li.qty)}</td><td style="text-align:right;border-bottom:1px solid #f3f4f6">${cur}${Number(li.price).toFixed(2)}</td><td style="text-align:right;border-bottom:1px solid #f3f4f6">${cur}${(li.qty * li.price).toFixed(2)}</td></tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(type)}</title><style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;padding:48px;max-width:760px;margin:auto;color:#1a1a1a;font-size:13px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}h1{color:${color};font-size:28px;font-weight:700;margin-bottom:4px}
  .badge{background:${color}18;color:${color};padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700;display:inline-block;margin-top:8px}
  .box{background:${color}08;border:1px solid ${color}20;padding:16px;border-radius:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;padding:8px 0;border-bottom:2px solid #e5e7eb}
  .total td{font-weight:700;font-size:18px;color:${color};padding-top:16px}.sig{border:1.5px solid #e5e7eb;border-radius:12px;padding:20px;margin-top:24px}
  .line{border-bottom:1px solid #9ca3af;width:160px;margin-bottom:4px;height:40px}footer{color:#9ca3af;font-size:11px;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center}
  @media print{body{padding:24px}}</style></head><body>
  <div class="header"><div><h1>${esc(type.toUpperCase())}</h1><p style="font-weight:600;font-size:15px">${esc(business.businessName || "NovaOps")}</p>
  ${business.phone ? `<p style="color:#6b7280">${esc(business.phone)}</p>` : ""}${business.email ? `<p style="color:#6b7280">${esc(business.email)}</p>` : ""}${business.address ? `<p style="color:#6b7280">${esc(business.address)}</p>` : ""}
  <span class="badge">#${docNum}</span></div><div style="text-align:right;color:#6b7280;font-size:12px"><p><strong>Date:</strong> ${esc(f.date)}</p>${f.dueDate ? `<p><strong>Due:</strong> ${esc(f.dueDate)}</p>` : ""}</div></div>
  <div class="box"><strong>Bill to</strong><br><span style="font-weight:600">${esc(customer?.name || "Walk-in customer")}</span><br>${customer?.phone ? `${esc(customer.phone)}<br>` : ""}${customer?.email ? esc(customer.email) : ""}</div>
  ${ticket ? `<div class="box"><strong>Ticket #${esc(ticket.id)}</strong> — ${esc(ticket.device)} ${esc(ticket.deviceModel || "")}<br><span style="color:#6b7280">${esc(ticket.issue)}</span></div>` : ""}
  ${type !== "Service Agreement" ? `<table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit price</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="total"><td colspan="3">TOTAL</td><td style="text-align:right">${cur}${total.toFixed(2)}</td></tr></tfoot></table>` : ""}
  ${f.notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;color:#4b5563;font-size:12px;margin-bottom:16px">${esc(f.notes)}</div>` : ""}
  ${type === "Service Agreement" ? `<div class="sig"><p style="font-weight:700;margin-bottom:12px">Authorization</p><p style="color:#4b5563;line-height:1.6;margin-bottom:24px">${esc(f.authStatement)}</p><div style="display:flex;gap:60px"><div><div class="line"></div><p style="font-size:10px;color:#6b7280">Customer signature</p></div><div><div class="line" style="width:100px"></div><p style="font-size:10px;color:#6b7280">Date</p></div></div></div>` : ""}
  <footer>Thank you for your business. Generated by ${esc(business.businessName || "NovaOps")}</footer><script>window.onload=()=>window.print()<\/script></body></html>`;
}

export function FormsTab() {
  const { customers, tickets, settings } = useAppStore();
  const cur = settings.currency || "$";
  const today = new Date().toISOString().split("T")[0];
  const [tpl, setTpl] = useState<(typeof TEMPLATES)[number] | null>(null);
  const [tradeIn, setTradeIn] = useState(false);
  const [doc, setDoc] = useState(1000);
  const [history, setHistory] = useState<{ id: number; type: string; customer: string; date: string; total: number; html: string }[]>([]);
  const [f, setF] = useState({ customerId: null as number | null, ticketId: "", date: today, dueDate: "", notes: getDocuments().paymentTerms, authStatement: authText(), lineItems: [] as { description: string; qty: number; price: number }[] });

  const ticket: any = tickets.find((t) => String(t.id) === f.ticketId) ?? null;
  const items = useMemo(() => (tpl?.label === "Service Agreement" ? [] : f.lineItems.length ? f.lineItems : ticket ? [{ description: `Repair — ${ticket.device}`, qty: 1, price: ticket.price || 0 }] : []), [tpl, f.lineItems, ticket]);
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);

  const open = (t: (typeof TEMPLATES)[number]) => {
    if (t.tradeIn) return setTradeIn(true);
    setTpl(t);
    setDoc(Math.floor(1000 + Math.random() * 9000));
    setF({ customerId: null, ticketId: "", date: today, dueDate: "", notes: getDocuments().paymentTerms, authStatement: authText(), lineItems: [] });
  };
  const pickTicket = (id: string) => {
    const t: any = tickets.find((x) => String(x.id) === id);

    setF((s) => ({ ...s, ticketId: id, lineItems: t?.price && !s.lineItems.length ? [{ description: `Repair — ${`${t.device} ${t.deviceModel || ""}`.trim()}`, qty: 1, price: t.price }] : s.lineItems }));
  };
  const pickCustomer = (id: number | null) => {
    setF((s) => {
      const t: any = !s.ticketId && id ? tickets.find((x) => x.customerId === id && x.status !== "Completed") : null;

      return { ...s, customerId: id, ticketId: t ? String(t.id) : s.ticketId };
    });
  };
  const setLine = (i: number, patch: Partial<(typeof f.lineItems)[number]>) => setF((s) => ({ ...s, lineItems: s.lineItems.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const print = () => {
    const customer = customers.find((c) => c.id === f.customerId) ?? null;
    const html = buildHtml({ customer, ticket, business: settings, f, total, type: tpl!.label, color: tpl!.color, docNum: doc, lineItems: items });
    const w = window.open("");

    if (w) { w.document.write(html); w.document.close(); }
    setHistory((h) => [{ id: Date.now(), type: tpl!.label, customer: customer?.name || "Walk-in", date: f.date, total, html }, ...h]);
  };
  const reprint = (html: string) => { const w = window.open(""); if (w) { w.document.write(html); w.document.close(); } };

  return (
    <div className="nv-stack" style={{ marginTop: 16, gap: 16 }}>
      {!tpl ? (
        <div className="nv-grid cols-2">
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" className="nv-panel nv-tile" onClick={() => open(t)}>
              <t.icon size={20} />
              <strong style={{ fontWeight: 500 }}>{t.label}</strong>
              <span className="nv-muted" style={{ fontSize: 13 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="nv-panel nv-form">
          <div className="nv-actions"><Button size="sm" variant="ghost" onClick={() => setTpl(null)}><ArrowLeft size={14} />Forms</Button><strong style={{ fontWeight: 500 }}>{tpl.label} #{doc}</strong></div>
          <CustomerSelect value={f.customerId} onChange={pickCustomer} />
          <Select label="Ticket (optional)" value={f.ticketId} onValueChange={pickTicket} placeholder="Link a ticket" options={tickets.slice(0, 100).map((t) => ({ value: String(t.id), label: `#${t.id} · ${t.device} ${t.deviceModel || ""}`.trim() }))} />
          <div className="nv-form-row"><Input label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /><Input label="Due date" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
          {tpl.label !== "Service Agreement" && (
            <div className="nv-stack">
              <div className="nv-actions" style={{ justifyContent: "space-between" }}><strong style={{ fontWeight: 500 }}>Line items</strong><Button size="sm" variant="secondary" onClick={() => setF({ ...f, lineItems: [...f.lineItems, { description: "", qty: 1, price: 0 }] })}><Plus size={14} />Add line</Button></div>
              {f.lineItems.map((l, i) => (
                <div key={i} className="nv-actions" style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
                  <div style={{ flex: 1 }}><Input label="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} /></div>
                  <div style={{ width: 80 }}><Input label="Qty" type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} /></div>
                  <div style={{ width: 110 }}><Input label="Price" type="number" min={0} step="0.01" value={l.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })} /></div>
                  <Button size="sm" variant="ghost" aria-label="Remove line" onClick={() => setF({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
                </div>
              ))}
              <div className="nv-total strong"><span>Total</span><span>{formatCurrency(total, cur)}</span></div>
            </div>
          )}
          {tpl.label === "Service Agreement" && <Textarea label="Authorization statement" rows={4} value={f.authStatement} onChange={(e) => setF({ ...f, authStatement: e.target.value })} />}
          <Textarea label="Notes" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div><Button onClick={print}><Printer size={14} />Generate and print</Button></div>
        </div>
      )}

      {history.length > 0 && (
        <div className="nv-panel">
          <div className="nv-actions" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Recent documents</h2><Button size="sm" variant="ghost" onClick={() => setHistory([])}>Clear</Button></div>
          {history.map((h) => (
            <div key={h.id} className="nv-row"><div className="nv-row-main"><strong>{h.type}</strong><span>{h.customer} · {h.date}</span></div><span>{formatCurrency(h.total, cur)}</span><Button size="sm" variant="ghost" onClick={() => reprint(h.html)}>Reprint</Button></div>
          ))}
        </div>
      )}
      <TradeInWizard open={tradeIn} onOpenChange={setTradeIn} onSaved={() => setTradeIn(false)} />
    </div>
  );
}

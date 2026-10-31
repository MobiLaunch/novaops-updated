import { useCallback, useEffect, useState } from "react";
import { Mail, Printer, Undo2 } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { sendEmail } from "@/lib/notify";
import { printReceipt, type ReceiptData } from "@/lib/print";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The register's recent sales: reprint, email a receipt, or void a sale (which puts the items back in stock). */
export function RecentSales({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [sales, setSales] = useState<any[] | null>(null);
  const isStaff = useAppStore((s) => s.role === "staff");
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const m = (n: number) => formatCurrency(n, cur);

  const load = useCallback(async () => {
    const { data, error } = (await getSupabase()?.from("pos_sales").select("*").order("created_at", { ascending: false }).limit(40)) ?? { data: [], error: null };

    if (error) toast.danger("Couldn't load sales", error.message);
    setSales((data as any[]) || []);
  }, []);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const receiptFor = (s: any): ReceiptData => {
    const st = useAppStore.getState();
    const cust = st.customers.find((c) => c.id === s.customer_id);

    return {
      businessName: st.settings.businessName || "NovaOps", businessAddress: st.settings.address || "", businessPhone: st.settings.phone || "",
      date: new Date(s.created_at).toLocaleString(), items: (s.items || []).map((i: any) => ({ name: i.name, qty: i.quantity, price: i.price })),
      subtotal: Number(s.subtotal), tax: Number(s.tax), total: Number(s.total), currency: cur, customerName: cust?.name, ticketRef: `S-${s.id}`,
    };
  };

  const email = async (s: any) => {
    const cust = useAppStore.getState().customers.find((c) => c.id === s.customer_id);

    if (!cust?.email) return void toast.warning("No email on file", "Attach a customer with an email to the sale first.");
    const r = receiptFor(s);
    const lines = r.items.map((i) => `${i.qty}× ${i.name} — ${m(i.price * i.qty)}`).join("\n");
    const res = await sendEmail(cust.email, `Your receipt from ${r.businessName}`, `Hi ${cust.name || "there"},\n\nThanks for shopping with us. Receipt ${r.ticketRef} (${r.date}):\n\n${lines}\n\nTax: ${m(r.tax)}\nTotal: ${m(r.total)}\n\nThank you,\n${r.businessName}`);

    if (res === "sent") toast.success("Receipt emailed", cust.email);
    else toast.warning("Couldn't email the receipt", res === "not-configured" ? "Email isn't set up yet." : "Try again in a moment.");
  };

  const voidSale = async (s: any) => {
    if (!window.confirm(`Void sale S-${s.id} (${m(Number(s.total))})? Items go back into stock. Refund the customer yourself.`)) return;
    const st = useAppStore.getState();
    const { error } = await getSupabase()!.from("pos_sales").update({ status: "voided" }).eq("id", s.id).neq("status", "voided");

    if (error) return void toast.danger("Couldn't void", error.message);
    await Promise.all((s.items || []).map((i: any) => {
      const inv = i.sku ? st.inventory.find((x) => x.sku === i.sku) : undefined;

      return inv ? st.updateInventoryItem(inv.id, { stock: inv.stock + Number(i.quantity || 0) }).catch(() => null) : null;
    }));
    // Take back points earned and give back points spent, if loyalty was used on this sale.
    if (s.customer_id && (s.loyalty_earned || s.loyalty_redeemed)) {
      const sb = getSupabase()!;
      const call = (delta: number) => sb.rpc("adjust_loyalty", { p_customer: s.customer_id, p_delta: delta, p_reason: "void", p_sale_ref: `S-${s.id}` });
      let res = await call((s.loyalty_redeemed || 0) - (s.loyalty_earned || 0));

      // The customer may have spent the earned points already; still give back what they paid.
      if (res.error && s.loyalty_redeemed) res = await call(s.loyalty_redeemed);
      if (!res.error) useAppStore.setState((x) => ({ customers: x.customers.map((c) => (c.id === s.customer_id ? { ...c, loyaltyPoints: Number(res.data) } : c)) }));
    }
    toast.success("Sale voided", "Stock restored.");
    await load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Recent sales" description="Reprint, email a receipt, or void">
        {sales === null ? <p className="nv-muted">Loading…</p> : sales.length === 0 ? (
          <EmptyState title="No sales yet" description="Completed register sales show up here." />
        ) : (
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            {sales.map((s) => (
              <div key={s.id} className="nv-row">
                <div className="nv-row-main"><strong>S-{s.id} · {m(Number(s.total))}</strong><span>{new Date(s.created_at).toLocaleString()} · {s.payment_method}{s.staff_name ? ` · ${s.staff_name}` : ""}</span></div>
                {s.status === "voided" ? <Badge tone="danger">Voided</Badge> : <>
                  <Button size="sm" variant="ghost" aria-label="Reprint receipt" onClick={() => void printReceipt(receiptFor(s))}><Printer size={14} /></Button>
                  <Button size="sm" variant="ghost" aria-label="Email receipt" onClick={() => void email(s)}><Mail size={14} /></Button>
                  {!isStaff && <Button size="sm" variant="ghost" aria-label="Void sale" onClick={() => void voidSale(s)}><Undo2 size={14} /></Button>}
                </>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

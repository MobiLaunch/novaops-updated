import { useEffect, useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Cash that actually went in the drawer: the sale total minus any part a gift card covered. */
const cashPart = (s: any): number => {
  if (s.payment_method === "Cash") return Number(s.total);
  if (s.payment_method === "Cash + Gift card") return Math.max(0, Number(s.total) - Number(/Gift card \S+ [−-]([\d.]+)/.exec(s.note || "")?.[1] || 0));

  return 0;
};

/** End-of-day count: today's takings by method, and expected vs. counted cash in the drawer. */
export function CloseOut({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const cur = useAppStore((s) => s.settings.currency) || "$";
  const m = (n: number) => formatCurrency(n, cur);
  const [sales, setSales] = useState<any[] | null>(null);
  const [float, setFloat] = useState("");
  const [counted, setCounted] = useState("");

  useEffect(() => {
    if (!open) return;
    const start = new Date();

    start.setHours(0, 0, 0, 0);
    void (async () => {
      const { data } = (await getSupabase()?.from("pos_sales").select("total,payment_method,note,status").gte("created_at", start.toISOString()).neq("status", "voided")) ?? { data: [] };

      setSales((data as any[]) || []);
    })();
  }, [open]);

  const byMethod = new Map<string, number>();

  (sales || []).forEach((s) => byMethod.set(s.payment_method, (byMethod.get(s.payment_method) || 0) + Number(s.total)));
  const cash = (sales || []).reduce((a, s) => a + cashPart(s), 0);
  const expected = (parseFloat(float) || 0) + cash;
  const diff = (parseFloat(counted) || 0) - expected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Close out the day" description="Today's register sales and the cash drawer">
        {sales === null ? <p className="nv-muted">Loading…</p> : (
          <div className="nv-stack">
            <div>
              {[...byMethod.entries()].map(([k, v]) => <div key={k} className="nv-total"><span className="nv-muted">{k}</span><span>{m(v)}</span></div>)}
              {byMethod.size === 0 && <p className="nv-muted">No sales yet today.</p>}
              <div className="nv-total strong"><span>Total sales ({sales.length})</span><span>{m(sales.reduce((a, s) => a + Number(s.total), 0))}</span></div>
            </div>
            <Input label="Starting cash in drawer" type="number" min="0" step="0.01" value={float} onChange={(e) => setFloat(e.target.value)} />
            <div className="nv-total"><span className="nv-muted">Cash sales</span><span>{m(cash)}</span></div>
            <div className="nv-total strong"><span>Expected in drawer</span><span>{m(expected)}</span></div>
            <Input label="Counted cash" type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} />
            {counted !== "" && <p role="status" style={{ margin: 0, fontWeight: 500, color: Math.abs(diff) < 0.005 ? "var(--nv-success, #15803d)" : "var(--nv-danger, #b91c1c)" }}>{Math.abs(diff) < 0.005 ? "Drawer balances." : diff > 0 ? `Over by ${m(diff)}` : `Short by ${m(-diff)}`}</p>}
            <Button variant="secondary" onClick={() => window.print()}>Print</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

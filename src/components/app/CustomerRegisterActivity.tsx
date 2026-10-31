import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** What this customer has bought at the register and any gift cards sold to them. */
export function CustomerRegisterActivity({ customerId, cur, onNavigate }: { customerId: number; cur: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    const sb = getSupabase();

    setSales([]); setCards([]);
    if (!sb) return;
    let live = true;

    void Promise.all([
      sb.from("pos_sales").select("id,total,status,payment_method,created_at,note").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(8),
      sb.from("gift_cards").select("id,code,balance,initial_amount,status").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(5),
    ]).then(([s, g]) => {
      if (!live) return;
      setSales(s.data || []); setCards(g.data || []);
    });

    return () => { live = false; };
  }, [customerId]);

  if (sales.length === 0 && cards.length === 0) return null;
  const lifetime = sales.filter((s) => s.status !== "voided").reduce((a, s) => a + Number(s.total), 0);
  const head = (t: string, extra?: string) => <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>{t}{extra ? <span className="nv-muted" style={{ fontWeight: 400 }}> · {extra}</span> : null}</h2>;

  return (
    <div className="nv-stack" style={{ gap: 16 }}>
      {sales.length > 0 && (
        <div>
          {head("Register sales", `${formatCurrency(lifetime, cur)} recent`)}
          {sales.map((s) => (
            <div key={s.id} className="nv-row">
              <div className="nv-row-main"><strong>S-{s.id}</strong><span>{formatDate(s.created_at)} · {s.payment_method}</span></div>
              {s.status === "voided" && <Badge tone="danger">Voided</Badge>}
              <span>{formatCurrency(Number(s.total), cur)}</span>
            </div>
          ))}
        </div>
      )}
      {cards.length > 0 && (
        <div>
          {head("Gift cards")}
          {cards.map((c) => (
            <div key={c.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => { onNavigate?.(); navigate("/pos"); }}>
              <Gift size={16} aria-hidden="true" />
              <div className="nv-row-main"><strong>{c.code}</strong><span>{formatCurrency(Number(c.balance), cur)} of {formatCurrency(Number(c.initial_amount), cur)}</span></div>
              {c.status === "void" && <Badge tone="danger">Void</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

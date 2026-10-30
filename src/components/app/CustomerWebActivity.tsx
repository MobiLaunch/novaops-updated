import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/arc/badge/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** What this customer has done on the website: orders, bookings and chat, matched by email. */
export function CustomerWebActivity({ email, cur }: { email: string; cur: string }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const sb = getSupabase();
    const like = email.replace(/[\\%_]/g, (c) => `\\${c}`);

    setOrders([]); setBookings([]); setMessages([]);
    if (!sb || !email) return;
    let live = true;

    void Promise.all([
      sb.from("orders").select("id,status,total,created_at").ilike("customer_email", like).order("created_at", { ascending: false }).limit(5),
      sb.from("bookings").select("id,status,service,appt_date,appt_time,novaops_ticket_id").ilike("customer_email", like).order("appt_date", { ascending: false }).limit(5),
      sb.from("messages").select("id,body,direction,created_at,read").eq("channel", "chat").ilike("customer_email", like).order("created_at", { ascending: false }).limit(3),
    ]).then(([o, b, m]) => {
      if (!live) return;
      setOrders(o.data || []); setBookings(b.data || []); setMessages(m.data || []);
    });

    return () => { live = false; };
  }, [email]);

  if (!email || (orders.length === 0 && bookings.length === 0 && messages.length === 0)) return null;
  const head = (t: string, n: number) => <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>{t} ({n})</h2>;

  return (
    <div className="nv-stack" style={{ gap: 16 }}>
      {orders.length > 0 && (
        <div>
          {head("Website orders", orders.length)}
          {orders.map((o) => (
            <button key={o.id} className="nv-row" style={{ all: "unset", display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px 0", cursor: "pointer", boxSizing: "border-box" }} type="button" onClick={() => navigate("/website?tab=orders")}>
              <span className="nv-row-main"><strong>#{String(o.id).slice(0, 8).toUpperCase()}</strong><span>{formatDate(o.created_at)}</span></span>
              <Badge tone={["delivered"].includes(o.status) ? "success" : ["cancelled", "refunded", "payment_failed"].includes(o.status) ? "danger" : "info"}>{o.status}</Badge>
              <span>{formatCurrency(Number(o.total), cur)}</span>
            </button>
          ))}
        </div>
      )}
      {bookings.length > 0 && (
        <div>
          {head("Website bookings", bookings.length)}
          {bookings.map((b) => (
            <button key={b.id} className="nv-row" style={{ all: "unset", display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px 0", cursor: b.novaops_ticket_id ? "pointer" : "default", boxSizing: "border-box" }} type="button" onClick={() => b.novaops_ticket_id && navigate(`/bookings?ticket=${b.novaops_ticket_id}`)}>
              <span className="nv-row-main"><strong>{b.service}</strong><span>{formatDate(b.appt_date)} at {b.appt_time}</span></span>
              <Badge tone={b.status === "confirmed" || b.status === "completed" ? "success" : b.status === "cancelled" ? "danger" : "warning"}>{b.status}</Badge>
            </button>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div>
          {head("Recent chat", messages.length)}
          {messages.map((m) => (
            <button key={m.id} className="nv-row" style={{ all: "unset", display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px 0", cursor: "pointer", boxSizing: "border-box" }} type="button" onClick={() => navigate("/messages")}>
              <span className="nv-row-main"><strong>{m.direction === "inbound" ? "Customer" : "You"}</strong><span>{m.body}</span></span>
              {m.direction === "inbound" && !m.read && <Badge tone="info">New</Badge>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

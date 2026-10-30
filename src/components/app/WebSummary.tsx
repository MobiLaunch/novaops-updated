import { useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronRight, MessageSquare, ShoppingBag } from "lucide-react";

import { useShopCounts } from "@/lib/useShopCounts";

/** What the online shop is waiting on, with one click to the right place. Hidden when there is nothing to do. */
export function WebSummary() {
  const navigate = useNavigate();
  const c = useShopCounts();
  const rows = [
    { label: "Orders to ship", value: c.toShip, hint: "Paid or processing", icon: ShoppingBag, to: "/website?tab=orders" },
    { label: "Bookings to confirm", value: c.pendingBookings, hint: "Waiting on you", icon: CalendarCheck, to: "/website?tab=bookings" },
    { label: "Unread chat messages", value: c.unread, hint: "From the website", icon: MessageSquare, to: "/messages" },
  ].filter((r) => r.value > 0);

  if (rows.length === 0) return null;

  return (
    <section className="nv-panel" aria-label="From the website">
      <h2 style={{ margin: "0 0 4px" }}>From the website</h2>
      {rows.map((r) => (
        <button key={r.label} className="nv-row" style={{ all: "unset", display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 0", cursor: "pointer", boxSizing: "border-box", borderBottom: "1px solid var(--border-subtle)" }} type="button" onClick={() => navigate(r.to)}>
          <r.icon size={16} aria-hidden="true" />
          <span className="nv-row-main"><strong>{r.label}</strong><span>{r.hint}</span></span>
          <strong style={{ fontWeight: 500, fontSize: 18 }}>{r.value}</strong>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}

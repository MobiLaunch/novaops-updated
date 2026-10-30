import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CalendarDays, RefreshCw, Ticket, X } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { ListSkeleton } from "@/components/app/ListSkeleton";
import { toast } from "@/hooks/useToast";
import { emails, notifyCustomer } from "@/lib/notify";
import { getSupabase } from "@/lib/supabase";

interface Booking {
  id: string; status: string; created_at: string;
  customer_name: string; customer_email: string; customer_phone: string;
  service: string; device_type: string; device_model: string; issue: string;
  appt_date: string; appt_time: string; visit_type: string; home_address: string; notes: string;
  novaops_ticket_id: number | null;
}

const tone = (s: string) => (s === "confirmed" || s === "completed" ? "success" : s === "cancelled" || s === "no-show" ? "danger" : "warning") as "success" | "danger" | "warning";

/** Repair requests from the website. Confirming or declining here is what the customer sees on their account. */
export function WebBookings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<"open" | "all">("open");

  const load = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setLoading(false);
    const { data, error } = await sb.from("bookings").select("*").order("appt_date", { ascending: true }).limit(300);

    if (error) toast.danger("Couldn't load bookings", error.message);
    else setRows((data as Booking[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (b: Booking, status: string) => {
    const sb = getSupabase();

    if (!sb) return;
    const { error } = await sb.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", b.id);

    if (error) return toast.danger("Couldn't update", error.message);
    // Keep the POS calendar entry in step with the decision.
    await sb.from("appointments").update({ status: status === "cancelled" ? "cancelled" : "scheduled" }).like("notes", `%${b.id}%`);
    await sb.from("house_calls").update({ status: status === "cancelled" ? "cancelled" : "scheduled" }).like("notes", `%${b.id}%`);
    setRows((all) => all.map((x) => (x.id === b.id ? { ...x, status } : x)));
    toast.success(status === "confirmed" ? "Booking confirmed" : status === "cancelled" ? "Booking declined" : "Booking updated", b.customer_name);
    const when = `${new Date(`${b.appt_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${b.appt_time}`;
    const mail = status === "confirmed" ? emails.bookingConfirmed : status === "cancelled" ? emails.bookingDeclined : null;

    if (mail && b.customer_email) void notifyCustomer(b.customer_email, mail(b.customer_name, b.service, when).subject, mail(b.customer_name, b.service, when).body);
  };

  const shown = show === "open" ? rows.filter((r) => ["pending", "confirmed"].includes(r.status)) : rows;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <span className="nv-actions" style={{ gap: 8 }}>
          <Button size="sm" variant={show === "open" ? "primary" : "secondary"} onClick={() => setShow("open")}>Upcoming{pending ? ` (${pending} to confirm)` : ""}</Button>
          <Button size="sm" variant={show === "all" ? "primary" : "secondary"} onClick={() => setShow("all")}>All</Button>
        </span>
        <Button variant="secondary" onClick={() => void load()}><RefreshCw size={14} aria-hidden="true" />Refresh</Button>
      </div>

      {loading ? <ListSkeleton label="Loading bookings" rows={3} /> : shown.length === 0 ? (
        <EmptyState icon={<CalendarDays size={22} aria-hidden="true" />} title="No website bookings" description="Repair requests from the booking form show up here, and on the calendar." />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {shown.map((b) => (
            <article key={b.id} className="nv-panel" style={{ display: "grid", gap: 8 }}>
              <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontWeight: 500 }}>{b.customer_name}</strong>
                <Badge tone={tone(b.status)}>{b.status}</Badge>
              </div>
              <div>{b.service} · {[b.device_type, b.device_model].filter(Boolean).join(" ")}</div>
              <div className="nv-muted" style={{ fontSize: 14 }}>
                {new Date(`${b.appt_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at {b.appt_time} · {b.visit_type === "home" ? `House call, ${b.home_address}` : "In store"}
              </div>
              {b.issue && <div className="nv-muted" style={{ fontSize: 14 }}>&ldquo;{b.issue}&rdquo;</div>}
              <div className="nv-muted" style={{ fontSize: 14 }}>{[b.customer_phone, b.customer_email].filter(Boolean).join(" · ")}</div>
              <div className="nv-actions" style={{ gap: 8 }}>
                {b.status === "pending" && <Button size="sm" onClick={() => void setStatus(b, "confirmed")}><Check size={14} aria-hidden="true" />Confirm</Button>}
                {["pending", "confirmed"].includes(b.status) && <Button size="sm" variant="secondary" onClick={() => void setStatus(b, "cancelled")}><X size={14} aria-hidden="true" />Decline</Button>}
                {b.status === "confirmed" && <Button size="sm" variant="secondary" onClick={() => void setStatus(b, "completed")}>Mark done</Button>}
                {b.novaops_ticket_id && <Button size="sm" variant="ghost" onClick={() => navigate(`/bookings?ticket=${b.novaops_ticket_id}`)}><Ticket size={14} aria-hidden="true" />Open ticket</Button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

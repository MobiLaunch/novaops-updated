import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Chip, Spinner, TextArea } from "@heroui/react";
import { CalendarClock, CircleAlert, Send, Ticket as TicketIcon, Wrench } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-accent-soft text-accent",
  "In Progress": "bg-warning/15 text-warning",
  "Waiting for Parts": "bg-warning/15 text-warning",
  Completed: "bg-success/15 text-success",
  Delivered: "bg-success/15 text-success",
};

interface TrackedTicket {
  device: string;
  deviceModel: string;
  issue: string;
  status: string;
  price: number;
  balanceDue: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string;
}

interface PortalMessage {
  direction: "inbound" | "outbound";
  body: string;
  created_at: string;
}

export default function TrackTicket() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TrackedTicket | null>(null);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track-ticket?token=${encodeURIComponent(token || "")}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "We couldn't find that repair.");

        return;
      }
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch {
      setError("Something went wrong loading this page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/track-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: draft.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setSendError(data.error || "Couldn't send your message.");

        return;
      }
      setMessages((ms) => [...ms, { direction: "inbound", body: draft.trim(), created_at: new Date().toISOString() }]);
      setDraft("");
    } catch {
      setSendError("Couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute -left-24 -top-28 size-[500px] rounded-full bg-[radial-gradient(ellipse,var(--accent-soft)_0%,transparent_70%)] blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-[400px] rounded-full bg-[radial-gradient(ellipse,var(--accent)_8%,transparent_70%)] opacity-40 blur-[80px]" />

      <div className="absolute right-5 top-5 z-[1]">
        <ThemeToggle />
      </div>

      <main className="relative z-[1] mx-auto w-full max-w-[560px] pt-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Wrench className="size-5" />
          </span>
          <div>
            <strong className="block text-foreground">NovaOps</strong>
            <span className="text-sm text-muted">Track Your Repair</span>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface p-14 text-center">
            <Spinner size="lg" />
            <p className="m-0 text-sm text-muted">Loading your repair status…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface p-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-danger/10 text-danger">
              <CircleAlert className="size-8" />
            </span>
            <h4 className="m-0 text-lg font-bold text-foreground">Can&rsquo;t find that repair</h4>
            <p className="m-0 max-w-md text-sm text-muted">{error}</p>
          </div>
        )}

        {!loading && ticket && (
          <div className="flex flex-col gap-4">
            <div className="rounded-[28px] border border-border bg-surface p-6">
              {ticket.customerName && <p className="m-0 mb-1 text-sm text-muted">Hi {ticket.customerName.split(" ")[0]},</p>}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-xl font-extrabold text-foreground">
                    {ticket.device} {ticket.deviceModel}
                  </strong>
                  <span className="text-sm text-muted">{ticket.issue}</span>
                </div>
                <Chip className={STATUS_STYLES[ticket.status] || "bg-surface-secondary text-muted"} size="md" variant="soft">
                  <Chip.Label>{ticket.status}</Chip.Label>
                </Chip>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-secondary p-3">
                  <span className="block text-xs text-muted">Total</span>
                  <strong className="text-lg text-foreground">{formatCurrency(ticket.price)}</strong>
                </div>
                <div className="rounded-2xl bg-surface-secondary p-3">
                  <span className="block text-xs text-muted">Balance Due</span>
                  <strong className={`text-lg ${ticket.balanceDue > 0 ? "text-warning" : "text-success"}`}>
                    {formatCurrency(ticket.balanceDue)}
                  </strong>
                </div>
              </div>

              {ticket.dueDate && (
                <p className="m-0 mt-3 flex items-center gap-1.5 text-sm text-muted">
                  <CalendarClock className="size-4 text-accent" />
                  Estimated ready by {new Date(`${ticket.dueDate}T00:00:00`).toLocaleDateString()}
                </p>
              )}

              <p className="m-0 mt-3 text-xs text-muted">Last updated {new Date(ticket.updatedAt).toLocaleString()}</p>
            </div>

            <div className="rounded-[28px] border border-border bg-surface p-6">
              <h3 className="m-0 mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                <TicketIcon className="size-4" />
                Questions about this repair?
              </h3>

              {messages.length > 0 && (
                <div className="mb-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                        m.direction === "inbound" ? "ml-auto bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                      <span className={`mt-1 block text-[10px] ${m.direction === "inbound" ? "text-accent-foreground/70" : "text-muted"}`}>
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {sendError && <p className="m-0 mb-2 text-sm text-danger">{sendError}</p>}

              <div className="flex gap-2">
                <TextArea
                  className="flex-1"
                  placeholder="Send a message to the shop…"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button isDisabled={!draft.trim() || sending} variant="primary" onPress={handleSend}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCw, Send } from "lucide-react";

import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Textarea } from "@/components/arc/textarea/textarea";
import { PageHead } from "@/components/app/PageHead";
import { toast } from "@/hooks/useToast";
import { getSupabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";

interface Msg {
  id: number;
  customer_id: number | null;
  customer_name: string;
  customer_email: string;
  channel: string;
  direction: "inbound" | "outbound";
  body: string;
  read: boolean;
  created_at: string;
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Customer chat from the website, plus anything else logged in the shared `messages` table. */
export default function Messages() {
  const userId = useAppStore((s) => s.user?.id);
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setLoading(false);
    const { data, error } = await sb.from("messages").select("*").eq("channel", "chat").order("created_at", { ascending: true }).limit(1000);

    if (error) toast.danger("Couldn't load messages", error.message);
    else setRows((data as Msg[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20000);

    return () => clearInterval(t);
  }, [load]);

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>();

    rows.forEach((m) => {
      const key = m.customer_email.toLowerCase();

      map.set(key, [...(map.get(key) || []), m]);
    });

    return [...map.entries()]
      .map(([email, msgs]) => ({
        email,
        name: [...msgs].reverse().find((m) => m.customer_name)?.customer_name || email,
        msgs,
        last: msgs[msgs.length - 1],
        unread: msgs.filter((m) => m.direction === "inbound" && !m.read).length,
      }))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [rows]);

  const thread = threads.find((t) => t.email === active) ?? threads[0];

  useEffect(() => {
    const sb = getSupabase();

    if (!sb || !thread || thread.unread === 0) return;
    const ids = thread.msgs.filter((m) => m.direction === "inbound" && !m.read).map((m) => m.id);

    void sb.from("messages").update({ read: true }).in("id", ids).then(() => setRows((r) => r.map((m) => (ids.includes(m.id) ? { ...m, read: true } : m))));
  }, [thread?.email, thread?.unread]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const sb = getSupabase();
    const text = draft.trim();

    if (!sb || !thread || !text || !userId) return;
    setSending(true);
    const { data, error } = await sb
      .from("messages")
      .insert({ profile_id: userId, customer_id: thread.last.customer_id, customer_name: thread.name, customer_email: thread.email, channel: "chat", direction: "outbound", subject: "Reply", body: text, read: true, delivered: true })
      .select()
      .single();

    setSending(false);
    if (error) return toast.danger("Couldn't send", error.message);
    setRows((r) => [...r, data as Msg]);
    setDraft("");
  };

  const unreadTotal = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div>
      <PageHead title="Messages" subtitle={unreadTotal ? `${unreadTotal} unread from website customers` : "Website chat with customers"}>
        <Button variant="secondary" onClick={() => void load()}><RefreshCw size={14} aria-hidden="true" />Refresh</Button>
      </PageHead>

      {!loading && threads.length === 0 ? (
        <EmptyState icon={<MessageSquare size={22} aria-hidden="true" />} title="No messages yet" description="When a customer writes to you from the website chat, the conversation shows up here." />
      ) : (
        <div className="nv-msgs">
          <aside className="nv-msgs-list" aria-label="Conversations">
            {threads.map((t) => (
              <button key={t.email} aria-current={thread?.email === t.email ? "true" : undefined} className="nv-msgs-item" type="button" onClick={() => setActive(t.email)}>
                <Avatar name={t.name} />
                <span className="nv-row-main">
                  <strong>{t.name}</strong>
                  <span>{t.last.body}</span>
                </span>
                {t.unread > 0 && <Badge tone="info">{t.unread}</Badge>}
              </button>
            ))}
          </aside>

          {thread && (
            <section className="nv-msgs-thread" aria-label={`Conversation with ${thread.name}`}>
              <header className="nv-msgs-head"><strong>{thread.name}</strong><span>{thread.email}</span></header>
              <div className="nv-msgs-body">
                {thread.msgs.map((m) => (
                  <div key={m.id} className="nv-bubble" data-dir={m.direction}>
                    <p>{m.body}</p>
                    <small>{when(m.created_at)}</small>
                  </div>
                ))}
              </div>
              <form className="nv-msgs-reply" onSubmit={(e) => { e.preventDefault(); void send(); }}>
                <Textarea label="Reply" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <Button disabled={!draft.trim()} loading={sending} type="submit"><Send size={14} aria-hidden="true" />Send</Button>
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

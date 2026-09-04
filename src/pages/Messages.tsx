import { useEffect, useState } from "react";
import { Button, FieldError, InputGroup, Label, Modal, TextArea, TextField } from "@heroui/react";
import { Mail, MailX, RefreshCw, Send } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { Message } from "@/types/domain";
import { getCurrentProfileId, sbCreateMessage, sbFetchMessages, sbMarkMessageRead } from "@/lib/supabase";

const emptyCompose = { to: "", subject: "", body: "" };

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [composing, setComposing] = useState<typeof emptyCompose | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchMessages();

    setLoading(false);
    if (data) setMessages(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const profileId = await getCurrentProfileId();

      if (!profileId) {
        setSyncResult("Sign in first.");

        return;
      }
      const res = await fetch(`/api/fetch-emails?profileId=${profileId}`);
      const data = await res.json();

      if (data.ok) {
        setSyncResult(`Synced ${data.synced} message${data.synced !== 1 ? "s" : ""}.`);
        await load();
      } else {
        setSyncResult(data.error || "Sync failed.");
      }
    } catch (e) {
      setSyncResult(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!composing?.to.trim() || !composing.body.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const profileId = await getCurrentProfileId();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: composing.to, subject: composing.subject, body: composing.body, profileId }),
      });
      const data = await res.json();

      if (!data.ok) {
        setSendError(data.error || "Send failed.");

        return;
      }

      const { data: saved } = await sbCreateMessage({
        customer_email: composing.to,
        customer_name: composing.to,
        channel: "email",
        direction: "outbound",
        subject: composing.subject,
        body: composing.body,
        read: true,
        delivered: !!data.delivered,
      });

      if (saved) setMessages((ms) => [saved, ...ms]);
      setComposing(null);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  const handleOpen = async (m: Message) => {
    if (!m.read) {
      setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      await sbMarkMessageRead(m.id);
    }
  };

  return (
    <div>
      <PageHeader
        action={
          <div className="flex gap-2">
            <Button isDisabled={syncing} variant="outline" onPress={handleSync}>
              <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
              <span>Sync Gmail</span>
            </Button>
            <Button variant="primary" onPress={() => setComposing(emptyCompose)}>
              <Send className="size-4" />
              <span>Compose</span>
            </Button>
          </div>
        }
        description={`${messages.length} message${messages.length !== 1 ? "s" : ""}`}
        eyebrow="Customer Messages"
        title="Messages"
      />

      {syncResult && <p className="mb-4 text-sm text-muted">{syncResult}</p>}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
            <MailX className="size-8" />
          </span>
          <h4 className="m-0 text-lg font-bold text-foreground">{loading ? "Loading messages…" : "No messages yet"}</h4>
          <p className="m-0 max-w-md text-sm text-muted">Connect Gmail and sync, or compose a new message to a customer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <button
              key={m.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                m.read ? "border-border bg-surface" : "border-accent/40 bg-accent-soft"
              }`}
              type="button"
              onClick={() => handleOpen(m)}
            >
              <Mail className={`mt-0.5 size-4 shrink-0 ${m.direction === "outbound" ? "text-muted" : "text-accent"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm text-foreground">{m.customer_name || m.customer_email}</strong>
                  <span className="shrink-0 text-xs text-muted">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="m-0 truncate text-sm text-foreground">{m.subject || "(No subject)"}</p>
                <p className="m-0 truncate text-xs text-muted">{m.body}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal>
        <Modal.Backdrop isOpen={!!composing} onOpenChange={(open) => !open && setComposing(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New Message</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                {sendError && <p className="m-0 text-sm text-danger">{sendError}</p>}
                <TextField isRequired className="flex flex-col gap-1.5" type="email" value={composing?.to || ""} onChange={(v) => setComposing((f) => f && { ...f, to: v })}>
                  <Label>To *</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField className="flex flex-col gap-1.5" value={composing?.subject || ""} onChange={(v) => setComposing((f) => f && { ...f, subject: v })}>
                  <Label>Subject</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Message</Label>
                  <TextArea rows={6} value={composing?.body || ""} onChange={(e) => setComposing((f) => f && { ...f, body: e.target.value })} />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setComposing(null)}>
                  Cancel
                </Button>
                <Button isDisabled={sending} variant="primary" onPress={handleSend}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

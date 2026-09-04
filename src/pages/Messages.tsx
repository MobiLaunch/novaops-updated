import { useEffect, useState } from "react";
import {
  Button,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Tabs,
  TextArea,
  TextField,
} from "@heroui/react";
import { CalendarDays, MessageCircle, Mail, MailX, Package, PackageX, Reply, RefreshCw, Send, Truck } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { CustomerMessage, Message, Shipment, Ticket } from "@/types/domain";
import {
  getCurrentProfileId,
  sbAssignShipmentToTicket,
  sbCreateMessage,
  sbFetchCustomerMessages,
  sbFetchMessages,
  sbFetchShipments,
  sbFetchTickets,
  sbMarkCustomerMessageRead,
  sbMarkMessageRead,
  sbReplyToCustomerThread,
  sbUpdateShipmentStatus,
} from "@/lib/supabase";

const emptyCompose = { to: "", subject: "", body: "" };
const SHIPMENT_STATUSES = ["in_transit", "delivered", "assigned", "archived"];

function statusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Messages() {
  const [tab, setTab] = useState<"inbox" | "parts" | "chat">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [composing, setComposing] = useState<typeof emptyCompose | null>(null);
  const [viewing, setViewing] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: msgs }, { data: ships }, { data: tix }, { data: chats }] = await Promise.all([
      sbFetchMessages(),
      sbFetchShipments(),
      sbFetchTickets(),
      sbFetchCustomerMessages(),
    ]);

    setLoading(false);
    if (msgs) setMessages(msgs);
    if (ships) setShipments(ships);
    if (tix) setTickets(tix);
    if (chats) setCustomerMessages(chats);
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
    setViewing(m);
    if (!m.read) {
      setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      await sbMarkMessageRead(m.id);
    }
  };

  const handleReply = (m: Message) => {
    setViewing(null);
    setComposing({
      to: m.customer_email,
      subject: m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`,
      body: "",
    });
  };

  const handleShipmentStatus = async (id: number, status: string) => {
    setShipments((ss) => ss.map((s) => (s.id === id ? { ...s, status } : s)));
    await sbUpdateShipmentStatus(id, status);
  };

  const handleAssignShipment = async (id: number, ticketId: string) => {
    const ticket_id = ticketId ? Number(ticketId) : null;

    setShipments((ss) => ss.map((s) => (s.id === id ? { ...s, ticket_id, status: ticket_id ? "assigned" : "in_transit" } : s)));
    await sbAssignShipmentToTicket(id, ticket_id);
  };

  const chatThreads = Object.values(
    customerMessages.reduce<Record<string, { email: string; name: string; messages: CustomerMessage[] }>>((acc, m) => {
      const key = m.customer_email || `unknown-${m.id}`;

      acc[key] = acc[key] || { email: m.customer_email, name: m.customer_name, messages: [] };
      acc[key].messages.push(m);

      return acc;
    }, {}),
  ).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.created_at || "";
    const bLast = b.messages[b.messages.length - 1]?.created_at || "";

    return bLast.localeCompare(aLast);
  });

  const openThread = async (email: string) => {
    setActiveThread(email);
    const thread = chatThreads.find((t) => t.email === email);
    const unread = thread?.messages.filter((m) => m.direction === "inbound" && !m.read) || [];

    if (unread.length) {
      setCustomerMessages((ms) => ms.map((m) => (unread.some((u) => u.id === m.id) ? { ...m, read: true } : m)));
      await Promise.all(unread.map((m) => sbMarkCustomerMessageRead(m.id)));
    }
  };

  const handleSendChat = async () => {
    if (!activeThread || !chatDraft.trim()) return;
    const thread = chatThreads.find((t) => t.email === activeThread);

    if (!thread) return;
    setSendingChat(true);
    const { data } = await sbReplyToCustomerThread({
      customer_email: thread.email,
      customer_name: thread.name,
      body: chatDraft.trim(),
    });

    setSendingChat(false);
    if (data) {
      setCustomerMessages((ms) => [...ms, data]);
      setChatDraft("");
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
        description="Customer email and automatically-tracked parts orders."
        eyebrow="Messages"
        title="Messages"
      />

      {syncResult && <p className="mb-4 text-sm text-muted">{syncResult}</p>}

      <Tabs selectedKey={tab} variant="secondary" onSelectionChange={(key) => setTab(String(key) as typeof tab)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Message view">
            <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="inbox">
              <Mail className="size-4 shrink-0" />
              <span>Inbox</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="parts">
              <Package className="size-4 shrink-0" />
              <span>Parts Orders{shipments.length > 0 ? ` (${shipments.length})` : ""}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="chat">
              <MessageCircle className="size-4 shrink-0" />
              <span>Customer Chat</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="inbox">
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
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="parts">
          {shipments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
                <PackageX className="size-8" />
              </span>
              <h4 className="m-0 text-lg font-bold text-foreground">No parts orders detected yet</h4>
              <p className="m-0 max-w-md text-sm text-muted">
                Sync Gmail to scan for shipping notifications from your configured suppliers (Settings → Parts
                Supplier Emails).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {shipments.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 size-4 shrink-0 text-accent" />
                    <div>
                      <strong className="block text-sm text-foreground">{s.supplier_name || s.supplier_email}</strong>
                      <span className="block text-xs text-muted">{s.subject}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        {s.tracking_number && (
                          <span>
                            {s.carrier ? `${s.carrier} · ` : ""}
                            {s.tracking_number}
                          </span>
                        )}
                        {s.estimated_delivery_date && (
                          <span className="flex items-center gap-1 text-accent">
                            <CalendarDays className="size-3" />
                            {s.estimated_delivery_date} {s.estimated_delivery_time}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      className="w-[220px]"
                      placeholder="Assign to ticket…"
                      selectedKey={s.ticket_id ? String(s.ticket_id) : null}
                      onSelectionChange={(key) => handleAssignShipment(s.id, key ? String(key) : "")}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {tickets.map((t) => (
                            <ListBox.Item key={t.id} id={String(t.id)}>
                              #{t.id} — {t.device} {t.device_model}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Select className="w-[140px]" selectedKey={s.status} onSelectionChange={(key) => handleShipmentStatus(s.id, String(key))}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {SHIPMENT_STATUSES.map((st) => (
                            <ListBox.Item key={st} id={st}>
                              {statusLabel(st)}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="chat">
          {chatThreads.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
                <MessageCircle className="size-8" />
              </span>
              <h4 className="m-0 text-lg font-bold text-foreground">No customer chats yet</h4>
              <p className="m-0 max-w-md text-sm text-muted">
                Messages a customer sends from your website (once it has a chat composer wired to
                <code className="mx-1 rounded bg-surface-tertiary px-1.5 py-0.5">customer_messages</code>) will show up here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {chatThreads.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const unread = t.messages.filter((m) => m.direction === "inbound" && !m.read).length;

                return (
                  <button
                    key={t.email}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      unread > 0 ? "border-accent/40 bg-accent-soft" : "border-border bg-surface"
                    }`}
                    type="button"
                    onClick={() => openThread(t.email)}
                  >
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="truncate text-sm text-foreground">{t.name || t.email}</strong>
                        {last && <span className="shrink-0 text-xs text-muted">{new Date(last.created_at).toLocaleString()}</span>}
                      </div>
                      <p className="m-0 truncate text-sm text-muted">{last?.body}</p>
                    </div>
                    {unread > 0 && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Message detail / reply */}
      <Modal>
        <Modal.Backdrop isOpen={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              {viewing && (
                <>
                  <Modal.Header>
                    <Modal.Heading>{viewing.subject || "(No subject)"}</Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-3">
                    <p className="m-0 text-xs text-muted">
                      {viewing.direction === "inbound" ? "From" : "To"} {viewing.customer_name || viewing.customer_email} ·{" "}
                      {new Date(viewing.created_at).toLocaleString()}
                    </p>
                    <p className="m-0 whitespace-pre-wrap text-sm text-foreground">{viewing.body}</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onPress={() => handleReply(viewing)}>
                      <Reply className="size-4" />
                      <span>Reply</span>
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Customer chat thread */}
      <Modal>
        <Modal.Backdrop isOpen={!!activeThread} onOpenChange={(open) => !open && setActiveThread(null)}>
          <Modal.Container scroll="inside" size="md">
            <Modal.Dialog>
              {activeThread &&
                (() => {
                  const thread = chatThreads.find((t) => t.email === activeThread);

                  return (
                    <>
                      <Modal.Header>
                        <Modal.Heading>{thread?.name || activeThread}</Modal.Heading>
                        <Modal.CloseTrigger />
                      </Modal.Header>
                      <Modal.Body className="flex flex-col gap-3">
                        {thread?.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                              m.direction === "outbound" ? "ml-auto bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"
                            }`}
                          >
                            <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                            <span className={`mt-1 block text-[10px] ${m.direction === "outbound" ? "text-accent-foreground/70" : "text-muted"}`}>
                              {new Date(m.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </Modal.Body>
                      <Modal.Footer className="flex gap-2">
                        <TextArea className="flex-1" rows={2} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} />
                        <Button isDisabled={!chatDraft.trim() || sendingChat} variant="primary" onPress={handleSendChat}>
                          <Send className="size-4" />
                          <span>Send</span>
                        </Button>
                      </Modal.Footer>
                    </>
                  );
                })()}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Compose / reply form */}
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

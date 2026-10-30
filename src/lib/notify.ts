import { toast } from "@/hooks/useToast";
import { authedFetch } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export type EmailResult = "sent" | "not-configured" | "failed";

/** Sends one email through the POS mail route. Never throws; reports what happened. */
export async function sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
  if (!to) return "failed";
  try {
    const res = await authedFetch("/api/send-email", { method: "POST", body: JSON.stringify({ to, subject, body }) });
    const out = await res.json().catch(() => ({}));

    if (res.ok && out?.delivered) return "sent";
    if (res.ok && out?.delivered === false && !out?.error) return "not-configured";

    return "failed";
  } catch {
    return "failed";
  }
}

const shop = () => useAppStore.getState().settings.businessName || "the shop";
const sign = () => `\n\nThank you,\n${shop()}`;
const short = (id: string) => id.slice(0, 8).toUpperCase();

/** Emails the customer about a change and tells the owner how it went. */
export async function notifyCustomer(to: string, subject: string, body: string): Promise<void> {
  if (!to) return;
  const result = await sendEmail(to, subject, body);

  if (result === "sent") toast.success("Customer emailed", to);
  else if (result === "not-configured") toast.warning("Customer not emailed", "Email isn't set up yet. Add SMTP settings in Vercel and they'll go out automatically.");
  else toast.warning("Couldn't email the customer", "The status was saved, but the email didn't send.");
}

const READY_KEY = "novaops_email_ready";

/** Whether finishing a ticket automatically emails the customer that their device is ready (on by default). */
export const readyEmailEnabled = (): boolean => { try { return localStorage.getItem(READY_KEY) !== "off"; } catch { return true; } };
export const setReadyEmailEnabled = (on: boolean) => { try { localStorage.setItem(READY_KEY, on ? "on" : "off"); } catch { /* ignore */ } };

export const emails = {
  ticketReady: (name: string, device: string, ref: number) => ({ subject: `Your ${device || "device"} is ready for pickup`, body: `Hi ${name || "there"},

Good news: your ${device || "device"} (ticket #${ref}) is finished and ready for pickup. Bring this email or the ticket number when you come in.${sign()}` }),
  orderShipped: (name: string, id: string) => ({ subject: `Your order #${short(id)} has shipped`, body: `Hi ${name || "there"},\n\nGood news: your order #${short(id)} has shipped and is on its way.${sign()}` }),
  orderDelivered: (name: string, id: string) => ({ subject: `Your order #${short(id)} was delivered`, body: `Hi ${name || "there"},\n\nYour order #${short(id)} shows as delivered. If anything isn't right, just reply to this email.${sign()}` }),
  orderCancelled: (name: string, id: string) => ({ subject: `Your order #${short(id)} was cancelled`, body: `Hi ${name || "there"},\n\nYour order #${short(id)} has been cancelled. If you paid, we'll make sure you're refunded. Reply to this email with any questions.${sign()}` }),
  reviewRequest: (name: string, device: string, url: string) => ({ subject: "How did we do?", body: `Hi ${name || "there"},\n\nThanks for trusting us with your ${device || "device"}. If you have a minute, a quick review helps other people find us:\n\n${url}\n\nIf anything isn't right, just reply to this email and we'll make it right.${sign()}` }),
  bookingConfirmed: (name: string, service: string, when: string) => ({ subject: "Your repair appointment is confirmed", body: `Hi ${name || "there"},\n\nYour appointment for ${service} is confirmed for ${when}. See you then. If you need to change it, reply to this email or call us.${sign()}` }),
  bookingDeclined: (name: string, service: string, when: string) => ({ subject: "About your repair appointment", body: `Hi ${name || "there"},\n\nWe can't make ${service} work on ${when}. Please reply with another day and time that suits you, or call us and we'll find one.${sign()}` }),
};

import emailjs from "@emailjs/browser";

import { addNotification } from "@/hooks/useNotifications";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */

// One unified EmailJS template; every send carries all 21 variables so EmailJS never reports "broken dynamic elements".
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD");

export function useEmailNotifications() {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_CUSTOMER || "";

  const isConfigured = () => {
    const ok = !!(serviceId && publicKey && templateId);

    if (!ok) console.warn("[EmailJS] Missing config", { serviceId: !!serviceId, publicKey: !!publicKey, templateId: !!templateId });

    return ok;
  };

  const customer = (id: any) => useAppStore.getState().customers.find((c: any) => c.id === id) as any;

  const buildParams = (overrides: Record<string, string> = {}): Record<string, string> => ({
    to_email: "", customer_name: "", customer_phone: "", customer_address: "", device_name: "", issue_description: "",
    technician_name: useAppStore.getState().settings.businessName || "Our Team",
    ticket_number: "", ticket_date: "", year: String(new Date().getFullYear()),
    appointment_date: "", arrival_window: "", service_description: "",
    dispatch_date: "", vendor_name: "", estimated_return: "", estimated_completion: "",
    event_type: "", event_summary: "", event_timestamp: new Date().toLocaleString(), estimated_value: "", internal_notes: "",
    ...overrides,
  });

  const send = async (params: Record<string, string>) => {
    if (!isConfigured()) return;
    try {
      await emailjs.send(serviceId, templateId, params, publicKey);
      addNotification("Email sent", `Notification sent to ${params.to_email}`, "success");
    } catch (err: any) {
      console.error("[EmailJS] Send failed:", err?.text || err?.message || err);
      addNotification("Email notice", `Email could not be sent: ${err?.text || err?.message || "Unknown error"}`, "warning");
    }
  };

  const sendTicketEmail = async (ticket: any) => {
    const c = customer(ticket.customerId);

    if (!c?.email) return;
    await send(buildParams({
      to_email: c.email, customer_name: c.name || "Valued Customer", customer_phone: c.phone || "",
      ticket_number: String(ticket.id ?? ""), ticket_date: fmtDate(ticket.createdAt ?? ticket.created_at ?? new Date().toISOString()),
      device_name: ticket.device || "", issue_description: ticket.issue || "",
      estimated_completion: "We will contact you with an estimate", event_type: "New Ticket", event_summary: `Ticket #${ticket.id} created`,
    }));
  };

  const sendHousecallEmail = async (hc: any) => {
    const c = customer(hc.customerId);

    if (!c?.email) return;
    await send(buildParams({
      to_email: c.email, customer_name: c.name || "Valued Customer", customer_phone: c.phone || "",
      appointment_date: fmtDate(hc.date), arrival_window: hc.time || "TBD", customer_address: hc.address || "",
      service_description: hc.issue || hc.description || "", issue_description: hc.issue || "",
      event_type: "House Call", event_summary: "House call scheduled",
    }));
  };

  const sendVendorRepairEmail = async (vr: any) => {
    const c = customer(vr.customerId);

    if (!c?.email) return;
    await send(buildParams({
      to_email: c.email, customer_name: c.name || "Valued Customer", customer_phone: c.phone || "",
      ticket_number: vr.ticketRef || vr.ticket_ref || "", dispatch_date: fmtDate(vr.sentDate ?? vr.sent_date ?? new Date().toISOString()),
      device_name: vr.device || "", issue_description: vr.issue || "", vendor_name: vr.vendor || "Specialist Partner",
      estimated_return: fmtDate(vr.estReturn ?? vr.est_return), event_type: "Vendor Repair", event_summary: "Device sent to vendor for repair",
    }));
  };

  const sendInternalAlert = async (p: { eventType: string; eventSummary: string; customerName?: string; customerPhone?: string; deviceName?: string; issueDescription?: string; ticketNumber?: string; technicianName?: string; estimatedValue?: string; internalNotes?: string }) => {
    const { email, businessName } = useAppStore.getState().settings;

    if (!email) return;
    await send(buildParams({
      to_email: email, event_type: p.eventType, event_summary: p.eventSummary,
      customer_name: p.customerName || "", customer_phone: p.customerPhone || "", device_name: p.deviceName || "",
      issue_description: p.issueDescription || "", ticket_number: p.ticketNumber || "",
      technician_name: p.technicianName || businessName || "", estimated_value: p.estimatedValue || "", internal_notes: p.internalNotes || "",
    }));
  };

  return { isConfigured, sendTicketEmail, sendHousecallEmail, sendVendorRepairEmail, sendInternalAlert };
}

import { useEffect, useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Textarea } from "@/components/arc/textarea/textarea";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { toast } from "@/hooks/useToast";
import { printHousecall } from "@/lib/print";
import { useAppStore, type HouseCall } from "@/lib/store";
import { formatDate } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];
const EMPTY = { customerId: "", address: "", date: "", time: "", issue: "", status: "Scheduled" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCall?: (HouseCall & Record<string, any>) | null;
  onSaved?: () => void;
}

export function HouseCallDialog({ open, onOpenChange, editingCall, onSaved }: Props) {
  const customers = useAppStore((s) => s.customers);
  const settings = useAppStore((s) => s.settings);
  const { sendHousecallEmail, sendInternalAlert } = useEmailNotifications();
  const [form, setForm] = useState(EMPTY);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setForm(editingCall ? { customerId: String(editingCall.customerId ?? ""), address: editingCall.address || "", date: editingCall.date || "", time: editingCall.time || "", issue: (editingCall as any).issue || editingCall.description || "", status: editingCall.status || "Scheduled" } : EMPTY);
  }, [open, editingCall]);

  // Address autocomplete via OpenStreetMap, debounced.
  useEffect(() => {
    const q = form.address.trim();

    if (!open || q.length < 4) return setSuggestions([]);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us,ca`);

        setSuggestions(await res.json());
      } catch { /* suggestions are optional */ }
    }, 600);

    return () => clearTimeout(t);
  }, [form.address, open]);

  const customerName = (id: string) => customers.find((c) => String(c.id) === id)?.name || "Unknown";
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.customerId) return toast.warning("Choose a customer first");
    setSaving(true);
    try {
      const payload = { ...form, customerId: Number(form.customerId), description: form.issue };
      const isNew = !editingCall;
      const { createHouseCall, updateHouseCall } = useAppStore.getState();

      if (editingCall) await updateHouseCall(editingCall.id, payload);
      else await createHouseCall(payload);

      toast.success(isNew ? "House call scheduled" : "House call updated");
      if (isNew) {
        void sendHousecallEmail(payload);
        void sendInternalAlert({ eventType: "House Call", eventSummary: "New house call scheduled", customerName: customerName(form.customerId), issueDescription: form.issue });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.danger("Could not save house call", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const print = () => {
    const c = customers.find((x) => String(x.id) === form.customerId);
    let time = form.time || "TBD";

    if (form.time.includes(":")) {
      const [h, m] = form.time.split(":");

      time = `${Number(h) % 12 || 12}:${m} ${Number(h) >= 12 ? "PM" : "AM"}`;
    }
    printHousecall({
      businessName: settings.businessName || "NovaOps", businessAddress: settings.address, businessPhone: settings.phone,
      customerName: c?.name || "Unknown", customerPhone: c?.phone || "", customerEmail: c?.email || "",
      serviceAddress: form.address, date: form.date ? formatDate(form.date) : "TBD", time,
      issue: form.issue || "No details provided.", status: form.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editingCall ? "Edit house call" : "New house call"} description="Schedule an on-site visit">
        <div className="nv-form">
          <Select label="Customer" placeholder="Choose a customer" value={form.customerId} onValueChange={set("customerId")} options={customers.map((c) => ({ value: String(c.id), label: c.name }))} />
          <Input label="Service address" value={form.address} onChange={(e) => set("address")(e.target.value)} />
          {suggestions.length > 0 && (
            <div className="nv-stack">
              {suggestions.map((s) => (
                <Button key={s.place_id} variant="ghost" size="sm" onClick={() => { set("address")(s.display_name); setSuggestions([]); }}>{s.display_name}</Button>
              ))}
            </div>
          )}
          <div className="nv-form-row">
            <Input label="Date" type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
            <Input label="Time" type="time" value={form.time} onChange={(e) => set("time")(e.target.value)} />
          </div>
          <Select label="Status" value={form.status} onValueChange={set("status")} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          <Textarea label="What needs doing" rows={3} value={form.issue} onChange={(e) => set("issue")(e.target.value)} />
          <div className="nv-actions" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={print}>Print</Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editingCall ? "Save changes" : "Schedule"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


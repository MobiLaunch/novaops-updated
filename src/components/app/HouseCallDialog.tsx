import { useEffect, useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Textarea } from "@/components/arc/textarea/textarea";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { printHousecall } from "@/lib/print";
import { useAppStore, type HouseCall } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];
/** OpenStreetMap embed for a geocoded result (bounding box + marker). */
export const osmEmbed = (pt: any) => { const [lat1, lat2, lon1, lon2] = pt.boundingbox || [Number(pt.lat) - 0.005, Number(pt.lat) + 0.005, Number(pt.lon) - 0.005, Number(pt.lon) + 0.005]; return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${pt.lat}%2C${pt.lon}`; };
export const osmCache = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem("osm_cache") || "{}"); } catch { return {}; } };

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
  const [map, setMap] = useState("");
  const [calc, setCalc] = useState({ labor: 0, parts: 0, travel: 0, taxRate: 0 });
  const [estimate, setEstimate] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setCalc({ labor: 0, parts: 0, travel: 0, taxRate: 0 });
    setEstimate(0);
    setMap("");
    setForm(editingCall ? { customerId: String(editingCall.customerId ?? ""), address: editingCall.address || "", date: editingCall.date || "", time: editingCall.time || "", issue: (editingCall as any).issue || editingCall.description || "", status: editingCall.status || "Scheduled" } : EMPTY);
  }, [open, editingCall]);

  useEffect(() => {
    if (!open) return;

    const cached = osmCache()[editingCall?.address || ""];

    setMap(cached ? osmEmbed(cached) : "");
  }, [open, editingCall]);

  // Address autocomplete via OpenStreetMap, debounced.
  useEffect(() => {
    const q = form.address.trim();

    if (!open || q.length < 4) { setSuggestions([]); setMap(""); return; }
    const hit = osmCache()[q];

    if (hit) { setMap(osmEmbed(hit)); setSuggestions([]); return; }

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
      if (isNew) addNotification("House call scheduled", `${customerName(form.customerId)} · ${form.date}`, "info", "appointment");
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
      issue: form.issue || "No details provided.", status: form.status, estimate: estimate ? formatCurrency(estimate, settings.currency || "$") : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nv-wide" title={editingCall ? "Edit house call" : "New house call"} description="Schedule an on-site visit">
        <div className="nv-form">
          <Select label="Customer" placeholder="Choose a customer" value={form.customerId} onValueChange={set("customerId")} options={customers.map((c) => ({ value: String(c.id), label: c.name }))} />
          <Input label="Service address" value={form.address} onChange={(e) => set("address")(e.target.value)} />
          {suggestions.length > 0 && (
            <div className="nv-stack">
              {suggestions.map((s) => (
                <Button key={s.place_id} variant="ghost" size="sm" onClick={() => { const cache = osmCache(); cache[s.display_name] = { lat: s.lat, lon: s.lon, boundingbox: s.boundingbox }; try { localStorage.setItem("osm_cache", JSON.stringify(cache)); } catch { /* ignore */ } set("address")(s.display_name); setSuggestions([]); setMap(osmEmbed(s)); }}>{s.display_name}</Button>
              ))}
            </div>
          )}
          {map && <iframe src={map} title="Map preview" style={{ width: "100%", height: 160, border: 0, borderRadius: 10 }} />}
          {form.address && <div><Button size="sm" variant="ghost" onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(form.address)}`, "_blank")}>Open in maps</Button></div>}
          <div className="nv-form-row">
            <Input label="Date" type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
            <Input label="Time" type="time" value={form.time} onChange={(e) => set("time")(e.target.value)} />
          </div>
          <Select label="Status" value={form.status} onValueChange={set("status")} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          <div className="nv-panel nv-stack" style={{ padding: 14 }}>
            <strong style={{ fontWeight: 500 }}>Estimate</strong>
            <div className="nv-form-row">
              <Input label="Labor" type="number" min={0} value={calc.labor} onChange={(e) => setCalc({ ...calc, labor: Number(e.target.value) })} />
              <Input label="Parts" type="number" min={0} value={calc.parts} onChange={(e) => setCalc({ ...calc, parts: Number(e.target.value) })} />
            </div>
            <div className="nv-form-row">
              <Input label="Travel" type="number" min={0} value={calc.travel} onChange={(e) => setCalc({ ...calc, travel: Number(e.target.value) })} />
              <Input label="Tax rate (%)" type="number" min={0} step="0.01" value={calc.taxRate} onChange={(e) => setCalc({ ...calc, taxRate: Number(e.target.value) })} />
            </div>
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <span>Total {formatCurrency((calc.labor + calc.parts + calc.travel) * (1 + calc.taxRate / 100), settings.currency || "$")}</span>
              <Button size="sm" variant="secondary" onClick={() => setEstimate((calc.labor + calc.parts + calc.travel) * (1 + calc.taxRate / 100))}>{estimate ? `Estimate set: ${formatCurrency(estimate, settings.currency || "$")}` : "Use as estimate"}</Button>
            </div>
          </div>
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


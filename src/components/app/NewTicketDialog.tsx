import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Gamepad2, Headphones, Laptop, Monitor, Smartphone, Tablet, Watch } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { Input } from "@/components/arc/input/input";
import { RadioCards } from "@/components/arc/radio-cards/radio-cards";
import { SegmentedControl } from "@/components/arc/segmented-control/segmented-control";
import { Stepper } from "@/components/arc/stepper/stepper";
import { Textarea } from "@/components/arc/textarea/textarea";
import { CustomerSelect } from "@/components/app/CustomerSelect";
import { SignatureCapture } from "@/components/app/SignatureCapture";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { getSupabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { createTicketWithPhotos } from "@/lib/tickets";

/* eslint-disable @typescript-eslint/no-explicit-any */
const BRANDS = ["Apple", "Samsung", "Google", "Sony", "LG", "Microsoft", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Huawei", "OnePlus", "Motorola", "Nokia", "Xiaomi", "Oppo", "Vivo", "Realme", "Nothing"];
const CATEGORIES = [
  { label: "Smartphone", icon: Smartphone }, { label: "Tablet", icon: Tablet }, { label: "Laptop", icon: Laptop }, { label: "Desktop", icon: Monitor },
  { label: "Smartwatch", icon: Watch }, { label: "Gaming", icon: Gamepad2 }, { label: "Headphones", icon: Headphones }, { label: "Camera", icon: Camera },
];
const ISSUES = [
  ["Cracked screen", "Display is cracked or damaged"], ["Battery issues", "Won't charge or drains quickly"], ["Water damage", "Exposed to liquid"],
  ["Won't turn on", "Device is unresponsive"], ["Audio problems", "Speaker or microphone issues"], ["WiFi or connectivity", "Network connection problems"],
  ["Physical damage", "Dents, bends or broken parts"], ["Other", "Describe it below"],
];
const STEPS = [{ id: "brand", label: "Brand" }, { id: "type", label: "Type" }, { id: "model", label: "Model" }, { id: "issue", label: "Issue" }, { id: "details", label: "Details" }];

interface Props { open: boolean; onOpenChange: (o: boolean) => void; presetCustomerId?: number | null }

const EMPTY = { brand: "", category: "", model: "", issue: "", customIssue: "", customerId: null as number | null, description: "", serial: "", priority: "normal", signature: "" };

export function NewTicketDialog({ open, onOpenChange, presetCustomerId }: Props) {
  const customers = useAppStore((s) => s.customers);
  const { sendTicketEmail, sendInternalAlert } = useEmailNotifications();
  const [step, setStep] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [otherBrand, setOtherBrand] = useState(false);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbModels, setDbModels] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setF({ ...EMPTY, customerId: presetCustomerId ?? null });
    setPhotos([]);
    setOtherBrand(false);
    const sb = getSupabase();

    void sb?.from("devices").select("brand").order("brand").then(({ data }) => setDbBrands([...new Set((data || []).map((r: any) => String(r.brand)))]));
  }, [open, presetCustomerId]);

  // Models for the chosen brand and type, from the shared devices table.
  useEffect(() => {
    const sb = getSupabase();

    if (!sb || !f.brand || !f.category) return setDbModels([]);
    void sb.from("devices").select("name").eq("brand", f.brand).eq("category", f.category).order("name").then(({ data }) => setDbModels((data || []).map((r: any) => r.name)));
  }, [f.brand, f.category]);

  const brands = useMemo(() => [...new Set([...BRANDS, ...dbBrands])].sort(), [dbBrands]);
  const canNext = [!!f.brand, !!f.category, !!f.model.trim(), !!(f.issue && (f.issue !== "Other" || f.customIssue.trim()))][step] ?? false;

  const create = async () => {
    if (!f.customerId) return toast.warning("Choose a customer first");
    setSaving(true);

    const id = toast.loading("Creating ticket…");

    try {
      const issue = f.issue === "Other" ? f.customIssue.trim() : f.issue + (f.customIssue.trim() ? ` – ${f.customIssue.trim()}` : "");
      const ticket = await createTicketWithPhotos({
        device: f.brand, deviceModel: f.model.trim(), issue, customerId: f.customerId,
        deviceDescription: f.description, serialNumber: f.serial, priority: f.priority, signature: f.signature, photos,
      });
      const c = customers.find((x) => x.id === f.customerId);

      if (id) toast.dismiss(id);
      toast.success("Ticket created", `Ticket #${ticket.id}`);
      addNotification("New ticket", `Ticket #${ticket.id} for ${c?.name || "customer"}`, "success");
      void sendTicketEmail({ ...ticket, customerId: f.customerId });
      void sendInternalAlert({ eventType: "New Ticket", eventSummary: `Ticket #${ticket.id} created`, customerName: c?.name, customerPhone: c?.phone, deviceName: f.brand, issueDescription: issue, ticketNumber: String(ticket.id) });
      onOpenChange(false);
    } catch (e) {
      if (id) toast.dismiss(id);
      toast.danger("Could not create ticket", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onFiles = (files: File[]) => setPhotos(files);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nv-wide" title="New ticket" description="Check in a device for repair">
        <div className="nv-form">
          <Stepper steps={STEPS} current={step} onStepSelect={setStep} details="current" />

          {step === 0 && (
            <>
              <RadioCards layout="grid" minColumnWidth={110} value={otherBrand ? "__other" : f.brand} onValueChange={(v) => { if (v === "__other") { setOtherBrand(true); set("brand", ""); } else { setOtherBrand(false); set("brand", v); setStep(1); } }}
                options={[...brands.map((b) => ({ value: b, label: b })), { value: "__other", label: "Other" }]} />
              {otherBrand && (
                <div className="nv-actions">
                  <Input label="Brand name" value={f.brand} onChange={(e) => set("brand", e.target.value)} />
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <RadioCards layout="grid" minColumnWidth={130} value={f.category} onValueChange={(v) => { set("category", v); setStep(2); }}
              options={CATEGORIES.map((c) => ({ value: c.label, label: c.label, icon: <c.icon size={16} /> }))} />
          )}

          {step === 2 && (
            <>
              {dbModels.length > 0 && (
                <RadioCards layout="list" value={f.model} onValueChange={(v) => set("model", v)} options={dbModels.slice(0, 40).map((m) => ({ value: m, label: m }))} />
              )}
              <Input label={dbModels.length ? "Or type a model" : "Model"} value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="iPhone 15 Pro" />
            </>
          )}

          {step === 3 && (
            <>
              <RadioCards layout="grid" minColumnWidth={180} value={f.issue} onValueChange={(v) => set("issue", v)} options={ISSUES.map(([label, description]) => ({ value: label, label, description }))} />
              <Input label={f.issue === "Other" ? "Describe the issue" : "Extra detail (optional)"} value={f.customIssue} onChange={(e) => set("customIssue", e.target.value)} />
            </>
          )}

          {step === 4 && (
            <>
              <CustomerSelect value={f.customerId} onChange={(v) => set("customerId", v)} />
              <div className="nv-form-row">
                <Input label="Serial or IMEI" value={f.serial} onChange={(e) => set("serial", e.target.value)} />
                <SegmentedControl label="Priority" value={f.priority} onValueChange={(v: string) => set("priority", v)} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }]} />
              </div>
              <Textarea label="Condition notes" rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} />
              <FileDropzone accept="image/*" maxFiles={6} label="Photos" description="Drop photos of the device" onFilesChange={onFiles} />
              <SignatureCapture value={f.signature} onChange={(v) => set("signature", v)} />
            </>
          )}

          <div className="nv-actions" style={{ justifyContent: "space-between" }}>
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={14} />Back</Button> : <span />}
            <div className="nv-actions">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step < 4 ? <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Next</Button> : <Button onClick={create} loading={saving} disabled={!f.customerId}>Create ticket</Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

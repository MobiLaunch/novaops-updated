import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { ChipGroup } from "@/components/arc/chip-group/chip-group";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { RadioCards } from "@/components/arc/radio-cards/radio-cards";
import { Select } from "@/components/arc/select/select";
import { Stepper } from "@/components/arc/stepper/stepper";
import { Switch } from "@/components/arc/switch/switch";
import { Textarea } from "@/components/arc/textarea/textarea";
import { CustomerSelect } from "@/components/app/CustomerSelect";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { getDocuments } from "@/lib/documents";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const BRANDS = ["Apple", "Samsung", "Google", "Sony", "LG", "Microsoft", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Huawei", "OnePlus", "Motorola", "Nokia", "Xiaomi", "Oppo"];
const STORAGE = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const GRADES = [
  { value: "Excellent", label: "Excellent", description: "Like new, minimal use" },
  { value: "Good", label: "Good", description: "Normal wear, fully functional" },
  { value: "Fair", label: "Fair", description: "Visible wear, works fine" },
  { value: "Poor", label: "Poor", description: "Heavy damage or issues" },
];
const SCREENS = [
  { value: "Perfect", label: "Perfect", description: "No scratches or damage" },
  { value: "Minor Scratches", label: "Minor scratches", description: "Light marks, visible in light" },
  { value: "Cracked", label: "Cracked", description: "Cracked but touchscreen works" },
  { value: "Shattered", label: "Shattered", description: "Severely broken, touch issues" },
];
const AGES = [{ value: "0.5", label: "Under 1 year" }, { value: "1", label: "1 year" }, { value: "2", label: "2 years" }, { value: "3", label: "3 years" }, { value: "4", label: "4 years" }, { value: "5", label: "5+ years" }];
const FUNCTIONAL = [["wont_turn_on", "Won't turn on"], ["charging_port", "Charging port"], ["battery_dead", "Battery dead"], ["camera", "Camera issues"], ["speaker", "Speaker or mic"], ["wifi_bt", "WiFi or Bluetooth"], ["face_id", "Face or Touch ID"], ["water_damage", "Water damage"], ["buttons", "Buttons broken"]].map(([value, label]) => ({ value, label }));
const COSMETIC = [["back_cracked", "Back glass cracked"], ["dents", "Dents or bends"], ["scratches", "Deep scratches"], ["camera_lens", "Camera lens crack"], ["missing_parts", "Missing parts"]].map(([value, label]) => ({ value, label }));
const ACCESSORIES = [["original_box", "Original box"], ["charger", "Charger or cable"], ["earphones", "Earphones"], ["case", "Case"]].map(([value, label]) => ({ value, label }));

// Deduction weights, as a share of market price
const GRADE_DED: Record<string, number> = { Excellent: 0.05, Good: 0.15, Fair: 0.3, Poor: 0.5 };
const SCREEN_DED: Record<string, number> = { Perfect: 0, "Minor Scratches": 0.05, Cracked: 0.15, Shattered: 0.28 };
const FUNCTIONAL_COST = 25, COSMETIC_COST = 10, LOCK_PENALTY = 0.4, AGE_PER_YR = 0.06;
const ACCESSORY_VALUE: Record<string, number> = { original_box: 8, charger: 6, earphones: 5, case: 3 };

const blank = () => ({
  customerId: null as number | null, brand: "", model: "", modelNumber: "", imei: "", storage: "", color: "",
  marketPrice: null as number | null, grade: "Good", age: 1, screen: "Perfect", battery: 80,
  functional: [] as string[], cosmetic: [] as string[], accessories: [] as string[],
  icloudLocked: false, frpLocked: false, repairCost: 0, offer: 0, notes: "",
});

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSaved?: () => void }

export function TradeInWizard({ open, onOpenChange, onSaved }: Props) {
  const currency = useAppStore((s) => s.settings.currency || "$");
  const [step, setStep] = useState(0);
  const [f, setF] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookup, setLookup] = useState<{ ebay: number; swappa: number; median: number; note: string } | null>(null);
  const [resolved, setResolved] = useState("");
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (open) { setF(blank()); setStep(0); setLookup(null); setLookupError(""); setResolved(""); }
  }, [open]);

  const market = f.marketPrice ?? lookup?.median ?? 0;
  const calc = useMemo(() => {
    let ded = 0;

    if (market) {
      ded += market * (GRADE_DED[f.grade] || 0);
      ded += market * (SCREEN_DED[f.screen] || 0);
      ded += market * Math.min(f.age * AGE_PER_YR, 0.4);
      ded += ((100 - f.battery) / 100) * market * 0.15;
      ded += f.functional.length * FUNCTIONAL_COST + f.cosmetic.length * COSMETIC_COST;
      if (f.icloudLocked || f.frpLocked) ded += market * LOCK_PENALTY;
      ded = Math.min(ded, market * 0.92);
    }

    const bonus = f.accessories.reduce((s, a) => s + (ACCESSORY_VALUE[a] || 0), 0);
    const offer = Math.max(Math.round((market - ded - (f.repairCost || 0) + bonus) * 2) / 2, 0);
    const resale = Math.max(market - ded * 0.3, offer + 20);
    const final = f.offer || offer;
    const profit = resale - final - (f.repairCost || 0);

    return { offer, resale, profit, margin: resale ? (profit / resale) * 100 : 0 };
  }, [f, market]);

  const canNext = step === 0 ? !!f.brand && !!f.model : true;

  const imeiOk = (v: string) => {
    const d = v.replace(/\D/g, "");

    if (d.length !== 15) return true;

    let sum = 0;

    for (let i = 0; i < 15; i++) {
      let n = Number(d[i]);

      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }

    return sum % 10 === 0;
  };

  const fetchPrice = async () => {
    if (!(f.brand || f.model || f.imei || f.modelNumber) || looking) return;
    if (f.imei && !imeiOk(f.imei)) return setLookupError("IMEI check digit is invalid. Double-check the number.");
    setLooking(true);
    setLookupError("");
    setLookup(null);
    setResolved("");
    try {
      const res = await fetch("/api/trade-in/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: f.brand || undefined, model: f.model || undefined, storage: f.storage || undefined, imei: f.imei || undefined, model_number: f.modelNumber || undefined }),
      });
      const r = await res.json();

      if (!res.ok || !r.ok) return setLookupError(`${r.error || r.message || "Lookup failed"}. Enter the market price manually.`);
      setF((s) => ({ ...s, brand: s.brand || r.resolved_brand || "", model: s.model || r.resolved_model || "", storage: s.storage || r.resolved_storage || "", marketPrice: s.marketPrice ?? r.median }));
      if (r.lookup_method !== "name") setResolved(`${r.resolved_brand || ""} ${r.resolved_model || ""} found by ${r.lookup_method === "imei" ? "IMEI" : "model number"}`.trim());
      setLookup({ ebay: r.ebay_avg, swappa: r.swappa_avg, median: r.median, note: r.source_note });
    } catch (e) {
      setLookupError(`${(e as Error).message || "Lookup failed"}. Enter the market price manually.`);
    } finally {
      setLooking(false);
    }
  };

  const save = async () => {
    const sb = getSupabase();
    const user = useAppStore.getState().user;

    if (!sb || !user) return toast.danger("Not signed in");

    const docs = getDocuments();
    const cust = useAppStore.getState().customers.find((c) => c.id === f.customerId);

    if (docs.tradeInRequireId && !cust?.driversLicense) return toast.warning("ID required", "Choose a customer with a driver's license on file.");
    setSaving(true);
    try {
      const { error } = await sb.from("trade_ins").insert({
        profile_id: user.id, customer_id: f.customerId, brand: f.brand, model: f.model, model_number: f.modelNumber, imei: f.imei,
        storage: f.storage, color: f.color, condition_grade: f.grade, age_years: f.age, screen_condition: f.screen, battery_health: f.battery,
        functional_issues: f.functional, cosmetic_issues: f.cosmetic, accessories: f.accessories, icloud_locked: f.icloudLocked, frp_locked: f.frpLocked,
        market_price: market || null, repair_cost_est: f.repairCost || 0, offer_price: f.offer || calc.offer,
        estimated_resale: calc.resale, estimated_profit: calc.profit, status: "Pending", notes: f.notes,
      });

      if (error) throw error;
      onSaved?.();
    } catch (e) {
      toast.danger("Could not save trade-in", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const m = (n: number) => formatCurrency(n, currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nv-wide" title="Trade-in evaluation" description="Assess a device and calculate an offer">
        <div className="nv-form">
          {!getDocuments().tradeInEnabled && <Alert tone="warning" title="Trade-ins are turned off in Settings → Documents" />}
          <Stepper steps={[{ id: "id", label: "Device" }, { id: "cond", label: "Condition" }, { id: "iss", label: "Issues" }, { id: "offer", label: "Offer" }]} current={step} onStepSelect={setStep} details="current" />

          {step === 0 && (
            <>
              <CustomerSelect value={f.customerId} onChange={(v) => set("customerId", v)} label="Customer (optional)" />
              <div className="nv-form-row">
                <Select label="Brand" value={f.brand} onValueChange={(v) => set("brand", v)} options={BRANDS.map((b) => ({ value: b, label: b }))} placeholder="Choose a brand" />
                <Input label="Model" value={f.model} onChange={(e) => set("model", e.target.value)} />
              </div>
              <div className="nv-form-row">
                <Input label="IMEI" inputMode="numeric" value={f.imei} onChange={(e) => set("imei", e.target.value)} />
                <Input label="Model number" value={f.modelNumber} onChange={(e) => set("modelNumber", e.target.value)} />
              </div>
              <div className="nv-form-row">
                <Select label="Storage" value={f.storage} onValueChange={(v) => set("storage", v)} options={STORAGE.map((s) => ({ value: s, label: s }))} placeholder="Choose storage" />
                <Input label="Color" value={f.color} onChange={(e) => set("color", e.target.value)} />
              </div>
              <div className="nv-form-row">
                <Input label="Market price" type="number" min={0} step="0.01" value={f.marketPrice ?? ""} onChange={(e) => set("marketPrice", e.target.value === "" ? null : Number(e.target.value))} />
                <div className="nv-stack" style={{ justifyContent: "flex-end" }}>
                  <Button variant="secondary" onClick={fetchPrice} loading={looking}>Look up market price</Button>
                </div>
              </div>
              {lookupError && <Alert tone="warning" title={lookupError} />}
              {resolved && <Alert tone="info" title={resolved} />}
              {lookup && <Alert tone="success" title={`Median ${m(lookup.median)} (eBay ${m(lookup.ebay)}, Swappa ${m(lookup.swappa)})`}>{lookup.note}</Alert>}
            </>
          )}

          {step === 1 && (
            <>
              <RadioCards layout="grid" minColumnWidth={170} value={f.grade} onValueChange={(v) => set("grade", v)} options={GRADES} />
              <RadioCards layout="grid" minColumnWidth={170} value={f.screen} onValueChange={(v) => set("screen", v)} options={SCREENS} />
              <div className="nv-form-row">
                <Select label="Device age" value={String(f.age)} onValueChange={(v) => set("age", Number(v))} options={AGES} />
                <Input label={`Battery health (${f.battery}%)`} type="number" min={0} max={100} value={f.battery} onChange={(e) => set("battery", Math.min(100, Math.max(0, Number(e.target.value))))} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <ChipGroup label="Functional issues" multiple options={FUNCTIONAL} value={f.functional} onValueChange={(v) => set("functional", v)} />
              <ChipGroup label="Cosmetic issues" multiple options={COSMETIC} value={f.cosmetic} onValueChange={(v) => set("cosmetic", v)} />
              <ChipGroup label="Included accessories" multiple options={ACCESSORIES} value={f.accessories} onValueChange={(v) => set("accessories", v)} />
              <div className="nv-form-row">
                <Switch label="iCloud locked" checked={f.icloudLocked} onCheckedChange={(v: boolean) => set("icloudLocked", v)} />
                <Switch label="FRP locked" checked={f.frpLocked} onCheckedChange={(v: boolean) => set("frpLocked", v)} />
              </div>
              <Input label="Estimated repair cost" type="number" min={0} step="0.01" value={f.repairCost} onChange={(e) => set("repairCost", Number(e.target.value))} />
            </>
          )}

          {step === 3 && (
            <>
              <div className="nv-grid cols-3">
                <div className="nv-panel"><div className="nv-muted">Suggested offer</div><div style={{ fontSize: 22, fontWeight: 500 }}>{m(calc.offer)}</div></div>
                <div className="nv-panel"><div className="nv-muted">Estimated resale</div><div style={{ fontSize: 22, fontWeight: 500 }}>{m(calc.resale)}</div></div>
                <div className="nv-panel"><div className="nv-muted">Estimated profit</div><div style={{ fontSize: 22, fontWeight: 500 }}>{m(calc.profit)} <span className="nv-muted" style={{ fontSize: 13 }}>{calc.margin.toFixed(0)}%</span></div></div>
              </div>
              <Input label="Offer to customer" type="number" min={0} step="0.5" value={f.offer || calc.offer} onChange={(e) => set("offer", Number(e.target.value))} />
              {getDocuments().tradeInPolicy && <Alert tone="info" title="Trade-in policy">{getDocuments().tradeInPolicy}</Alert>}
              <Textarea label="Notes" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
            </>
          )}

          <div className="nv-actions" style={{ justifyContent: "space-between" }}>
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button> : <span />}
            <div className="nv-actions">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step < 3 ? <Button onClick={() => { if (step === 2) set("offer", calc.offer); setStep(step + 1); }} disabled={!canNext}>Next</Button> : <Button onClick={save} loading={saving}>Save trade-in</Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

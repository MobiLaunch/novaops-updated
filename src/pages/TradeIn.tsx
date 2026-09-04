import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { Eye, Loader2, Repeat, Search, Smartphone } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { TradeIn } from "@/types/domain";
import { sbCreateTradeIn, sbFetchTradeIns, sbUpdateTradeIn } from "@/lib/supabase";

// Deduction weights (% of market price) — ported verbatim from the original
// TradeInWizard.vue pricing model so quoted offers don't silently change.
const GRADE_DEDUCTIONS: Record<string, number> = { Excellent: 0.05, Good: 0.15, Fair: 0.3, Poor: 0.5 };
const SCREEN_DEDUCTIONS: Record<string, number> = { Perfect: 0, "Minor Scratches": 0.05, Cracked: 0.15, Shattered: 0.28 };
const FUNCTIONAL_ISSUE_COST = 25;
const COSMETIC_ISSUE_COST = 10;
const LOCK_PENALTY = 0.4;
const AGE_DEDUCTION_PER_YR = 0.06;
const ACCESSORY_VALUES: Record<string, number> = { original_box: 8, charger: 6, earphones: 5, case: 3 };

const CONDITION_GRADES = ["Excellent", "Good", "Fair", "Poor"];
const SCREEN_CONDITIONS = ["Perfect", "Minor Scratches", "Cracked", "Shattered"];
const FUNCTIONAL_ISSUES = [
  { value: "wont_turn_on", label: "Won't Turn On" },
  { value: "charging_port", label: "Charging Port" },
  { value: "battery_dead", label: "Battery Dead" },
  { value: "camera", label: "Camera Issues" },
  { value: "speaker", label: "Speaker/Mic" },
  { value: "wifi_bt", label: "WiFi/Bluetooth" },
  { value: "face_id", label: "Face/Touch ID" },
  { value: "water_damage", label: "Water Damage" },
  { value: "buttons", label: "Buttons Broken" },
];
const COSMETIC_ISSUES = [
  { value: "back_cracked", label: "Back Glass Cracked" },
  { value: "dents", label: "Dents / Bends" },
  { value: "scratches", label: "Deep Scratches" },
  { value: "camera_lens", label: "Camera Lens Crack" },
  { value: "missing_parts", label: "Missing Parts" },
];
const ACCESSORIES = [
  { value: "original_box", label: "Original Box" },
  { value: "charger", label: "Charger/Cable" },
  { value: "earphones", label: "Earphones" },
  { value: "case", label: "Case" },
];
const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-warning/15 text-warning",
  Accepted: "bg-success/15 text-success",
  Declined: "bg-danger/15 text-danger",
  Completed: "bg-accent-soft text-accent",
};

interface LookupResult {
  ebay_avg: number;
  swappa_avg: number;
  median: number;
  source_note: string;
  lookup_method: string;
}

const emptyForm = {
  brand: "",
  model: "",
  model_number: "",
  imei: "",
  storage: "",
  color: "",
  condition_grade: "Good",
  age_years: 1,
  screen_condition: "Perfect",
  battery_health: 80,
  functional_issues: [] as string[],
  cosmetic_issues: [] as string[],
  accessories: [] as string[],
  icloud_locked: false,
  frp_locked: false,
  notes: "",
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function TradeInPage() {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [offerOverride, setOfferOverride] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<TradeIn | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchTradeIns();

    setLoading(false);
    if (data) setTradeIns(data);
  };

  useEffect(() => {
    load();
  }, []);

  const effectiveMarketPrice = marketPrice ?? lookup?.median ?? 0;

  const deductions = useMemo(() => {
    const mp = effectiveMarketPrice;

    if (!mp) return 0;
    let d = 0;

    d += mp * (GRADE_DEDUCTIONS[form.condition_grade] || 0);
    d += mp * (SCREEN_DEDUCTIONS[form.screen_condition] || 0);
    d += mp * Math.min(form.age_years * AGE_DEDUCTION_PER_YR, 0.4);
    d += ((100 - form.battery_health) / 100) * mp * 0.15;
    d += form.functional_issues.length * FUNCTIONAL_ISSUE_COST;
    d += form.cosmetic_issues.length * COSMETIC_ISSUE_COST;
    if (form.icloud_locked || form.frp_locked) d += mp * LOCK_PENALTY;

    return Math.min(d, mp * 0.92);
  }, [effectiveMarketPrice, form]);

  const accessoryBonus = form.accessories.reduce((sum, a) => sum + (ACCESSORY_VALUES[a] || 0), 0);
  const calculatedOffer = Math.max(Math.round((effectiveMarketPrice - deductions + accessoryBonus) * 2) / 2, 0);
  const offerPrice = offerOverride !== "" ? Number(offerOverride) || 0 : calculatedOffer;
  const estimatedResale = Math.max(effectiveMarketPrice - deductions * 0.3, offerPrice + 20);
  const estimatedProfit = estimatedResale - offerPrice;

  const handleLookup = async () => {
    if (!form.brand && !form.model && !form.imei && !form.model_number) return;
    setLooking(true);
    setLookupError(null);
    try {
      const res = await fetch("/api/trade-in/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          storage: form.storage,
          imei: form.imei,
          model_number: form.model_number,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setLookup(data);
        if (data.resolved_brand) setForm((f) => ({ ...f, brand: data.resolved_brand }));
        if (data.resolved_model) setForm((f) => ({ ...f, model: data.resolved_model }));
        if (data.resolved_storage) setForm((f) => ({ ...f, storage: data.resolved_storage }));
      } else {
        setLookupError(data.error || "No pricing data found.");
      }
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setLooking(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMarketPrice(null);
    setLookup(null);
    setLookupError(null);
    setOfferOverride("");
  };

  const handleSave = async () => {
    if (!form.brand.trim() && !form.model.trim()) return;
    setSaving(true);
    const { data } = await sbCreateTradeIn({
      ...form,
      market_price: effectiveMarketPrice || null,
      repair_cost_est: (form.functional_issues.length * FUNCTIONAL_ISSUE_COST + form.cosmetic_issues.length * COSMETIC_ISSUE_COST) || 0,
      offer_price: offerPrice,
      estimated_resale: estimatedResale,
      estimated_profit: estimatedProfit,
      status: "Pending",
    });

    setSaving(false);
    if (data) {
      setTradeIns((ts) => [data, ...ts]);
      setCreating(false);
      resetForm();
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setTradeIns((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selected?.id === id) setSelected((s) => s && { ...s, status });
    await sbUpdateTradeIn(id, { status });
  };

  const columns: DataTableColumn<TradeIn>[] = [
    {
      key: "device",
      header: "Device",
      render: (t) => (
        <div>
          <strong className="block text-sm text-foreground">
            {t.brand} {t.model}
          </strong>
          <span className="text-xs text-muted">{t.storage}</span>
        </div>
      ),
    },
    { key: "grade", header: "Condition", render: (t) => <span className="text-sm">{t.condition_grade}</span> },
    { key: "offer", header: "Offer", render: (t) => <span className="text-sm font-semibold">${Number(t.offer_price || 0).toFixed(2)}</span> },
    { key: "profit", header: "Est. Profit", render: (t) => <span className="text-sm text-success">${Number(t.estimated_profit || 0).toFixed(2)}</span> },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Select
          className={`w-[132px] rounded-full text-xs font-bold ${STATUS_STYLES[t.status] || "bg-surface-tertiary"}`}
          selectedKey={t.status}
          onSelectionChange={(key) => handleStatusChange(t.id, String(key))}
        >
          <Select.Trigger className="rounded-full border-0">
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {["Pending", "Accepted", "Declined", "Completed"].map((s) => (
                <ListBox.Item key={s} id={s}>
                  {s}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <Button isIconOnly aria-label="View trade-in" variant="ghost" onPress={() => setSelected(t)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        action={
          <Button variant="primary" onPress={() => setCreating(true)}>
            <Repeat className="size-4" />
            <span>New Trade-In</span>
          </Button>
        }
        description={`${tradeIns.length} trade-in${tradeIns.length !== 1 ? "s" : ""} evaluated`}
        eyebrow="Trade-Ins"
        title="Device Trade-In"
      />

      <DataTable
        ariaLabel="Trade-ins"
        columns={columns}
        data={tradeIns}
        emptyState={{
          icon: loading ? Loader2 : Smartphone,
          title: loading ? "Loading trade-ins…" : "No trade-ins yet",
          description: "Evaluate a customer's device to see it here.",
        }}
        rowKey={(t) => String(t.id)}
      />

      <Modal>
        <Modal.Backdrop
          isOpen={creating}
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              resetForm();
            }
          }}
        >
          <Modal.Container scroll="inside" size="lg">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New Trade-In Evaluation</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField className="flex flex-col gap-1.5" value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))}>
                    <Label>Brand</Label>
                    <InputGroup>
                      <InputGroup.Input placeholder="Apple" />
                    </InputGroup>
                  </TextField>
                  <TextField className="flex flex-col gap-1.5" value={form.model} onChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                    <Label>Model</Label>
                    <InputGroup>
                      <InputGroup.Input placeholder="iPhone 14 Pro" />
                    </InputGroup>
                  </TextField>
                  <TextField className="flex flex-col gap-1.5" value={form.imei} onChange={(v) => setForm((f) => ({ ...f, imei: v }))}>
                    <Label>IMEI (optional)</Label>
                    <InputGroup>
                      <InputGroup.Input />
                    </InputGroup>
                  </TextField>
                  <TextField className="flex flex-col gap-1.5" value={form.storage} onChange={(v) => setForm((f) => ({ ...f, storage: v }))}>
                    <Label>Storage</Label>
                    <InputGroup>
                      <InputGroup.Input placeholder="128GB" />
                    </InputGroup>
                  </TextField>
                </div>

                <Button isDisabled={looking} variant="outline" onPress={handleLookup}>
                  {looking ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  <span>{looking ? "Looking up market price…" : "Look Up Market Price"}</span>
                </Button>
                {lookupError && <p className="m-0 text-sm text-danger">{lookupError}</p>}
                {lookup && (
                  <div className="rounded-xl bg-surface-secondary/60 p-3 text-sm">
                    Market median: <strong>${lookup.median.toFixed(2)}</strong> — {lookup.source_note}
                  </div>
                )}
                <TextField className="flex flex-col gap-1.5" type="number" value={marketPrice !== null ? String(marketPrice) : ""} onChange={(v) => setMarketPrice(v ? Number(v) : null)}>
                  <Label>Market price override</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder={lookup ? lookup.median.toFixed(2) : "0.00"} />
                  </InputGroup>
                </TextField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select selectedKey={form.condition_grade} onSelectionChange={(k) => setForm((f) => ({ ...f, condition_grade: String(k) }))}>
                    <Label>Condition Grade</Label>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CONDITION_GRADES.map((g) => (
                          <ListBox.Item key={g} id={g}>
                            {g}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <Select selectedKey={form.screen_condition} onSelectionChange={(k) => setForm((f) => ({ ...f, screen_condition: String(k) }))}>
                    <Label>Screen Condition</Label>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {SCREEN_CONDITIONS.map((g) => (
                          <ListBox.Item key={g} id={g}>
                            {g}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <TextField className="flex flex-col gap-1.5" type="number" value={String(form.age_years)} onChange={(v) => setForm((f) => ({ ...f, age_years: Number(v) || 0 }))}>
                    <Label>Age (years)</Label>
                    <InputGroup>
                      <InputGroup.Input />
                    </InputGroup>
                  </TextField>
                  <TextField className="flex flex-col gap-1.5" type="number" value={String(form.battery_health)} onChange={(v) => setForm((f) => ({ ...f, battery_health: Number(v) || 0 }))}>
                    <Label>Battery Health (%)</Label>
                    <InputGroup>
                      <InputGroup.Input />
                    </InputGroup>
                  </TextField>
                </div>

                <div>
                  <span className="mb-2 block text-micro font-bold uppercase text-muted">Functional Issues</span>
                  <div className="flex flex-wrap gap-2">
                    {FUNCTIONAL_ISSUES.map((i) => (
                      <button
                        key={i.value}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          form.functional_issues.includes(i.value) ? "border-danger bg-danger/10 text-danger" : "border-border bg-surface text-muted"
                        }`}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, functional_issues: toggleValue(f.functional_issues, i.value) }))}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-micro font-bold uppercase text-muted">Cosmetic Issues</span>
                  <div className="flex flex-wrap gap-2">
                    {COSMETIC_ISSUES.map((i) => (
                      <button
                        key={i.value}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          form.cosmetic_issues.includes(i.value) ? "border-warning bg-warning/10 text-warning" : "border-border bg-surface text-muted"
                        }`}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cosmetic_issues: toggleValue(f.cosmetic_issues, i.value) }))}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-micro font-bold uppercase text-muted">Included Accessories</span>
                  <div className="flex flex-wrap gap-2">
                    {ACCESSORIES.map((i) => (
                      <button
                        key={i.value}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          form.accessories.includes(i.value) ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted"
                        }`}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, accessories: toggleValue(f.accessories, i.value) }))}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch isSelected={form.icloud_locked} onChange={(v) => setForm((f) => ({ ...f, icloud_locked: v }))}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                    iCloud Locked
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch isSelected={form.frp_locked} onChange={(v) => setForm((f) => ({ ...f, frp_locked: v }))}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                    FRP Locked (Google Lock)
                  </label>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <span className="block text-micro font-bold uppercase text-muted">Deductions</span>
                      <strong className="text-warning">-${deductions.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="block text-micro font-bold uppercase text-muted">Accessory Bonus</span>
                      <strong className="text-success">+${accessoryBonus.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="block text-micro font-bold uppercase text-muted">Est. Resale</span>
                      <strong>${estimatedResale.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="block text-micro font-bold uppercase text-muted">Est. Profit</span>
                      <strong className="text-success">${estimatedProfit.toFixed(2)}</strong>
                    </div>
                  </div>
                  <TextField className="mt-4 flex flex-col gap-1.5" type="number" value={offerOverride} onChange={setOfferOverride}>
                    <Label>Offer to Customer</Label>
                    <InputGroup>
                      <InputGroup.Input placeholder={calculatedOffer.toFixed(2)} />
                    </InputGroup>
                  </TextField>
                </div>

                <TextField className="flex flex-col gap-1.5" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))}>
                  <Label>Notes</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline"
                  onPress={() => {
                    setCreating(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleSave}>
                  {saving ? "Saving…" : "Save Trade-In"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              {selected && (
                <>
                  <Modal.Header>
                    <div>
                      <Chip className="mb-1.5" color="accent" size="sm" variant="soft">
                        <Chip.Label>Trade-In #{selected.id}</Chip.Label>
                      </Chip>
                      <Modal.Heading>
                        {selected.brand} {selected.model}
                      </Modal.Heading>
                    </div>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-secondary/60 p-4 text-sm">
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Offer</span>
                        <strong>${Number(selected.offer_price || 0).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Est. Profit</span>
                        <strong className="text-success">${Number(selected.estimated_profit || 0).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Condition</span>
                        <strong>{selected.condition_grade}</strong>
                      </div>
                      <div>
                        <span className="block text-micro font-bold uppercase text-muted">Screen</span>
                        <strong>{selected.screen_condition}</strong>
                      </div>
                      {selected.notes && (
                        <div className="col-span-2">
                          <span className="block text-micro font-bold uppercase text-muted">Notes</span>
                          <p className="m-0">{selected.notes}</p>
                        </div>
                      )}
                    </div>
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

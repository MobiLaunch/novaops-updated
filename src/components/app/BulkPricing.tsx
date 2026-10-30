import { useMemo, useState } from "react";
import { Percent } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Select } from "@/components/arc/select/select";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Mode = "percent" | "amount";
type Round = "none" | "half" | "dollar" | "ninety-nine";

const roundTo = (n: number, how: Round) => {
  if (how === "half") return Math.round(n * 2) / 2;
  if (how === "dollar") return Math.round(n);
  if (how === "ninety-nine") return Math.max(0.99, Math.floor(n) + 0.99);

  return Math.round(n * 100) / 100;
};

/** Raise or lower many service prices at once, with a preview. The website quotes from these prices, so it follows immediately. */
export function BulkPricing({ open, onOpenChange, services, cur }: { open: boolean; onOpenChange: (v: boolean) => void; services: any[]; cur: string }) {
  const [category, setCategory] = useState("all");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("percent");
  const [value, setValue] = useState("5");
  const [round, setRound] = useState<Round>("half");
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => [...new Set(services.map((s) => s.category || "Services"))].sort(), [services]);
  const delta = Number(value);

  const changes = useMemo(() => {
    if (!Number.isFinite(delta) || delta === 0) return [];

    return services
      .filter((s) => Number(s.price) > 0 && (category === "all" || (s.category || "Services") === category) && (!text.trim() || String(s.name).toLowerCase().includes(text.trim().toLowerCase())))
      .map((s) => {
        const raw = mode === "percent" ? Number(s.price) * (1 + delta / 100) : Number(s.price) + delta;

        return { id: s.id, name: s.name as string, from: Number(s.price), to: Math.max(0, roundTo(raw, round)) };
      })
      .filter((c) => c.to !== c.from);
  }, [services, category, text, mode, delta, round]);

  const apply = async () => {
    const st = useAppStore.getState();

    setBusy(true);
    try {
      for (let i = 0; i < changes.length; i += 15) {
        await Promise.all(changes.slice(i, i + 15).map((c) => st.updateService(c.id, { price: c.to })));
      }
      toast.success("Prices updated", `${changes.length} service${changes.length === 1 ? "" : "s"} changed. The website quotes the new prices right away.`);
      onOpenChange(false);
    } catch (e) {
      toast.danger("Stopped partway", `${(e as Error).message}. Some prices may already have changed.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Adjust service prices" description="Preview first. Nothing changes until you apply.">
        <div className="nv-form">
          <div className="nv-form-row">
            <Select label="Category" value={category} onValueChange={setCategory} options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
            <Input label="Name contains" placeholder="e.g. iPhone 15" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <SegmentedControl label="Adjust by" value={mode} onValueChange={(v) => setMode(v as Mode)} options={[{ value: "percent", label: "Percent" }, { value: "amount", label: `Amount (${cur})` }]} />
          <div className="nv-form-row">
            <Input label={mode === "percent" ? "Change (%)" : `Change (${cur})`} description="Use a minus sign to lower prices." step="0.5" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            <Select label="Round to" value={round} onValueChange={(v) => setRound(v as Round)} options={[{ value: "none", label: "Nearest cent" }, { value: "half", label: "Nearest 50 cents" }, { value: "dollar", label: "Nearest dollar" }, { value: "ninety-nine", label: "Ends in .99" }]} />
          </div>

          <div className="nv-panel" style={{ padding: "4px 16px", maxHeight: 220, overflow: "auto" }}>
            {changes.length === 0 ? <p className="nv-muted">No services would change with these settings.</p> : changes.slice(0, 8).map((c) => (
              <div key={c.id} className="nv-row"><span className="nv-row-main"><strong>{c.name}</strong></span><span className="nv-muted">{formatCurrency(c.from, cur)}</span><strong style={{ fontWeight: 500 }}>→ {formatCurrency(c.to, cur)}</strong></div>
            ))}
            {changes.length > 8 && <p className="nv-muted" style={{ margin: "8px 0" }}>and {changes.length - 8} more</p>}
          </div>

          <div className="nv-actions" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={changes.length === 0} loading={busy} onClick={apply}><Percent size={14} aria-hidden="true" />Apply to {changes.length} service{changes.length === 1 ? "" : "s"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

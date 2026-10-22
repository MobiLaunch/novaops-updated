import { useMemo, useState } from "react";
import { Package, Plus, Printer, Wrench } from "lucide-react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { SearchField } from "@/components/arc/search-field/search-field";
import { SegmentedControl } from "@/components/arc/segmented-control/segmented-control";
import { Select } from "@/components/arc/select/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { Textarea } from "@/components/arc/textarea/textarea";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { PageHead } from "@/components/app/PageHead";
import { TradeInWizard } from "@/components/app/TradeInWizard";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { printBarcodeBatch, printBarcodeLabel } from "@/lib/print";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
const PRODUCT_CATEGORIES = ["Parts", "Tools", "Accessories", "Devices"];
const SERVICE_CATEGORIES = ["Services", "Repairs", "Diagnostics", "Labor", "Apple Repairs", "Samsung Repairs", "Google Repairs", "House Calls", "Data Services"];
const blank = () => ({ name: "", sku: "", category: "Parts", description: "", price: 0, cost: 0, stock: 0, low: 5, estimated_minutes: 60, itemType: "product" as "product" | "service" });

export default function Inventory() {
  const { inventory, services, settings } = useAppStore();
  const cur = settings.currency || "$";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [tab, setTab] = useState("stock");
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(blank());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trade, setTrade] = useState(false);
  const [bulk, setBulk] = useState<any[] | null>(null);

  const all = useMemo(() => [
    ...inventory.map((i: any) => ({ ...i, itemType: i.itemType || i.item_type || "product" })),
    ...services.map((s: any) => ({ ...s, itemType: "service", stock: 9999, low: 0, sku: s.sku || "" })),
  ], [inventory, services]);
  const categories = useMemo(() => [...new Set([...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES, ...all.map((i) => i.category).filter(Boolean)])].sort(), [all]);
  const filtered = all.filter((i) => {
    const s = q.toLowerCase();

    return (!s || i.name?.toLowerCase().includes(s) || i.sku?.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s)) && (cat === "all" || i.category === cat) && (type === "all" || i.itemType === type);
  });
  const products = all.filter((i) => i.itemType === "product");
  const lowCount = products.filter((i) => i.stock <= (i.low || 5)).length;
  const svcList = all.filter((i) => i.itemType === "service");

  const edit = (item?: any) => {
    setEditing(item ?? null);
    setForm(item ? { ...blank(), ...item, itemType: item.itemType || "product" } : blank());
    setOpen(true);
  };
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: "price" | "cost" | "stock" | "low" | "estimated_minutes") => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value));

  const save = async () => {
    if (!form.name.trim()) return toast.warning("Name required", "Enter an item name");
    setSaving(true);
    try {
      const st = useAppStore.getState();

      if (form.itemType === "service") {
        const payload = { name: form.name, category: form.category, description: form.description, price: form.price, estimated_minutes: form.estimated_minutes };

        if (editing?.itemType === "service") await st.updateService(editing.id, payload);
        else await st.createService(payload);
      } else if (editing && editing.itemType !== "service") {
        await st.updateInventoryItem(editing.id, { name: form.name, sku: form.sku, category: form.category, description: form.description, price: form.price, cost: form.cost, stock: form.stock, low: form.low });
      } else {
        await st.createInventoryItem(form);
      }
      toast.success(editing ? "Item updated" : "Item added", form.name);
      setOpen(false);
    } catch (e) {
      toast.danger("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    try {
      const st = useAppStore.getState();

      if (editing.itemType === "service") await st.deleteService(editing.id);
      else await st.deleteInventoryItem(editing.id);
      toast.success("Item deleted", editing.name);
      setOpen(false);
    } catch (e) {
      toast.danger("Delete failed", (e as Error).message);
    }
  };

  const labelFor = (i: any) => ({ sku: i.sku || `SVC-${i.id}`, name: i.name, price: i.price || 0, currency: cur, format: i.itemType === "service" ? "QR" : undefined });
  const printOne = () => form.name && printBarcodeLabel({ ...labelFor({ ...form, id: editing?.id }), sku: form.sku || (editing?.id ? `SVC-${editing.id}` : "NO-SKU") });
  const printAll = () => {
    if (!filtered.length) return toast.warning("Nothing to print", "No items match the current filter.");

    const payload = filtered.map(labelFor);

    if (payload.length > 50) return setBulk(payload);
    void printBarcodeBatch(payload);
    toast.success("Printing", `${payload.length} labels sent to printer`);
  };

  return (
    <>
      <PageHead title="Inventory" subtitle={`${all.length} items`}>
        <Button variant="secondary" onClick={printAll}><Printer size={14} />Print labels</Button>
        <Button onClick={() => edit()}><Plus size={14} />Add item</Button>
      </PageHead>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="stock">Stock and services</TabsTrigger>
          <TabsTrigger value="services">Service pricing</TabsTrigger>
          <TabsTrigger value="tradein">Trade-in</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="nv-grid cols-4" style={{ margin: "16px 0" }}>
            <MetricCard label="Total items" value={all.length} context="Products and services" />
            <MetricCard label="Products" value={products.length} context="Physical stock" />
            <MetricCard label="Services" value={svcList.length} context="Labor and repairs" />
            <MetricCard label="Low stock" value={lowCount} context={lowCount ? "Needs restocking" : "All stocked"} />
          </div>
          <div className="nv-panel nv-stack" style={{ marginBottom: 16 }}>
            <SearchField label="Search by name, SKU or category" value={q} onValueChange={setQ} />
            <div className="nv-form-row">
              <SegmentedControl label="Type" value={type} onValueChange={(v: string) => setType(v)} options={[{ value: "all", label: "All" }, { value: "product", label: "Products" }, { value: "service", label: "Services" }]} />
              <Select label="Category" value={cat} onValueChange={setCat} options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No items found" description={q ? "Try a different search." : "Add your first item."} action={<Button onClick={() => edit()}>Add item</Button>} />
          ) : (
            <div className="nv-grid cols-3">
              {filtered.map((i) => {
                const svc = i.itemType === "service";
                const low = !svc && i.stock <= (i.low || 5);

                return (
                  <button key={`${i.itemType}-${i.id}`} type="button" className="nv-panel" style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }} onClick={() => edit(i)}>
                    <div className="nv-actions" style={{ justifyContent: "space-between" }}>
                      {svc ? <Wrench size={18} /> : <Package size={18} />}
                      <Badge tone={svc ? "info" : low ? "danger" : "success"}>{svc ? "Service" : low ? "Low stock" : "In stock"}</Badge>
                    </div>
                    <div style={{ marginTop: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                    <div className="nv-muted" style={{ fontSize: 13 }}>{svc ? i.description || i.category : `SKU ${i.sku || "none"} · ${i.category}`}</div>
                    <div className="nv-actions" style={{ justifyContent: "space-between", marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 500 }}>{formatCurrency(i.price, cur)}</div>
                        <div className="nv-muted" style={{ fontSize: 12 }}>{svc ? (i.estimated_minutes || i.duration ? `About ${i.estimated_minutes || i.duration} min` : "Labor rate") : `Cost ${formatCurrency(i.cost || 0, cur)}`}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 500 }}>{svc ? "∞" : i.stock}</div>
                        <div className="nv-muted" style={{ fontSize: 12 }}>{svc ? "Unlimited" : "Units"}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          <div className="nv-panel" style={{ marginTop: 16 }}>
            <h2>Service pricing</h2>
            <p className="nv-muted" style={{ marginTop: -8 }}>Repair services, prices and time estimates.</p>
            {svcList.length === 0 ? <EmptyState title="No services yet" description="Add an item and choose the Service type." /> : svcList.map((s) => (
              <div key={s.id} className="nv-row" style={{ cursor: "pointer" }} onClick={() => edit(s)}>
                <Wrench size={16} />
                <div className="nv-row-main"><strong>{s.name}</strong><span>{s.category || "Services"}</span></div>
                {s.estimated_minutes ? <Badge tone="success">{s.estimated_minutes} min</Badge> : null}
                <strong style={{ fontWeight: 500 }}>{formatCurrency(s.price, cur)}</strong>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tradein">
          <div className="nv-panel" style={{ marginTop: 16, maxWidth: 520 }}>
            <h2>Trade-in evaluator</h2>
            <p className="nv-muted">Assess customer devices, calculate condition-based offers, and add purchased devices to inventory.</p>
            <Button onClick={() => setTrade(true)}>Start new evaluation</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit item" : "Add item"} description={form.itemType === "service" ? "A labor or repair service" : "A product you keep in stock"}>
          <div className="nv-form">
            {!editing && <SegmentedControl label="Type" value={form.itemType} onValueChange={(v: string) => { set("itemType", v as "product" | "service"); set("category", v === "service" ? "Services" : "Parts"); }} options={[{ value: "product", label: "Product" }, { value: "service", label: "Service" }]} />}
            <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <div className="nv-form-row">
              {form.itemType === "product" && <Input label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} />}
              <Select label="Category" value={form.category} onValueChange={(v) => set("category", v)} options={(form.itemType === "service" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES).concat(categories.includes(form.category) || (form.itemType === "service" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES).includes(form.category) ? [] : [form.category]).map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="nv-form-row">
              <Input label="Price" type="number" min={0} step="0.01" value={form.price} onChange={num("price")} />
              {form.itemType === "product" ? <Input label="Cost" type="number" min={0} step="0.01" value={form.cost} onChange={num("cost")} /> : <Input label="Estimated minutes" type="number" min={0} value={form.estimated_minutes} onChange={num("estimated_minutes")} />}
            </div>
            {form.itemType === "product" && (
              <div className="nv-form-row">
                <Input label="Stock" type="number" min={0} value={form.stock} onChange={num("stock")} />
                <Input label="Low stock alert at" type="number" min={0} value={form.low} onChange={num("low")} />
              </div>
            )}
            <Textarea label="Description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              {editing ? <HoldToConfirm label="Hold to delete" confirmedLabel="Deleted" tone="danger" onConfirm={remove} /> : <span />}
              <div className="nv-actions">
                <Button variant="ghost" onClick={printOne}><Printer size={14} />Label</Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} loading={saving}>{editing ? "Save changes" : "Add item"}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulk} onOpenChange={(o) => !o && setBulk(null)}>
        <DialogContent title={`Print ${bulk?.length ?? 0} labels?`} description="This is a large batch. Make sure the label printer is loaded.">
          <div className="nv-actions" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setBulk(null)}>Cancel</Button>
            <Button onClick={() => { void printBarcodeBatch(bulk!); toast.success("Printing", `${bulk!.length} labels sent to printer`); setBulk(null); }}>Print all</Button>
          </div>
        </DialogContent>
      </Dialog>

      <TradeInWizard open={trade} onOpenChange={setTrade} onSaved={() => { toast.success("Trade-in saved", "The evaluation was recorded as pending"); setTrade(false); setTab("stock"); }} />
    </>
  );
}

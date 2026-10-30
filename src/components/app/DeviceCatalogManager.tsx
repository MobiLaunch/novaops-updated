import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { toast } from "@/hooks/useToast";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const KNOWN_BRANDS = ["Apple", "Samsung", "Google", "Sony", "LG", "Microsoft", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Huawei", "OnePlus", "Motorola", "Nokia", "Xiaomi", "Oppo", "Vivo", "Realme", "Nothing"];
export const COMMON_CATEGORIES = ["Smartphone", "Tablet", "Laptop", "Desktop", "Smartwatch", "Gaming", "Headphones", "Camera"];

export interface Catalog { brands: any[]; categories: any[]; models: any[] }

/** Loads the shop's custom brands, categories and models. */
export function useCatalog(enabled = true) {
  const [catalog, setCatalog] = useState<Catalog>({ brands: [], categories: [], models: [] });
  const reload = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return;

    const [b, c, m] = await Promise.all([
      sb.from("device_brands").select("*").order("name"),
      sb.from("device_categories").select("*").order("name"),
      sb.from("device_models").select("*").order("brand").order("name"),
    ]);

    setCatalog({ brands: b.data || [], categories: c.data || [], models: m.data || [] });
  }, []);

  useEffect(() => { if (enabled) void reload(); }, [enabled, reload]);

  return { catalog, reload };
}

export function DeviceCatalogManager({ open, onOpenChange, onChanged }: { open: boolean; onOpenChange: (o: boolean) => void; onChanged?: () => void }) {
  const { catalog, reload } = useCatalog(open);
  const [brand, setBrand] = useState({ name: "", icon: "" });
  const [cat, setCat] = useState("");
  const [model, setModel] = useState({ brand: "", category: "", name: "" });

  const brandNames = [...new Set([...KNOWN_BRANDS, ...catalog.brands.map((b) => b.name)])].sort();
  const catNames = [...new Set([...COMMON_CATEGORIES, ...catalog.categories.map((c) => c.name)])].sort();

  const run = async (fn: () => PromiseLike<{ error: any }> | undefined) => {
    const res = await fn();

    if (res?.error) return void toast.danger("Could not save", res.error.message);
    await reload();
    onChanged?.();
  };
  const sb = () => getSupabase()!;
  const pid = () => useAppStore.getState().user?.id as string;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nv-wide" title="Device catalog" description="Add brands, categories and models that aren't built in">
        <Tabs defaultValue="brands">
          <TabsList><TabsTrigger value="brands">Brands</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger><TabsTrigger value="models">Models</TabsTrigger></TabsList>

          <TabsContent value="brands">
            <div className="nv-stack" style={{ marginTop: 16 }}>
              <div className="nv-form-row">
                <Input label="Brand name" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
                <Input label="Logo URL or Simple Icons slug" description="Optional" value={brand.icon} onChange={(e) => setBrand({ ...brand, icon: e.target.value })} />
              </div>
              <div><Button size="sm" disabled={!brand.name.trim()} onClick={async () => {
                const v = brand.icon.trim();

                await run(() => sb().from("device_brands").insert({ profile_id: pid(), name: brand.name.trim(), icon_url: v ? (v.startsWith("http") ? v : `https://cdn.simpleicons.org/${v}/555555/cccccc`) : null }));
                setBrand({ name: "", icon: "" });
              }}><Plus size={14} />Add brand</Button></div>
              {catalog.brands.length === 0 ? <EmptyState title="No custom brands" description="Built-in brands are always available." /> : catalog.brands.map((b) => (
                <div key={b.id} className="nv-row"><div className="nv-row-main"><strong>{b.name}</strong></div><Button size="sm" variant="ghost" aria-label={`Delete ${b.name}`} onClick={() => run(() => sb().from("device_brands").delete().eq("id", b.id))}><Trash2 size={14} /></Button></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="nv-stack" style={{ marginTop: 16 }}>
              <Input label="Category name" value={cat} onChange={(e) => setCat(e.target.value)} />
              <div><Button size="sm" disabled={!cat.trim()} onClick={async () => { await run(() => sb().from("device_categories").insert({ profile_id: pid(), name: cat.trim(), emoji: "📦" })); setCat(""); }}><Plus size={14} />Add category</Button></div>
              {catalog.categories.length === 0 ? <EmptyState title="No custom categories" description="Built-in categories are always available." /> : catalog.categories.map((c) => (
                <div key={c.id} className="nv-row"><div className="nv-row-main"><strong>{c.name}</strong></div><Button size="sm" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => run(() => sb().from("device_categories").delete().eq("id", c.id))}><Trash2 size={14} /></Button></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="models">
            <div className="nv-stack" style={{ marginTop: 16 }}>
              <div className="nv-form-row">
                <Select label="Brand" value={model.brand} onValueChange={(v) => setModel({ ...model, brand: v })} options={brandNames.map((b) => ({ value: b, label: b }))} placeholder="Choose a brand" />
                <Select label="Category" value={model.category} onValueChange={(v) => setModel({ ...model, category: v })} options={catNames.map((b) => ({ value: b, label: b }))} placeholder="Choose a category" />
              </div>
              <Input label="Model name" value={model.name} onChange={(e) => setModel({ ...model, name: e.target.value })} />
              <div><Button size="sm" disabled={!model.name.trim() || !model.brand || !model.category} onClick={async () => { await run(() => sb().from("device_models").insert({ profile_id: pid(), brand: model.brand, category: model.category, name: model.name.trim() })); setModel({ ...model, name: "" }); }}><Plus size={14} />Add model</Button></div>
              {catalog.models.length === 0 ? <EmptyState title="No custom models" description="Models you add show up when you check in a device." /> : catalog.models.map((m) => (
                <div key={m.id} className="nv-row"><div className="nv-row-main"><strong>{m.name}</strong><span>{m.brand} · {m.category}</span></div><Button size="sm" variant="ghost" aria-label={`Delete ${m.name}`} onClick={() => run(() => sb().from("device_models").delete().eq("id", m.id))}><Trash2 size={14} /></Button></div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

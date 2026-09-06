import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, FieldError, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Package, PackageX, Plus, Printer, Search, TriangleAlert } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { InventoryItem } from "@/types/domain";
import { sbFetchInventory, sbUpsertInventoryItem } from "@/lib/supabase";
import { printBarcodeLabel } from "@/lib/print";
import { formatCurrency, useRefetchOnFocus } from "@/lib/utils";

const emptyForm: Partial<InventoryItem> = {
  name: "",
  sku: "",
  category: "Parts",
  stock: 0,
  low: 5,
  cost: 0,
  price: 0,
};

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchInventory();

    setLoading(false);
    if (data) setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  // Front desk and bench run this side by side — pick the tab back up and
  // it refreshes instead of showing whatever was there when you left.
  useRefetchOnFocus(load);

  useEffect(() => {
    const openId = searchParams.get("open");

    if (openId && items.length > 0) {
      const match = items.find((i) => String(i.id) === openId);

      if (match) setEditing(match);
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [items, searchParams, setSearchParams]);

  // ?filter=low — the "N items low on stock" notification links straight to
  // the items it's talking about instead of the full catalogue.
  useEffect(() => {
    if (searchParams.get("filter") !== "low") return;
    setLowOnly(true);
    searchParams.delete("filter");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSave = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const { data } = await sbUpsertInventoryItem(editing);

    setSaving(false);
    if (data) {
      setItems((rows) => {
        const exists = rows.some((r) => r.id === data.id);

        return exists ? rows.map((r) => (r.id === data.id ? data : r)) : [data, ...rows];
      });
      setEditing(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((i) => {
      if (lowOnly && i.stock > i.low) return false;
      if (!q) return true;

      return `${i.name} ${i.sku} ${i.category}`.toLowerCase().includes(q);
    });
  }, [items, query, lowOnly]);

  const totalStockValue = items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.stock || 0), 0);
  const lowStockCount = items.filter((i) => i.stock <= i.low).length;
  // Existing categories, offered as suggestions so the same thing doesn't get
  // typed three different ways — POS filters its product grid by this field.
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(), [items]);

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: "name",
      header: "Item",
      render: (i) => (
        <div>
          <strong className="block text-sm text-foreground">{i.name}</strong>
          <span className="text-xs text-muted">{i.sku || "No SKU"}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (i) => <span className="text-sm">{i.category}</span> },
    {
      key: "stock",
      header: "Stock",
      render: (i) => (
        <span className={`flex items-center gap-1.5 text-sm font-semibold ${i.stock <= i.low ? "text-warning" : "text-foreground"}`}>
          {i.stock <= i.low && <TriangleAlert className="size-3.5" />}
          {i.stock}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price / Cost",
      render: (i) => (
        <div>
          <span className="block text-sm">{formatCurrency(i.price)}</span>
          <span className="text-xs text-muted">cost {formatCurrency(i.cost)}</span>
        </div>
      ),
    },
    {
      // Cost was tracked (Accounting uses it for COGS) but never shown here,
      // so there was no way to spot an item selling at or below cost.
      key: "margin",
      header: "Margin",
      render: (i) => {
        const price = Number(i.price || 0);
        const cost = Number(i.cost || 0);

        if (!price || !cost) return <span className="text-sm text-muted">—</span>;
        const pct = ((price - cost) / price) * 100;

        return (
          <span className={`text-sm font-semibold ${pct <= 0 ? "text-danger" : pct < 20 ? "text-warning" : "text-success"}`}>
            {pct.toFixed(0)}%
          </span>
        );
      },
    },
    {
      key: "value",
      header: "Stock Value",
      render: (i) => <span className="text-sm font-semibold text-success">{formatCurrency(Number(i.price || 0) * Number(i.stock || 0))}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (i) => (
        <div className="flex justify-end gap-1">
          <Button
            isIconOnly
            aria-label="Print barcode label"
            size="sm"
            variant="ghost"
            onPress={() => printBarcodeLabel({ value: i.sku || String(i.id), name: i.name, price: i.price, format: "CODE128" })}
          >
            <Printer className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onPress={() => setEditing(i)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        action={
          <Button variant="primary" onPress={() => setEditing(emptyForm)}>
            <Plus className="size-4" />
            <span>New Item</span>
          </Button>
        }
        description={`${items.length} item${items.length !== 1 ? "s" : ""} tracked · ${formatCurrency(totalStockValue)} in stock value`}
        eyebrow="Inventory"
        title="Parts & Stock"
      />

      {items.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
              placeholder="Search by name, SKU, or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                !lowOnly ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:bg-surface-secondary"
              }`}
              type="button"
              onClick={() => setLowOnly(false)}
            >
              All Items
            </button>
            <button
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                lowOnly ? "border-warning bg-warning/15 text-warning" : "border-border bg-surface text-muted hover:bg-surface-secondary"
              }`}
              type="button"
              onClick={() => setLowOnly(true)}
            >
              <TriangleAlert className="size-3.5" />
              Low Stock ({lowStockCount})
            </button>
          </div>
        </div>
      )}

      <DataTable
        ariaLabel="Inventory"
        columns={columns}
        data={filtered}
        emptyState={{
          icon: loading ? Package : PackageX,
          title: loading ? "Loading inventory…" : query ? "No matches" : "No inventory yet",
          description: query ? `No items match "${query}".` : "Parts and stock items you add will show up here.",
        }}
        rowKey={(i) => String(i.id)}
      />

      <Modal>
        <Modal.Backdrop isOpen={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editing?.id ? "Edit Item" : "New Item"}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5 sm:col-span-2"
                  value={editing?.name || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, name: v })}
                >
                  <Label>Name</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.sku || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, sku: v })}
                >
                  <Label>SKU</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <input
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    list="inventory-categories"
                    value={editing?.category || ""}
                    onChange={(e) => setEditing((f) => f && { ...f, category: e.target.value })}
                  />
                  <datalist id="inventory-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <TextField
                  className="flex flex-col gap-1.5"
                  type="number"
                  value={String(editing?.stock ?? 0)}
                  onChange={(v) => setEditing((f) => f && { ...f, stock: Number(v) || 0 })}
                >
                  <Label>Stock</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  type="number"
                  value={String(editing?.low ?? 5)}
                  onChange={(v) => setEditing((f) => f && { ...f, low: Number(v) || 0 })}
                >
                  <Label>Low stock alert</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  type="number"
                  value={String(editing?.cost ?? 0)}
                  onChange={(v) => setEditing((f) => f && { ...f, cost: Number(v) || 0 })}
                >
                  <Label>Cost</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  type="number"
                  value={String(editing?.price ?? 0)}
                  onChange={(v) => setEditing((f) => f && { ...f, price: Number(v) || 0 })}
                >
                  <Label>Price</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleSave}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

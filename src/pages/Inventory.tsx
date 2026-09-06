import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, FieldError, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Package, PackageX, Plus, Printer, Search, TriangleAlert } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { InventoryItem } from "@/types/domain";
import type { InventorySummary } from "@/types/domain";
import { sbFetchInventoryPage, sbFetchInventorySummary, sbUpsertInventoryItem } from "@/lib/supabase";
import { useServerList } from "@/lib/useServerList";
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

const ZERO_SUMMARY: InventorySummary = { item_count: 0, stock_value: 0, low_count: 0, cost_value: 0 };

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [lowOnly, setLowOnly] = useState(searchParams.get("filter") === "low");
  const [summary, setSummary] = useState<InventorySummary>(ZERO_SUMMARY);
  const [categories, setCategories] = useState<string[]>([]);

  // One page of the catalogue at a time, searched and filtered in Postgres —
  // the page used to download every item and do both in the browser.
  const fetchPage = useCallback(
    (page: number, search: string) => sbFetchInventoryPage({ page, search, lowOnly }),
    [lowOnly],
  );
  const list = useServerList(fetchPage, [lowOnly]);
  const items = list.rows;

  // The header totals and the category suggestions are aggregated in
  // Postgres rather than added up from a full catalogue read.
  const loadSummary = () => {
    sbFetchInventorySummary().then(({ summary: next, categories: cats }) => {
      setSummary(next);
      setCategories(cats);
    });
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // The list refreshes itself when the tab regains focus; the header totals
  // have to come along or they go stale against the rows underneath them.
  useRefetchOnFocus(loadSummary);

  // ?open=<id> — deep link from search or a notification. The item may not be
  // on the page being shown, so it's fetched by id rather than looked up in
  // the rows currently loaded.
  useEffect(() => {
    const openId = searchParams.get("open");

    if (!openId) return;
    searchParams.delete("open");
    setSearchParams(searchParams, { replace: true });
    sbFetchInventoryPage({ search: "", page: 0, pageSize: 1000 }).then(({ rows }) => {
      const match = rows.find((i) => String(i.id) === openId);

      if (match) setEditing(match);
    });
  }, [searchParams, setSearchParams]);

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
      setEditing(null);
      list.reload();
      loadSummary();
    }
  };

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
        description={`${summary.item_count} item${summary.item_count !== 1 ? "s" : ""} tracked · ${formatCurrency(summary.stock_value)} in stock value`}
        eyebrow="Inventory"
        title="Parts & Stock"
      />

      {(summary.item_count > 0 || list.query) && (
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
              placeholder="Search by name, SKU, or category…"
              value={list.query}
              onChange={(e) => list.setQuery(e.target.value)}
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
              Low Stock ({summary.low_count})
            </button>
          </div>
        </div>
      )}

      <DataTable
        ariaLabel="Inventory"
        columns={columns}
        data={items}
        emptyState={{
          icon: list.loading ? Package : PackageX,
          title: list.loading ? "Loading inventory…" : list.query ? "No matches" : lowOnly ? "Nothing low on stock" : "No inventory yet",
          description: list.query
            ? `No items match "${list.query}".`
            : lowOnly
              ? "Every item is above its low-stock threshold."
              : "Parts and stock items you add will show up here.",
        }}
        page={list.page}
        rowKey={(i) => String(i.id)}
        totalRows={list.total}
        onPageChange={list.setPage}
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

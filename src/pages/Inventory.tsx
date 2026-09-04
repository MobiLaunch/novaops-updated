import { useEffect, useState } from "react";
import { Button, FieldError, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Package, PackageX, Plus, TriangleAlert } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { InventoryItem } from "@/types/domain";
import { sbFetchInventory, sbUpsertInventoryItem } from "@/lib/supabase";

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchInventory();

    setLoading(false);
    if (data) setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

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
    { key: "price", header: "Price", render: (i) => <span className="text-sm">${Number(i.price).toFixed(2)}</span> },
    {
      key: "actions",
      header: "",
      render: (i) => (
        <Button size="sm" variant="ghost" onPress={() => setEditing(i)}>
          Edit
        </Button>
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
        description={`${items.length} item${items.length !== 1 ? "s" : ""} tracked`}
        eyebrow="Inventory"
        title="Parts & Stock"
      />
      <DataTable
        ariaLabel="Inventory"
        columns={columns}
        data={items}
        emptyState={{
          icon: loading ? Package : PackageX,
          title: loading ? "Loading inventory…" : "No inventory yet",
          description: "Parts and stock items you add will show up here.",
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
                  <Label>Name *</Label>
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
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.category || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, category: v })}
                >
                  <Label>Category</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
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

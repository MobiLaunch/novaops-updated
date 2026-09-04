import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FieldError, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Button, Chip } from "@heroui/react";
import { Plus, UserRoundX, Users } from "lucide-react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import type { Customer } from "@/types/domain";
import { sbFetchCustomers, sbUpsertCustomer } from "@/lib/supabase";

const emptyForm: Partial<Customer> = { name: "", phone: "", email: "", address: "", notes: "" };

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await sbFetchCustomers();

    setLoading(false);
    if (data) setCustomers(data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");

    if (openId && customers.length > 0) {
      const match = customers.find((c) => String(c.id) === openId);

      if (match) setEditing(match);
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [customers, searchParams, setSearchParams]);

  const handleSave = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const { data } = await sbUpsertCustomer(editing);

    setSaving(false);
    if (data) {
      setCustomers((cs) => {
        const exists = cs.some((c) => c.id === data.id);

        return exists ? cs.map((c) => (c.id === data.id ? data : c)) : [data, ...cs];
      });
      setEditing(null);
    }
  };

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => <strong className="text-sm text-foreground">{c.name}</strong>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div>
          <span className="block text-sm text-foreground">{c.phone || "—"}</span>
          <span className="text-xs text-muted">{c.email || "No email"}</span>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {(c.tags || []).map((t) => (
            <Chip key={t} size="sm" variant="soft">
              <Chip.Label>{t}</Chip.Label>
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <Button size="sm" variant="ghost" onPress={() => setEditing(c)}>
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
            <span>New Customer</span>
          </Button>
        }
        description={`${customers.length} customer${customers.length !== 1 ? "s" : ""} on file`}
        eyebrow="Customers"
        title="Customer Directory"
      />
      <DataTable
        ariaLabel="Customers"
        columns={columns}
        data={customers}
        emptyState={{
          icon: loading ? Users : UserRoundX,
          title: loading ? "Loading customers…" : "No customers yet",
          description: "Customers you create or that come from tickets will show up here.",
        }}
        rowKey={(c) => String(c.id)}
      />

      <Modal>
        <Modal.Backdrop isOpen={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editing?.id ? "Edit Customer" : "New Customer"}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <TextField
                  isRequired
                  className="flex flex-col gap-1.5"
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
                  value={editing?.phone || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, phone: v })}
                >
                  <Label>Phone</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.email || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, email: v })}
                >
                  <Label>Email</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField
                  className="flex flex-col gap-1.5"
                  value={editing?.address || ""}
                  onChange={(v) => setEditing((f) => f && { ...f, address: v })}
                >
                  <Label>Address</Label>
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

import { useEffect, useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Input } from "@/components/arc/input/input";
import { Textarea } from "@/components/arc/textarea/textarea";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { useAppStore } from "@/lib/store";
import type { Customer } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSaved?: (customer: Customer) => void;
  onDeleted?: (id: number) => void;
}

const EMPTY = { name: "", phone: "", email: "", driversLicense: "", address: "", notes: "" };

export function CustomerEditDialog({ open, onOpenChange, customer, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { createCustomer, updateCustomer, deleteCustomer } = useAppStore.getState();

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(customer ? { name: customer.name, phone: customer.phone, email: customer.email, driversLicense: customer.driversLicense || "", address: customer.address || "", notes: customer.notes } : EMPTY);
  }, [open, customer]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return setError("Enter a customer name");
    setSaving(true);
    try {
      const saved = customer ? await updateCustomer(customer.id, form) : await createCustomer(form);

      toast.success(customer ? "Customer updated" : "Customer added");
      if (!customer) addNotification("New customer", form.name, "info", "newCustomer");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.danger("Could not save customer", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!customer) return;
    try {
      await deleteCustomer(customer.id);
      toast.success("Customer deleted");
      onDeleted?.(customer.id);
      onOpenChange(false);
    } catch (e) {
      toast.danger("Could not delete customer", (e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={customer ? "Edit customer" : "New customer"} description={customer ? customer.name : "Add someone to your customer list"}>
        <div className="nv-form">
          <Input label="Name" value={form.name} onChange={set("name")} error={error} autoFocus />
          <div className="nv-form-row">
            <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <Input label="Address" value={form.address} onChange={set("address")} />
          <Input label="Driver's license" value={form.driversLicense} onChange={set("driversLicense")} />
          <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={3} />
          <div className="nv-actions" style={{ justifyContent: "space-between" }}>
            {customer ? <HoldToConfirm label="Hold to delete customer" confirmedLabel="Deleted" tone="danger" onConfirm={remove} /> : <span />}
            <div className="nv-actions">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={save} loading={saving}>{customer ? "Save changes" : "Add customer"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";

import { Button } from "@/components/arc/button/button";
import { Combobox } from "@/components/arc/combobox/combobox";
import { Input } from "@/components/arc/input/input";
import { addNotification } from "@/hooks/useNotifications";
import { toast } from "@/hooks/useToast";
import { formatPhoneNumber } from "@/lib/phone";
import { useAppStore } from "@/lib/store";

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
}

/** Search existing customers or add a new one inline. */
export function CustomerSelect({ value, onChange, label = "Customer" }: Props) {
  const customers = useAppStore((s) => s.customers);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "" });

  const options = useMemo(
    () => customers.map((c) => ({ value: String(c.id), label: c.name, keywords: [c.email, c.phone].filter(Boolean) })),
    [customers],
  );

  const create = async () => {
    if (!draft.name.trim()) return toast.warning("Enter a name");
    setSaving(true);
    try {
      const c = await useAppStore.getState().createCustomer(draft);

      onChange(c.id);
      setAdding(false);
      setDraft({ name: "", email: "", phone: "" });
      toast.success("Customer added", c.name);
      addNotification("New customer", c.name, "info", "newCustomer");
    } catch (e) {
      toast.danger("Could not add customer", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="nv-stack">
        <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
        <div className="nv-form-row">
          <Input label="Phone" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: formatPhoneNumber(e.target.value) })} />
          <Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div className="nv-actions">
          <Button size="sm" onClick={create} loading={saving}>Add customer</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Back to search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="nv-stack">
      <Combobox label={label} placeholder="Search by name, phone or email" options={options} value={value ? String(value) : ""} onValueChange={(v) => onChange(v ? Number(v) : null)} emptyMessage="No matching customers" />
      <div><Button size="sm" variant="ghost" onClick={() => setAdding(true)}>New customer</Button></div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import { toast } from "@/hooks/useToast";
import { authedFetch } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

interface Member { user_id: string; name: string; email: string; created_at: string }

/** Owner-only: create and remove staff sign-ins that can run the register but can't see revenue or settings. */
export function StaffManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = (await getSupabase()?.from("staff_members").select("user_id,name,email,created_at").order("created_at")) ?? { data: [] };

    setMembers((data as Member[]) || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const call = async (payload: Record<string, unknown>) => {
    const res = await authedFetch("/api/staff", { method: "POST", body: JSON.stringify(payload) });
    const j = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(j.statusMessage || j.message || "Something went wrong");
  };
  const add = async () => {
    setBusy(true);
    try {
      await call({ action: "create", ...form });
      toast.success("Staff account created", `${form.email} can sign in now.`);
      setForm({ name: "", email: "", password: "" });
      await load();
    } catch (e) { toast.danger("Couldn't add staff", (e as Error).message); } finally { setBusy(false); }
  };
  const remove = async (m: Member) => {
    if (!window.confirm(`Remove ${m.name || m.email}? They will no longer be able to sign in.`)) return;
    try { await call({ action: "remove", userId: m.user_id }); await load(); } catch (e) { toast.danger("Couldn't remove", (e as Error).message); }
  };

  return (
    <div className="nv-panel nv-form" style={{ marginTop: 16, maxWidth: 680 }}>
      <h3 style={{ margin: 0 }}>Team</h3>
      <Alert tone="info" title="What staff can do">Staff can use the register, tickets, inventory, customers and bookings. They can't see revenue, web orders, expenses, analytics or settings, and can't edit or refund past sales.</Alert>
      {members.length === 0 ? <p className="nv-muted">No staff accounts yet.</p> : members.map((m) => (
        <div key={m.user_id} className="nv-row">
          <div className="nv-row-main"><strong>{m.name || m.email}</strong><span>{m.email}</span></div>
          <Button size="sm" variant="ghost" aria-label={`Remove ${m.email}`} onClick={() => void remove(m)}><UserMinus size={14} /></Button>
        </div>
      ))}
      <form className="nv-stack" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordField label="Temporary password (8+ characters)" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" loading={busy} disabled={!form.email || form.password.length < 8}><UserPlus size={14} />Add staff member</Button>
      </form>
    </div>
  );
}

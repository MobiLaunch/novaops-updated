import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Textarea } from "@/components/arc/textarea/textarea";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DEFAULT_STATUSES } from "@/lib/profile";
import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

const CURRENCIES = [{ value: "$", label: "$ USD" }, { value: "€", label: "€ EUR" }, { value: "£", label: "£ GBP" }, { value: "¥", label: "¥ JPY" }, { value: "₹", label: "₹ INR" }];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const [p, setP] = useState({ businessName: "", email: "", phone: "", address: "", currency: "$" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof p) => (v: string) => setP((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (user?.email) setP((s) => ({ ...s, email: user.email, businessName: s.businessName || user.user_metadata?.full_name || "" }));
  }, [user]);

  const valid = p.businessName.trim() && p.email.trim();

  const submit = async () => {
    const sb = getSupabase();

    if (!sb || !user) return setError("Not signed in");
    setLoading(true);
    setError("");
    try {
      const { error: err } = await sb.from("profiles").upsert({
        id: user.id, email: p.email, business_name: p.businessName, phone: p.phone, address: p.address, currency: p.currency,
        tax_rate: 0, statuses: DEFAULT_STATUSES, pin: "1234", services: [], expenses: [],
      }, { onConflict: "id" });

      if (err) throw err;
      useAppStore.getState().patchSettings({ businessName: p.businessName, email: p.email, phone: p.phone, address: p.address, currency: p.currency });
      navigate("/dashboard");
    } catch (e) {
      setError((e as Error).message || "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome to NovaOps" subtitle="Tell us about your shop. You can change this later in Settings.">
      <div className="nv-form">
        {error && <Alert tone="danger" title={error} />}
        <Input label="Business name" value={p.businessName} onChange={(e) => set("businessName")(e.target.value)} />
        <Input label="Business email" type="email" value={p.email} onChange={(e) => set("email")(e.target.value)} />
        <Input label="Phone" type="tel" value={p.phone} onChange={(e) => set("phone")(e.target.value)} />
        <Textarea label="Address" rows={2} value={p.address} onChange={(e) => set("address")(e.target.value)} />
        <SegmentedControl label="Currency" value={p.currency} onValueChange={(v: string) => set("currency")(v)} options={CURRENCIES} />
        <Button size="lg" onClick={submit} loading={loading} disabled={!valid}>Complete setup</Button>
      </div>
    </AuthLayout>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import { SegmentedControl } from "@/components/arc/segmented-control/segmented-control";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DEFAULT_STATUSES } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";
import { formatPhoneNumber } from "@/lib/phone";

const CURRENCIES = [{ value: "$", label: "$ USD" }, { value: "€", label: "€ EUR" }, { value: "£", label: "£ GBP" }, { value: "¥", label: "¥ JPY" }, { value: "₹", label: "₹ INR" }];

export default function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ businessName: "", email: "", phone: "", password: "", confirm: "", address: "", currency: "$" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sb = getSupabase();

    if (!sb) return setError("Connect a Supabase project first (Database on the sign-in page).");
    if (!f.businessName.trim()) return setError("Business name is required");
    if (!f.email.trim()) return setError("Email is required");
    if (f.password.length < 6) return setError("Password must be at least 6 characters");
    if (f.password !== f.confirm) return setError("Passwords do not match");

    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { businessName: f.businessName, phone: f.phone, address: f.address, currency: f.currency } } });

      if (err) throw err;
      if (!data.user) return;
      if (!data.session) return setNotice("Check your email to confirm your account, then sign in.");

      await sb.from("profiles").upsert({
        id: data.user.id, email: f.email, business_name: f.businessName, phone: f.phone, address: f.address, currency: f.currency,
        tax_rate: 0, statuses: DEFAULT_STATUSES, pin: "1234", services: [], expenses: [],
      }, { onConflict: "id" });
      navigate("/intro?from=register", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set up NovaOps" subtitle="Create your shop account" wide>
      <form className="nv-form" onSubmit={submit}>
        {error && <Alert tone="danger" title={error} />}
        {notice && <Alert tone="success" title={notice} />}
        <Input label="Business name" value={f.businessName} onChange={(e) => set("businessName")(e.target.value)} />
        <div className="nv-form-row">
          <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email")(e.target.value)} />
          <Input label="Phone" type="tel" value={f.phone} onChange={(e) => set("phone")(formatPhoneNumber(e.target.value))} />
        </div>
        <div className="nv-form-row">
          <PasswordField label="Password" autoComplete="new-password" description="At least 6 characters" value={f.password} onChange={(e) => set("password")(e.target.value)} />
          <PasswordField label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={(e) => set("confirm")(e.target.value)} />
        </div>
        <Input label="Address" value={f.address} onChange={(e) => set("address")(e.target.value)} />
        <SegmentedControl label="Currency" value={f.currency} onValueChange={(v: string) => set("currency")(v)} options={CURRENCIES} />
        <Button type="submit" size="lg" loading={loading}>Create account</Button>
      </form>
      <span className="nv-muted">Already have an account? <Link to="/login" style={{ textDecoration: "underline" }}>Sign in</Link></span>
    </AuthLayout>
  );
}

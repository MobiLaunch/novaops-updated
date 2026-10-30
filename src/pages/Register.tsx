import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Stepper } from "@/components/arc/stepper/stepper";
import { Switch } from "@/components/arc/switch/switch";
import { Textarea } from "@/components/arc/textarea/textarea";
import { useSupabaseConnect } from "@/hooks/useSupabaseConnect";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DEFAULT_DOCUMENTS, saveDocuments } from "@/lib/documents";
import { importRows, readRows } from "@/lib/importData";
import { formatPhoneNumber } from "@/lib/phone";
import { DEFAULT_STATUSES } from "@/lib/profile";
import { useAppStore } from "@/lib/store";
import { getSupabase, resetSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const CURRENCIES = [{ value: "$", label: "$ USD" }, { value: "€", label: "€ EUR" }, { value: "£", label: "£ GBP" }, { value: "¥", label: "¥ JPY" }, { value: "₹", label: "₹ INR" }];
const STEPS = [{ id: "account", label: "Account" }, { id: "database", label: "Database" }, { id: "square", label: "Square" }, { id: "google", label: "Google" }, { id: "import", label: "Import" }, { id: "documents", label: "Documents" }];

export default function Register() {
  const navigate = useNavigate();
  const conn = useSupabaseConnect();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [f, setF] = useState({ businessName: "", email: "", phone: "", password: "", confirm: "", address: "", currency: "$", squareToken: "", squareAppId: "", squareLocationId: "", squareSandbox: true, ...DEFAULT_DOCUMENTS });
  const [files, setFiles] = useState<{ inventory?: File; customers?: File }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const next = (from: number) => {
    if (from === 0) {
      if (!f.businessName.trim()) return setError("Business name is required");
      if (!f.email.trim()) return setError("Email is required");
      if (f.password.length < 6) return setError("Password must be at least 6 characters");
      if (f.password !== f.confirm) return setError("Passwords do not match");
    }
    setError("");
    setDone((d) => [...new Set([...d, from])]);
    if (from < STEPS.length - 1) setStep(from + 1);
  };

  const applyDatabase = async () => {
    if (!(await conn.testConnection(conn.url, conn.key))) return;
    resetSupabase(conn.url, conn.key);
    setNotice("Database connected.");
    next(1);
  };

  const submit = async () => {
    if (!done.includes(0)) { setStep(0); return setError("Complete the Account step first."); }

    const sb = getSupabase();

    if (!sb) { setStep(1); return setError("Connect your Supabase project in the Database step first."); }
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { businessName: f.businessName, phone: f.phone, address: f.address, currency: f.currency } } });

      if (err) throw err;
      if (!data.user) return;
      if (!data.session) return setNotice("Check your email to confirm your account, then sign in. Your setup choices were not saved yet.");

      await sb.from("profiles").upsert({ id: data.user.id, email: f.email, business_name: f.businessName, phone: f.phone, address: f.address, currency: f.currency, tax_rate: 0, statuses: DEFAULT_STATUSES, pin: "1234", services: [], expenses: [] }, { onConflict: "id" });

      const { squareToken, squareAppId, squareLocationId, squareSandbox } = f;

      if (squareToken && squareLocationId) {
        await sb.from("square_config").upsert({ profile_id: data.user.id, access_token: squareToken, location_id: squareLocationId, application_id: squareAppId, sandbox: squareSandbox }, { onConflict: "profile_id" });
        try { localStorage.setItem("novaops_square_config", JSON.stringify({ access_token: squareToken, location_id: squareLocationId, application_id: squareAppId, sandbox: squareSandbox })); } catch { /* ignore */ }
      }
      saveDocuments({ liabilityWaiver: f.liabilityWaiver, requireWaiverSignature: f.requireWaiverSignature, tradeInEnabled: f.tradeInEnabled, tradeInRequireId: f.tradeInRequireId, tradeInPolicy: f.tradeInPolicy, warrantyDays: f.warrantyDays, warrantyCoverage: f.warrantyCoverage, warrantyExcludeWater: f.warrantyExcludeWater, serviceTerms: f.serviceTerms, paymentTerms: f.paymentTerms, supportEmail: f.supportEmail });

      // The store needs the new session before it can import records.
      const st = useAppStore.getState();

      await st.checkAuth();
      await st.initializeData();
      for (const key of ["customers", "inventory"] as const) {
        const file = files[key];

        if (file) await importRows(key, await readRows(file, key));
      }
      navigate("/intro?from=register", { replace: true });
    } catch (e) {
      setError((e as Error).message || "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  const skip = (i: number) => setStep(Math.min(i + 1, STEPS.length - 1));
  const footer = (i: number, onNext: () => void, label = "Continue") => (
    <div className="nv-actions" style={{ justifyContent: "space-between" }}>
      {i > 0 ? <Button variant="ghost" onClick={() => setStep(i - 1)}>Back</Button> : <span />}
      <div className="nv-actions">{i > 0 && i < STEPS.length - 1 && <Button variant="ghost" onClick={() => skip(i)}>Skip</Button>}<Button onClick={onNext}>{label}</Button></div>
    </div>
  );

  return (
    <AuthLayout title="Set up NovaOps" subtitle="Create your shop account and configure the essentials" wide>
      <div className="nv-form">
        <Stepper steps={STEPS} current={step} onStepSelect={(i) => { setError(""); setStep(i); }} details="current" />
        {error && <Alert tone="danger" title={error} />}
        {notice && <Alert tone="success" title={notice} />}

        {step === 0 && (
          <>
            <Input label="Business name" value={f.businessName} onChange={(e) => set("businessName", e.target.value)} />
            <div className="nv-form-row">
              <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
              <Input label="Phone" type="tel" value={f.phone} onChange={(e) => set("phone", formatPhoneNumber(e.target.value))} />
            </div>
            <div className="nv-form-row">
              <PasswordField label="Password" autoComplete="new-password" description="At least 6 characters" value={f.password} onChange={(e) => set("password", e.target.value)} />
              <PasswordField label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={(e) => set("confirm", e.target.value)} />
            </div>
            <Input label="Address" value={f.address} onChange={(e) => set("address", e.target.value)} />
            <SegmentedControl label="Currency" value={f.currency} onValueChange={(v: string) => set("currency", v)} options={CURRENCIES} />
            {footer(0, () => next(0))}
          </>
        )}

        {step === 1 && (
          <>
            <Alert tone="info" title="Connect your Supabase project">Paste the project URL and anon key from Project Settings → API. The service role key is never needed in the browser.</Alert>
            {conn.status.error && <Alert tone="danger" title={conn.status.error} />}
            <Input label="Project URL" type="url" placeholder="https://xyzabc.supabase.co" value={conn.url} onChange={(e) => conn.setUrl(e.target.value)} />
            <PasswordField label="Anon key" value={conn.key} onChange={(e) => conn.setKey(e.target.value)} />
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <div className="nv-actions">{getSupabase() && <Button variant="ghost" onClick={() => skip(1)}>Use current connection</Button>}<Button loading={conn.status.checking} onClick={applyDatabase}>Test and connect</Button></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Alert tone="info" title="Accept card payments">Optional. Get these from the Square Developer Dashboard. You can add them later in Settings.</Alert>
            <PasswordField label="Access token" value={f.squareToken} onChange={(e) => set("squareToken", e.target.value)} />
            <div className="nv-form-row">
              <Input label="Application ID" value={f.squareAppId} onChange={(e) => set("squareAppId", e.target.value)} />
              <Input label="Location ID" value={f.squareLocationId} onChange={(e) => set("squareLocationId", e.target.value)} />
            </div>
            <Switch label="Sandbox mode" checked={f.squareSandbox} onCheckedChange={(v: boolean) => set("squareSandbox", v)} />
            {footer(2, () => next(2))}
          </>
        )}

        {step === 3 && (
          <>
            <Alert tone="info" title="Sign in with Google">Enable the Google provider in Supabase → Authentication → Providers, then set <code>VITE_SOCIAL_GOOGLE=true</code> on your deployment to show the button. Client secrets stay in Supabase, never in the browser.</Alert>
            <Input label="Support email" type="email" description="Shown on customer documents" value={f.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
            {footer(3, () => next(3))}
          </>
        )}

        {step === 4 && (
          <>
            <Alert tone="info" title="Bring your data">Optional. Import CSV or JSON files after your account is created.</Alert>
            <FileDropzone accept=".csv,.json" multiple={false} maxFiles={1} label="Inventory" description="name, sku, price, stock, category" onFilesChange={(fl) => setFiles((s) => ({ ...s, inventory: fl[0] }))} />
            <FileDropzone accept=".csv,.json" multiple={false} maxFiles={1} label="Customers" description="name, phone, email, notes" onFilesChange={(fl) => setFiles((s) => ({ ...s, customers: fl[0] }))} />
            {footer(4, () => next(4))}
          </>
        )}

        {step === 5 && (
          <>
            <Textarea label="Liability waiver" rows={2} value={f.liabilityWaiver} onChange={(e) => set("liabilityWaiver", e.target.value)} />
            <Switch label="Require a signature at check-in" checked={f.requireWaiverSignature} onCheckedChange={(v: boolean) => set("requireWaiverSignature", v)} />
            <div className="nv-form-row">
              <Input label="Default warranty days" type="number" min={0} value={f.warrantyDays} onChange={(e) => set("warrantyDays", Number(e.target.value))} />
              <Input label="Warranty coverage" value={f.warrantyCoverage} onChange={(e) => set("warrantyCoverage", e.target.value)} />
            </div>
            <Switch label="Water damage voids the warranty" checked={f.warrantyExcludeWater} onCheckedChange={(v: boolean) => set("warrantyExcludeWater", v)} />
            <Switch label="Accept trade-ins" checked={f.tradeInEnabled} onCheckedChange={(v: boolean) => set("tradeInEnabled", v)} />
            <Textarea label="Trade-in policy" rows={2} value={f.tradeInPolicy} onChange={(e) => set("tradeInPolicy", e.target.value)} />
            <Textarea label="Service terms" rows={2} value={f.serviceTerms} onChange={(e) => set("serviceTerms", e.target.value)} />
            <Input label="Payment terms" value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            <div className="nv-actions" style={{ justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
              <Button size="lg" onClick={submit} loading={loading}><Check size={16} />Create account</Button>
            </div>
          </>
        )}
      </div>
      <span className="nv-muted">Already have an account? <Link to="/login" style={{ textDecoration: "underline" }}>Sign in</Link></span>
    </AuthLayout>
  );
}

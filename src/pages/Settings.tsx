import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck, CircleX, LogOut } from "lucide-react";

import { Alert } from "@/components/arc/alert/alert";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Switch } from "@/components/arc/switch/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { Textarea } from "@/components/arc/textarea/textarea";
import { PageHead } from "@/components/app/PageHead";
import { useSupabaseConnect } from "@/hooks/useSupabaseConnect";
import { toast } from "@/hooks/useToast";
import { formatPhoneNumber } from "@/lib/phone";
import { printBarcodeLabel, printReceipt } from "@/lib/print";
import { type AppSettings, useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const CURRENCIES = [{ value: "$", label: "$ USD" }, { value: "€", label: "€ EUR" }, { value: "£", label: "£ GBP" }, { value: "¥", label: "¥ JPY" }, { value: "₹", label: "₹ INR" }];
const NOTIFS = [
  ["newTicket", "New ticket", "Alert when a ticket is created"],
  ["newSale", "New sale", "Alert when a POS sale completes"],
  ["newCustomer", "New customer", "Alert when a customer is added"],
  ["appointment", "Appointments", "Alert for upcoming appointments"],
  ["newMessage", "Customer email", "Alert when a customer emails you"],
] as const;
const PRINTER_KEY = "novaops_printer_settings";

type Printer = { productName?: string; serialNumber?: string } | null;
const read = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
const squareHeaders = (s: AppSettings) => ({ "x-square-access-token": s.squareAccessToken, "x-square-location-id": s.squareLocationId, "x-square-application-id": s.squareApplicationId || "", "x-square-sandbox": s.squareSandbox ? "true" : "false" });

export default function SettingsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const settings = useAppStore((s) => s.settings);
  const notif = useAppStore((s) => s.notificationPrefs);
  const user = useAppStore((s) => s.user);
  const conn = useSupabaseConnect();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [sqState, setSqState] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
  const [sqMsg, setSqMsg] = useState("");
  const [sqSaving, setSqSaving] = useState(false);
  const [printer, setPrinter] = useState(() => ({ autoPrintReceipt: true, autoPrintBarcode: true, ...read(PRINTER_KEY, {}) }));
  const [thermal, setThermal] = useState<Printer>(() => read("novaops_thermal_printer", null));
  const [label, setLabel] = useState<Printer>(() => read("novaops_label_printer", null));
  const [sbOpen, setSbOpen] = useState(false);
  const [signOut, setSignOut] = useState(false);
  const [diag, setDiag] = useState<{ step: string; ok: boolean; message: string }[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);
  const [pw, setPw] = useState({ next: "", confirm: "" });

  const tab = params.get("tab") || "business";
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { setForm(settings); }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await useAppStore.getState().saveSettings({ ...form });
      toast.success("Settings saved", "Your business settings have been updated");
    } catch (e) {
      toast.danger("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const testSquare = useCallback(async (s: AppSettings = form) => {
    if (!s.squareAccessToken || !s.squareLocationId) { setSqState("disconnected"); return setSqMsg("Enter your access token and location ID first."); }
    setSqState("checking");
    setSqMsg("");
    try {
      const res = await fetch("/api/square/connection-test", { headers: squareHeaders(s) });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.statusMessage || json.message || "Connection failed");
      setSqState("connected");
      setSqMsg(`Connected to location: ${json.locationName}`);
    } catch (e) {
      setSqState("disconnected");
      setSqMsg((e as Error).message);
    }
  }, [form]);

  const saveSquare = async () => {
    setSqSaving(true);
    try {
      const st = useAppStore.getState();

      st.patchSettings({ squareAccessToken: form.squareAccessToken, squareLocationId: form.squareLocationId, squareApplicationId: form.squareApplicationId, squareSandbox: form.squareSandbox });
      await st.saveSquareConfig();
      await testSquare();
    } catch (e) {
      toast.danger("Could not save Square settings", (e as Error).message);
    } finally {
      setSqSaving(false);
    }
  };

  useEffect(() => {
    if (settings.squareAccessToken && settings.squareLocationId) void testSquare(settings);
    if (conn.hasCredentials) void conn.testConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePrinter = (next = printer) => { localStorage.setItem(PRINTER_KEY, JSON.stringify(next)); setPrinter(next); toast.success("Printer settings saved"); };

  const pair = async (type: "thermal" | "label") => {
    const usb = (navigator as any).usb;

    if (!usb) return void toast.danger("WebUSB unavailable", "Use Chrome or Edge to pair a USB printer, or print through the system dialog.");
    try {
      const d = await usb.requestDevice({ filters: [] });
      const data = { productName: d.productName || "USB printer", serialNumber: d.serialNumber || "Unknown", vendorId: d.vendorId, productId: d.productId };

      localStorage.setItem(type === "thermal" ? "novaops_thermal_printer" : "novaops_label_printer", JSON.stringify(data));
      (type === "thermal" ? setThermal : setLabel)(data);
      toast.success(`${type === "thermal" ? "Thermal" : "Label"} printer linked`);
    } catch (e: any) {
      if (e.name !== "NotFoundError" && !e.message?.includes("No device selected")) toast.danger("Could not link printer", e.message);
    }
  };
  const unpair = (type: "thermal" | "label") => { localStorage.removeItem(type === "thermal" ? "novaops_thermal_printer" : "novaops_label_printer"); (type === "thermal" ? setThermal : setLabel)(null); };

  const exportBackup = () => {
    const st = useAppStore.getState();
    const url = URL.createObjectURL(new Blob([JSON.stringify({ settings: st.settings, tickets: st.tickets, customers: st.customers, inventory: st.inventory }, null, 2)], { type: "application/json" }));

    Object.assign(document.createElement("a"), { href: url, download: `novaops-backup-${new Date().toISOString().split("T")[0]}.json` }).click();
    URL.revokeObjectURL(url);
  };

  const diagnostics = async () => {
    setDiag([]);
    setDiagRunning(true);

    const out: typeof diag = [];
    const push = (step: string, ok: boolean, message: string) => { out.push({ step, ok, message }); setDiag([...out]); };
    const sb = getSupabase();

    if (!sb) { push("Supabase client", false, "Supabase client is not configured."); return setDiagRunning(false); }
    push("Supabase client", true, "Client initialized.");
    try {
      const { data: { session }, error } = await sb.auth.getSession();

      if (error) throw error;
      session ? push("Supabase session", true, `Signed in as ${session.user.email}`) : push("Supabase session", false, "No active session.");
    } catch (e) { push("Supabase session", false, (e as Error).message); }
    try {
      const { data, error } = await sb.from("tickets").select("id").limit(1);

      if (error) throw error;
      push("Database access", true, `Queried tickets (${data.length} record${data.length === 1 ? "" : "s"}).`);
    } catch (e) { push("Database access", false, `Query failed. Check RLS or connectivity: ${(e as Error).message}`); }
    try {
      const r = await fetch("/api/square/connection-test", { headers: squareHeaders(form) });
      const j = await r.json().catch(() => ({}));

      push("Square API", r.ok, r.ok ? `Square responded: ${JSON.stringify(j)}` : j.statusMessage || j.message || `HTTP ${r.status}`);
    } catch (e) { push("Square API", false, (e as Error).message); }
    try {
      const r = await fetch("/api/square/payment-readiness", { headers: squareHeaders(form) });
      const j = await r.json().catch(() => ({}));

      if (r.ok && j.ok) push("Square payment readiness", true, `${j.sandbox ? "Sandbox" : "Production"}: ${j.checks.map((c: any) => `${c.name} ${c.ok ? "ok" : "failed"}`).join(", ")}`);
      else push("Square payment readiness", false, (j.checks || []).filter((c: any) => !c.ok).map((c: any) => `${c.name}: ${c.detail}`).join("; ") || j.message || `HTTP ${r.status}`);
    } catch (e) { push("Square payment readiness", false, (e as Error).message); }
    setDiagRunning(false);
  };

  const changePassword = async () => {
    if (pw.next.length < 6) return void toast.warning("Weak password", "Use at least 6 characters.");
    if (pw.next !== pw.confirm) return void toast.danger("Passwords do not match");

    const { error } = (await getSupabase()?.auth.updateUser({ password: pw.next })) ?? { error: new Error("Not connected") };

    if (error) return void toast.danger("Could not change password", error.message);
    setPw({ next: "", confirm: "" });
    toast.success("Password updated");
  };

  const doSignOut = async () => { await useAppStore.getState().logout(); navigate("/login", { replace: true }); };
  const email = (user?.email as string) || settings.email || "";
  const sqTone = sqState === "connected" ? "success" : sqState === "disconnected" ? "danger" : "neutral";

  return (
    <>
      <PageHead title="Settings" subtitle="Business, integrations, printing and account" />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <div className="nv-tabs-scroll">
          <TabsList>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="business">
          <div className="nv-panel nv-form" style={{ marginTop: 16, maxWidth: 680 }}>
            <Input label="Business name" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            <div className="nv-form-row">
              <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set("phone", formatPhoneNumber(e.target.value))} />
            </div>
            <Textarea label="Address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
            <SegmentedControl label="Currency" value={form.currency} onValueChange={(v: string) => set("currency", v)} options={CURRENCIES} />
            <div className="nv-form-row">
              <Input label="Tax rate (%)" type="number" min={0} step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
              <PasswordField label="Lock screen PIN" description="Four digits" inputMode="numeric" maxLength={4} value={form.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
            <Input label="Ticket statuses" description="Comma separated, in workflow order" value={form.statuses} onChange={(e) => set("statuses", e.target.value)} />
            <div><Button onClick={save} loading={saving}>Save changes</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="nv-stack" style={{ marginTop: 16, maxWidth: 680, gap: 16 }}>
            <div className="nv-panel nv-stack">
              <div className="nv-actions" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Supabase database</h2><Badge tone={conn.status.connected ? "success" : "neutral"}>{conn.status.connected ? `Connected${conn.status.projectName ? ` · ${conn.status.projectName}` : ""}` : conn.hasCredentials ? "Saved" : "Environment"}</Badge></div>
              <p className="nv-muted" style={{ margin: 0 }}>{conn.hasCredentials ? `Using ${conn.url}` : "Using the project configured at build time. Connect your own project to override it."}</p>
              <div className="nv-actions">
                <Button variant="secondary" onClick={() => setSbOpen(true)}>{conn.hasCredentials ? "Change project" : "Connect a project"}</Button>
                {conn.hasCredentials && <Button variant="ghost" onClick={conn.disconnect}>Disconnect</Button>}
              </div>
            </div>

            <div className="nv-panel nv-form">
              <div className="nv-actions" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>Square</h2><Badge tone={sqTone}>{sqState === "checking" ? "Checking…" : sqState === "connected" ? "Connected" : sqState === "disconnected" ? "Not connected" : "Not tested"}</Badge></div>
              <PasswordField label="Access token" value={form.squareAccessToken} onChange={(e) => set("squareAccessToken", e.target.value)} />
              <div className="nv-form-row">
                <Input label="Location ID" value={form.squareLocationId} onChange={(e) => set("squareLocationId", e.target.value)} />
                <Input label="Application ID" description="Needed for card and Afterpay checkout" value={form.squareApplicationId} onChange={(e) => set("squareApplicationId", e.target.value)} />
              </div>
              <Switch label="Sandbox mode" checked={form.squareSandbox} onCheckedChange={(v: boolean) => set("squareSandbox", v)} />
              {sqMsg && <Alert tone={sqState === "connected" ? "success" : "danger"} title={sqMsg} />}
              <div className="nv-actions"><Button onClick={saveSquare} loading={sqSaving}>Save and test</Button><Button variant="ghost" onClick={() => void testSquare()}>Test only</Button></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="printing">
          <div className="nv-stack" style={{ marginTop: 16, maxWidth: 680, gap: 16 }}>
            <div className="nv-panel nv-stack">
              <h2>Automation</h2>
              <Switch label="Print receipt after each sale" checked={printer.autoPrintReceipt} onCheckedChange={(v: boolean) => savePrinter({ ...printer, autoPrintReceipt: v })} />
              <Switch label="Print a barcode label for new tickets" checked={printer.autoPrintBarcode} onCheckedChange={(v: boolean) => savePrinter({ ...printer, autoPrintBarcode: v })} />
            </div>
            {([["thermal", "Thermal receipt printer", thermal], ["label", "Label printer", label]] as const).map(([type, name, p]) => (
              <div key={type} className="nv-panel nv-actions" style={{ justifyContent: "space-between" }}>
                <div><strong style={{ fontWeight: 500 }}>{name}</strong><div className="nv-muted" style={{ fontSize: 13 }}>{p ? `${p.productName} · ${p.serialNumber}` : "Not linked. Prints use the system dialog."}</div></div>
                <div className="nv-actions">{p ? <Button variant="ghost" size="sm" onClick={() => unpair(type)}>Unlink</Button> : <Button size="sm" variant="secondary" onClick={() => pair(type)}>Link USB printer</Button>}</div>
              </div>
            ))}
            <div className="nv-actions">
              <Button variant="secondary" onClick={() => void printReceipt({ businessName: form.businessName || "NovaOps Demo", businessAddress: form.address || "123 Tech Lane", businessPhone: form.phone || "555-0123", date: new Date().toLocaleString(), items: [{ name: "Hardware diagnostic", qty: 1, price: 49 }, { name: "Screen replacement", qty: 1, price: 120 }], subtotal: 169, tax: 16.9, total: 185.9, currency: form.currency || "$" })}>Test receipt</Button>
              <Button variant="secondary" onClick={() => void printBarcodeLabel({ sku: "TKT-99999", name: "TEST LABEL", customerName: "John Doe", price: 0, currency: form.currency || "$" })}>Test label</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="nv-panel nv-stack" style={{ marginTop: 16, maxWidth: 680 }}>
            {NOTIFS.map(([key, name, desc]) => (
              <div key={key} className="nv-row">
                <div className="nv-row-main"><strong>{name}</strong><span>{desc}</span></div>
                <Switch aria-label={name} checked={notif[key]} onCheckedChange={(v: boolean) => useAppStore.getState().setNotificationPrefs({ [key]: v })} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="nv-stack" style={{ marginTop: 16, maxWidth: 680, gap: 16 }}>
            <div className="nv-panel nv-actions"><Avatar name={email || form.businessName || "NovaOps"} size="lg" /><div><strong style={{ fontWeight: 500 }}>{email || "Signed in"}</strong><div className="nv-muted">{form.businessName || "NovaOps"}</div></div></div>
            <div className="nv-panel nv-form">
              <h2>Change password</h2>
              <div className="nv-form-row">
                <PasswordField label="New password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                <PasswordField label="Confirm password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </div>
              <div><Button variant="secondary" onClick={changePassword} disabled={!pw.next}>Update password</Button></div>
            </div>
            <div><Button variant="danger" onClick={() => setSignOut(true)}><LogOut size={14} />Sign out</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="nv-stack" style={{ marginTop: 16, maxWidth: 680, gap: 16 }}>
            <div className="nv-panel nv-stack">
              <h2>Data</h2>
              <p className="nv-muted" style={{ margin: 0 }}>Download a JSON backup of your settings, tickets, customers and inventory.</p>
              <div><Button variant="secondary" onClick={exportBackup}>Export backup</Button></div>
            </div>
            <div className="nv-panel nv-stack">
              <div className="nv-actions" style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>System diagnostics</h2><Button size="sm" variant="secondary" onClick={diagnostics} loading={diagRunning}>Run checks</Button></div>
              {diag.map((d) => <div key={d.step} className="nv-row">{d.ok ? <CircleCheck size={16} color="var(--success)" /> : <CircleX size={16} color="var(--danger)" />}<div className="nv-row-main"><strong>{d.step}</strong><span style={{ whiteSpace: "normal" }}>{d.message}</span></div></div>)}
            </div>
            <div className="nv-panel nv-stack">
              <h2 style={{ color: "var(--danger)" }}>Danger zone</h2>
              <p className="nv-muted" style={{ margin: 0 }}>Clears everything stored in this browser (cached settings, PIN, printer links) and reloads. Data in Supabase is not deleted.</p>
              <HoldToConfirm label="Hold to clear local data" confirmedLabel="Cleared" tone="danger" onConfirm={() => { localStorage.clear(); window.location.reload(); }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={sbOpen} onOpenChange={setSbOpen}>
        <DialogContent title="Connect Supabase" description="Paste the project URL and anon key from your Supabase project settings">
          <div className="nv-form">
            {conn.status.error && <Alert tone="danger" title={conn.status.error} />}
            <Input label="Project URL" type="url" placeholder="https://xyzabc.supabase.co" value={conn.url} onChange={(e) => conn.setUrl(e.target.value)} />
            <PasswordField label="Anon key" value={conn.key} onChange={(e) => conn.setKey(e.target.value)} />
            <Button loading={conn.status.checking} onClick={() => conn.saveAndConnect(conn.url, conn.key)}>Test and connect</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={signOut} onOpenChange={setSignOut}>
        <DialogContent title="Sign out?" description="You will need to sign in again to use NovaOps.">
          <div className="nv-actions" style={{ justifyContent: "flex-end" }}><Button variant="ghost" onClick={() => setSignOut(false)}>Cancel</Button><Button variant="danger" onClick={doSignOut}>Sign out</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

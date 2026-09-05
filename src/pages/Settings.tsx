import { useEffect, useState } from "react";
import { Alert, Button, FieldError, InputGroup, Label, Switch, TextArea, TextField } from "@heroui/react";
import { CircleCheck, CircleX, Mail, MessageSquarePlus, PlugZap, Plus, Save, Tablet, Trash2, UserRoundPlus, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { CannedResponse, DayHours, Technician } from "@/types/domain";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
  sbDeleteTechnician,
  sbFetchShopSettings,
  sbFetchSupplierEmails,
  sbFetchTechnicians,
  sbUpdateShopSettings,
  sbUpdateSupplierEmails,
  sbUpsertTechnician,
} from "@/lib/supabase";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { checkDeviceStatus, checkPaymentReadiness, getSquareCredentials, pairSquareDevice, saveSquareCredentials, type PaymentReadiness } from "@/lib/square";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_HOURS: DayHours = { open: "09:00", close: "18:00", closed: false };
const TECHNICIAN_COLORS = ["#7C3AED", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

function SupplierEmailsSettings() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sbFetchSupplierEmails().then(({ data }) => {
      setLoading(false);
      if (data) setEmails(data);
    });
  }, []);

  const persist = async (next: string[]) => {
    setEmails(next);
    setSaving(true);
    setSaved(await sbUpdateSupplierEmails(next));
    setSaving(false);
  };

  const handleAdd = () => {
    const entry = newEntry.trim().toLowerCase();

    if (!entry || emails.includes(entry)) return;
    persist([...emails, entry]);
    setNewEntry("");
  };

  const handleRemove = (entry: string) => {
    persist(emails.filter((e) => e !== entry));
  };

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6">
      <h3 className="m-0 mb-1 text-lg font-bold text-foreground">Parts Supplier Emails</h3>
      <p className="m-0 mb-4 text-sm text-muted">
        Shipping-notification emails from these addresses (or whole domains, e.g. <code className="rounded bg-surface-tertiary px-1 py-0.5">mobilesentrix.com</code>)
        are automatically parsed for tracking numbers and delivery dates, shown in Messages → Parts Orders, and
        added to the Calendar — see Messages → Sync Gmail.
      </p>

      {loading ? (
        <p className="m-0 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {emails.length === 0 && <p className="m-0 text-sm text-muted">No suppliers configured yet.</p>}
          {emails.map((e) => (
            <span key={e} className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
              <Mail className="size-3.5" />
              {e}
              <button aria-label={`Remove ${e}`} type="button" onClick={() => handleRemove(e)}>
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <TextField className="flex-1" value={newEntry} onChange={setNewEntry}>
          <InputGroup>
            <InputGroup.Input placeholder="support@injuredgadgets.com or mobilesentrix.com" />
          </InputGroup>
        </TextField>
        <Button isDisabled={!newEntry.trim() || saving} variant="outline" onPress={handleAdd}>
          <Plus className="size-4" />
          <span>Add</span>
        </Button>
      </div>
      {saved && <p className="m-0 mt-2 text-xs text-success">Saved.</p>}
    </div>
  );
}

function SquareSettings() {
  const current = getSquareCredentials();
  const [accessToken, setAccessToken] = useState(current.accessToken);
  const [locationId, setLocationId] = useState(current.locationId);
  const [applicationId, setApplicationId] = useState(current.applicationId);
  const [sandbox, setSandbox] = useState(current.sandbox);
  const [deviceId, setDeviceId] = useState(current.deviceId);
  const [pairing, setPairing] = useState<{ deviceCodeId: string; pairingCode: string } | null>(null);
  const [pairingStatus, setPairingStatus] = useState("");
  const [readiness, setReadiness] = useState<PaymentReadiness | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSave = () => {
    saveSquareCredentials({ accessToken, locationId, applicationId, sandbox, deviceId });
  };

  const handlePair = async () => {
    handleSave();
    setPairingStatus("Generating pairing code…");
    try {
      const result = await pairSquareDevice();

      setPairing({ deviceCodeId: result.deviceCodeId, pairingCode: result.pairingCode });
      setPairingStatus("Enter this code on the terminal, then wait for it to connect.");

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await checkDeviceStatus(result.deviceCodeId);

        if (status.status === "PAIRED" && status.deviceId) {
          setDeviceId(status.deviceId);
          saveSquareCredentials({ deviceId: status.deviceId });
          setPairingStatus(`Paired — device ${status.deviceId}`);
          setPairing(null);

          return;
        }
      }
      setPairingStatus("Pairing timed out — try again.");
    } catch (e) {
      setPairingStatus(e instanceof Error ? e.message : "Pairing failed.");
    }
  };

  const handleCheckReadiness = async () => {
    handleSave();
    setChecking(true);
    try {
      setReadiness(await checkPaymentReadiness());
    } catch (e) {
      setReadiness({ ok: false, sandbox, checks: [{ name: "Request", ok: false, detail: e instanceof Error ? e.message : "Check failed" }] });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6">
      <h3 className="m-0 mb-1 text-lg font-bold text-foreground">Square Payments</h3>
      <p className="m-0 mb-4 text-sm text-muted">
        Card, Terminal, and Afterpay checkout in Tickets use these credentials — set them here or via
        SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID / SQUARE_APPLICATION_ID env vars.
      </p>

      <div className="flex flex-col gap-4">
        <TextField className="flex flex-col gap-1.5" type="password" value={accessToken} onChange={setAccessToken}>
          <Label>Access Token</Label>
          <InputGroup>
            <InputGroup.Input placeholder="EAAAl..." />
          </InputGroup>
          <FieldError />
        </TextField>
        <TextField className="flex flex-col gap-1.5" value={locationId} onChange={setLocationId}>
          <Label>Location ID</Label>
          <InputGroup>
            <InputGroup.Input />
          </InputGroup>
        </TextField>
        <TextField className="flex flex-col gap-1.5" value={applicationId} onChange={setApplicationId}>
          <Label>Application ID</Label>
          <InputGroup>
            <InputGroup.Input placeholder="sq0idp-... (needed for card payments)" />
          </InputGroup>
        </TextField>
        <div className="flex items-center gap-3">
          <Switch isSelected={sandbox} onChange={setSandbox}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-sm text-foreground">Sandbox mode (safe for testing)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={handleSave}>
            <Save className="size-4" />
            <span>Save</span>
          </Button>
          <Button isDisabled={checking} variant="outline" onPress={handleCheckReadiness}>
            <PlugZap className="size-4" />
            <span>Check Payment Readiness</span>
          </Button>
        </div>

        {readiness && (
          <div className="rounded-2xl border border-border p-3">
            {readiness.checks.map((c) => (
              <div key={c.name} className="flex items-start gap-2 py-1 text-sm">
                {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-danger" />}
                <div>
                  <strong className="text-foreground">{c.name}</strong>
                  <p className="m-0 text-xs text-muted">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="m-0 mb-2 text-sm font-semibold text-foreground">Terminal device</p>
          {deviceId && <p className="m-0 mb-2 text-xs text-muted">Paired device: {deviceId}</p>}
          <Button variant="outline" onPress={handlePair}>
            <Tablet className="size-4" />
            <span>{pairing ? `Pairing code: ${pairing.pairingCode}` : "Pair a Terminal"}</span>
          </Button>
          {pairingStatus && <p className="m-0 mt-2 text-xs text-muted">{pairingStatus}</p>}
        </div>
      </div>
    </div>
  );
}

function ShopSettingsPanel() {
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [taxRate, setTaxRate] = useState("0");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [newCanned, setNewCanned] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sbFetchShopSettings().then(({ data }) => {
      setLoading(false);
      if (!data) return;
      setBusinessName(data.business_name || "");
      setBusinessAddress(data.business_address || "");
      setBusinessPhone(data.business_phone || "");
      setHours(data.business_hours || {});
      setTaxRate(String(data.tax_rate ?? 0));
      setReceiptFooter(data.receipt_footer || "");
      setNotifyOnStatusChange(!!data.notify_on_status_change);
      setCannedResponses(data.canned_responses || []);
    });
  }, []);

  const dayHours = (key: string): DayHours => hours[key] || DEFAULT_HOURS;

  const setDayHours = (key: string, patch: Partial<DayHours>) => {
    setHours((h) => ({ ...h, [key]: { ...dayHours(key), ...patch } }));
  };

  const handleAddCanned = () => {
    if (!newCanned.title.trim() || !newCanned.body.trim()) return;
    setCannedResponses((rs) => [...rs, { title: newCanned.title.trim(), body: newCanned.body.trim() }]);
    setNewCanned({ title: "", body: "" });
  };

  const handleRemoveCanned = (idx: number) => {
    setCannedResponses((rs) => rs.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { data } = await sbUpdateShopSettings({
      business_name: businessName,
      business_address: businessAddress,
      business_phone: businessPhone,
      business_hours: hours,
      tax_rate: Number(taxRate) || 0,
      receipt_footer: receiptFooter,
      notify_on_status_change: notifyOnStatusChange,
      canned_responses: cannedResponses,
    });

    setSaving(false);
    if (data) setSaved(true);
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-border bg-surface p-6">
        <p className="m-0 text-sm text-muted">Loading shop settings…</p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6">
      <h3 className="m-0 mb-1 text-lg font-bold text-foreground">Shop Settings</h3>
      <p className="m-0 mb-4 text-sm text-muted">Business hours, tax rate, receipt footer, and customer notifications.</p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField className="flex flex-col gap-1.5 sm:col-span-2" value={businessName} onChange={setBusinessName}>
          <Label>Business Name</Label>
          <InputGroup>
            <InputGroup.Input placeholder="Appears on printed receipts" />
          </InputGroup>
        </TextField>
        <TextField className="flex flex-col gap-1.5" value={businessAddress} onChange={setBusinessAddress}>
          <Label>Address</Label>
          <InputGroup>
            <InputGroup.Input />
          </InputGroup>
        </TextField>
        <TextField className="flex flex-col gap-1.5" value={businessPhone} onChange={setBusinessPhone}>
          <Label>Phone</Label>
          <InputGroup>
            <InputGroup.Input />
          </InputGroup>
        </TextField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="mb-1 block text-micro font-bold uppercase text-muted">Business Hours</span>
        {DAYS.map((d) => {
          const dh = dayHours(d.key);

          return (
            <div key={d.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-secondary/40 p-2.5">
              <span className="w-24 shrink-0 text-sm text-foreground">{d.label}</span>
              {dh.closed ? (
                <span className="flex-1 text-sm text-muted">Closed</span>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                    type="time"
                    value={dh.open}
                    onChange={(e) => setDayHours(d.key, { open: e.target.value })}
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                    type="time"
                    value={dh.close}
                    onChange={(e) => setDayHours(d.key, { close: e.target.value })}
                  />
                </div>
              )}
              <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
                <Switch isSelected={dh.closed} onChange={(v) => setDayHours(d.key, { closed: v })}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
                Closed
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField className="flex flex-col gap-1.5" type="number" value={taxRate} onChange={setTaxRate}>
          <Label>Tax Rate (%)</Label>
          <InputGroup>
            <InputGroup.Input />
          </InputGroup>
        </TextField>
        <div className="flex items-end gap-3 pb-2">
          <Switch isSelected={notifyOnStatusChange} onChange={setNotifyOnStatusChange}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-sm text-foreground">Email customers when a ticket&rsquo;s status changes</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <Label>Receipt Footer</Label>
        <TextArea placeholder="Thank you for choosing us! 90-day warranty on all repairs." rows={2} value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <span className="mb-2 flex items-center gap-1.5 text-micro font-bold uppercase text-muted">
          <MessageSquarePlus className="size-3.5" />
          Canned Replies
        </span>
        <p className="m-0 mb-3 text-xs text-muted">Quick-insert templates available in Messages and Customer Chat reply boxes.</p>

        {cannedResponses.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {cannedResponses.map((r, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-surface-secondary/40 p-3">
                <div className="min-w-0">
                  <strong className="block text-sm text-foreground">{r.title}</strong>
                  <p className="m-0 truncate text-xs text-muted">{r.body}</p>
                </div>
                <Button isIconOnly aria-label="Remove canned reply" size="sm" variant="ghost" onPress={() => handleRemoveCanned(idx)}>
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
          <TextField className="flex flex-col gap-1" value={newCanned.title} onChange={(v) => setNewCanned((c) => ({ ...c, title: v }))}>
            <InputGroup>
              <InputGroup.Input placeholder="Title, e.g. Ready for pickup" />
            </InputGroup>
          </TextField>
          <TextArea placeholder="Message body…" rows={2} value={newCanned.body} onChange={(e) => setNewCanned((c) => ({ ...c, body: e.target.value }))} />
          <Button isDisabled={!newCanned.title.trim() || !newCanned.body.trim()} variant="outline" onPress={handleAddCanned}>
            <Plus className="size-4" />
            <span>Add Canned Reply</span>
          </Button>
        </div>
      </div>

      <Button className="mt-6" isDisabled={saving} variant="primary" onPress={handleSave}>
        <Save className="size-4" />
        <span>{saving ? "Saving…" : saved ? "Saved!" : "Save Shop Settings"}</span>
      </Button>
    </div>
  );
}

function TechniciansSettings() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sbFetchTechnicians().then(({ data }) => {
      setLoading(false);
      if (data) setTechnicians(data);
    });
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const color = TECHNICIAN_COLORS[technicians.length % TECHNICIAN_COLORS.length];
    const { data } = await sbUpsertTechnician({ name: newName.trim(), color, active: true });

    if (data) {
      setTechnicians((ts) => [...ts, data]);
      setNewName("");
    }
  };

  const handleRemove = async (id: number) => {
    setTechnicians((ts) => ts.filter((t) => t.id !== id));
    await sbDeleteTechnician(id);
  };

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6">
      <h3 className="m-0 mb-1 text-lg font-bold text-foreground">Technicians</h3>
      <p className="m-0 mb-4 text-sm text-muted">Assign repairs to a technician from the Tickets page.</p>

      {loading ? (
        <p className="m-0 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {technicians.length === 0 && <p className="m-0 text-sm text-muted">No technicians added yet.</p>}
          {technicians.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-secondary/40 p-2.5">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </span>
              <Button isIconOnly aria-label={`Remove ${t.name}`} size="sm" variant="ghost" onPress={() => handleRemove(t.id)}>
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <TextField className="flex-1" value={newName} onChange={setNewName}>
          <InputGroup>
            <InputGroup.Input placeholder="Technician name" />
          </InputGroup>
        </TextField>
        <Button isDisabled={!newName.trim()} variant="outline" onPress={handleAdd}>
          <UserRoundPlus className="size-4" />
          <span>Add</span>
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const envLocked = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [key, setKey] = useState(current.anonKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("sb_url", url);
    localStorage.setItem("sb_anon_key", key);
    setSaved(true);
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div>
      <PageHeader
        description="Connect this console to the same Supabase project as your website."
        eyebrow="Configuration"
        title="Settings"
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-border bg-surface p-6">
          {envLocked && (
            <Alert className="mb-4" role="status" status="default">
              <Alert.Content>
                <Alert.Description>
                  Supabase is configured via environment variables (VITE_SUPABASE_URL /
                  VITE_SUPABASE_ANON_KEY) — use the same values your Mobicare website deployment
                  uses. The fields below are a fallback for local/manual setup only.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {isSupabaseConfigured() && (
            <Alert className="mb-4" role="status" status="success">
              <Alert.Indicator>
                <CircleCheck className="size-4" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Description>Supabase is connected.</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <TextField
              isDisabled={envLocked}
              className="flex flex-col gap-1.5"
              value={url}
              onChange={setUrl}
            >
              <Label>Supabase URL</Label>
              <InputGroup>
                <InputGroup.Input placeholder="https://your-project.supabase.co" />
              </InputGroup>
              <FieldError />
            </TextField>
            <TextField
              isDisabled={envLocked}
              className="flex flex-col gap-1.5"
              type="password"
              value={key}
              onChange={setKey}
            >
              <Label>Supabase Anon Key</Label>
              <InputGroup>
                <InputGroup.Input />
              </InputGroup>
            </TextField>

            {!envLocked && (
              <Button variant="primary" onPress={handleSave}>
                <Save className="size-4" />
                <span>{saved ? "Saved — reloading…" : "Save & Reload"}</span>
              </Button>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-4 text-sm text-muted">
            <p className="m-0 mb-2 font-semibold text-foreground">To manage website bookings from here:</p>
            <ol className="m-0 list-decimal space-y-1 pl-5">
              <li>Sign in with a Supabase account that exists on the shared project.</li>
              <li>
                Add that account&rsquo;s user id to <code className="rounded bg-surface-tertiary px-1.5 py-0.5">public.staff_users</code>{" "}
                (role <code className="rounded bg-surface-tertiary px-1.5 py-0.5">admin</code>) — the same allowlist the
                website&rsquo;s admin portal uses.
              </li>
              <li>Run the migration in <code className="rounded bg-surface-tertiary px-1.5 py-0.5">supabase/migrations/20260904_bookings_ticket_link.sql</code> once.</li>
            </ol>
          </div>
        </div>

        <SquareSettings />

        <ShopSettingsPanel />

        <TechniciansSettings />

        <div className="xl:col-span-2">
          <SupplierEmailsSettings />
        </div>
      </div>
    </div>
  );
}

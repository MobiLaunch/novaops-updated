import { useState } from "react";
import { Alert, Button, FieldError, InputGroup, Label, Switch, TextField } from "@heroui/react";
import { CircleCheck, CircleX, PlugZap, Save, Tablet } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { checkDeviceStatus, checkPaymentReadiness, getSquareCredentials, pairSquareDevice, saveSquareCredentials, type PaymentReadiness } from "@/lib/square";

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
    <div className="max-w-xl rounded-[28px] border border-border bg-surface p-6">
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

      <div className="max-w-xl rounded-[28px] border border-border bg-surface p-6">
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

      <div className="mt-6">
        <SquareSettings />
      </div>
    </div>
  );
}

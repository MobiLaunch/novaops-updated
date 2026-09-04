import { useState } from "react";
import { Alert, Button, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import { CircleCheck, Save } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

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
    </div>
  );
}

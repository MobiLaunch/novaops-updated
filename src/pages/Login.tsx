import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Input } from "@/components/arc/input/input";
import { PasswordField } from "@/components/arc/password-field/password-field";
import { useSupabaseConnect } from "@/hooks/useSupabaseConnect";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ensureProfile } from "@/lib/profile";
import { getSupabase, isElectron } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Login() {
  const navigate = useNavigate();
  const sb = getSupabase();
  const conn = useSupabaseConnect();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);
  const googleOn = !!sb && import.meta.env.VITE_SOCIAL_GOOGLE === "true";
  const facebookOn = !!sb && import.meta.env.VITE_SOCIAL_FACEBOOK === "true";

  const finish = async (user: any) => navigate((await ensureProfile(user)) ? "/intro?from=register" : "/dashboard", { replace: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return setError("Connect a Supabase project first.");
    if (!email || !password) return setError("Enter your email and password");
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await sb.auth.signInWithPassword({ email, password });

      if (err) throw err;
      if (data.user) await finish(data.user);
    } catch (err) {
      setError((err as Error).message || "Could not sign in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "facebook") => {
    if (!sb) return;
    setLoading(true);
    setError("");
    try {
      const electron = (window as any).electronAPI;

      if (provider === "google" && isElectron()) {
        const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!url || !key) throw new Error("Supabase not configured");

        const result = await electron.startGoogleOAuth(url, key);

        if (!result.ok) throw new Error(result.error || "Google sign-in failed");

        const { data, error: err } = await sb.auth.exchangeCodeForSession(result.code);

        if (err) throw err;
        if (data?.user) return void (await finish(data.user));
        throw new Error("No session returned from OAuth");
      }

      const { error: err } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback`, ...(provider === "google" ? { queryParams: { access_type: "offline", prompt: "consent" } } : { scopes: "email,public_profile" }) },
      });

      if (err) throw err;
    } catch (err) {
      setError((err as Error).message || "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your shop">
      <form className="nv-form" onSubmit={submit}>
        {error && <Alert tone="danger" title={error} />}
        {!sb && <Alert tone="warning" title="No database connected" />}
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" loading={loading} size="lg">Sign in</Button>
        {(googleOn || facebookOn) && (
          <div className="nv-stack">
            {googleOn && <Button type="button" variant="secondary" onClick={() => oauth("google")}>Continue with Google</Button>}
            {facebookOn && <Button type="button" variant="secondary" onClick={() => oauth("facebook")}>Continue with Facebook</Button>}
          </div>
        )}
      </form>
      <div className="nv-actions" style={{ justifyContent: "space-between" }}>
        <span className="nv-muted">New here? <Link to="/register" style={{ textDecoration: "underline" }}>Create an account</Link></span>
        <Button variant="ghost" size="sm" onClick={() => setSetup(true)}>Database</Button>
      </div>

      <Dialog open={setup} onOpenChange={setSetup}>
        <DialogContent title="Connect your database" description="Paste the project URL and anon key from your Supabase project settings">
          <div className="nv-form">
            {conn.status.error && <Alert tone="danger" title={conn.status.error} />}
            <Input label="Project URL" type="url" placeholder="https://xyzabc.supabase.co" value={conn.url} onChange={(e) => conn.setUrl(e.target.value)} />
            <PasswordField label="Anon key" value={conn.key} onChange={(e) => conn.setKey(e.target.value)} />
            <Button loading={conn.status.checking} onClick={() => conn.saveAndConnect(conn.url, conn.key)}>Test and connect</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}

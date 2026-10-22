import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { ensureProfile } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase";
import { Skeleton } from "@/components/arc/skeleton/skeleton";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    const sb = getSupabase();

    if (!sb) return void navigate("/login", { replace: true });

    let done = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finalize = async (user: Parameters<typeof ensureProfile>[0]) => {
      if (done) return;
      done = true;
      setStatus("Setting up your account…");
      try {
        const isNew = await ensureProfile(user, (user.user_metadata?.full_name as string) ?? "");

        navigate(isNew ? "/intro" : "/dashboard", { replace: true });
      } catch {
        navigate("/dashboard", { replace: true });
      }
    };
    const fail = (msg: string, ms: number) => { setStatus(msg); timers.push(setTimeout(() => navigate("/login", { replace: true }), ms)); };

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) void finalize(session.user);
    });

    sb.auth.getSession().then(({ data: { session }, error }) => {
      if (error) return fail(error.message, 3000);
      if (session?.user) void finalize(session.user);
      else timers.push(setTimeout(() => !done && fail("Sign-in timed out. Redirecting to login…", 2000), 10_000));
    });

    return () => { subscription.unsubscribe(); timers.forEach(clearTimeout); };
  }, [navigate]);

  return <AuthLayout title={status}><Skeleton lines={2} /></AuthLayout>;
}

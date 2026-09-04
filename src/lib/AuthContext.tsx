import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getClient, isSupabaseConfigured } from "./supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getClient();

    if (!client) {
      setLoading(false);

      return;
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      login: async (email, password) => {
        if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
        const client = getClient()!;
        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) return { ok: false, error: error.message };
        setSession(data.session);

        return { ok: true };
      },
      logout: async () => {
        const client = getClient();

        if (client) await client.auth.signOut();
        setSession(null);
      },
    }),
    [session, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);

  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return ctx;
}

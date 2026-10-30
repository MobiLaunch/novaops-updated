import { useCallback, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { SB_KEY_KEY, SB_URL_KEY } from "@/lib/supabase";

export function useSupabaseConnect() {
  const [url, setUrl] = useState(() => localStorage.getItem(SB_URL_KEY) || "");
  const [key, setKey] = useState(() => localStorage.getItem(SB_KEY_KEY) || "");
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  const testConnection = useCallback(async (testUrl = url, testKey = key) => {
    if (!testUrl || !testKey) {
      setError("Enter both the project URL and the anon key.");

      return false;
    }
    setChecking(true);
    setError(null);
    setConnected(false);
    try {
      const probe = createClient(testUrl, testKey, { auth: { persistSession: false } });
      const { error: e } = await probe.auth.getSession();

      if (e && e.message !== "Auth session missing!") throw e;
      setConnected(true);
      setProjectName(new URL(testUrl).hostname.split(".")[0]);

      return true;
    } catch (err) {
      setError((err as Error)?.message || "Could not reach the Supabase project. Check the URL and key.");

      return false;
    } finally {
      setChecking(false);
    }
  }, [url, key]);

  // Credentials are read once at startup, so connecting reloads the page.
  const saveAndConnect = useCallback(async (newUrl: string, newKey: string) => {
    if (!(await testConnection(newUrl, newKey))) return false;
    localStorage.setItem(SB_URL_KEY, newUrl.trim());
    localStorage.setItem(SB_KEY_KEY, newKey.trim());
    setUrl(newUrl.trim());
    setKey(newKey.trim());
    window.location.reload();

    return true;
  }, [testConnection]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(SB_URL_KEY);
    localStorage.removeItem(SB_KEY_KEY);
    window.location.reload();
  }, []);

  return { url, key, setUrl, setKey, status: { connected, checking, error, projectName }, hasCredentials: !!url && !!key, testConnection, saveAndConnect, disconnect };
}

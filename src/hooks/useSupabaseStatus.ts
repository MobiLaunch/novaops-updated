import { useCallback, useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase";

export function useSupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  const check = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) return setStatus("disconnected");
    try {
      const { error } = await sb.from("profiles").select("id").limit(1);

      setStatus(error ? "disconnected" : "connected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  return { status, check };
}

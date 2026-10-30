import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";

import { toast } from "@/hooks/useToast";
import { flushQueue, pendingCount } from "@/lib/offlineQueue";

/** Tells the owner when the connection drops, and syncs queued sales when it returns. */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(pendingCount());

  useEffect(() => {
    const sync = async () => {
      if (!pendingCount()) return;
      const n = await flushQueue();

      if (n > 0) toast.success("Back online", `${n} sale${n === 1 ? "" : "s"} synced.`);
    };
    const up = () => { setOnline(true); void sync(); };
    const down = () => setOnline(false);
    const refresh = () => setPending(pendingCount());
    const t = setInterval(() => { if (navigator.onLine) void sync(); }, 30000);

    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    window.addEventListener("novaops-queue", refresh);
    void sync();

    return () => { clearInterval(t); window.removeEventListener("online", up); window.removeEventListener("offline", down); window.removeEventListener("novaops-queue", refresh); };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className="nv-offline" data-online={online ? "true" : "false"} role="status">
      {online ? <RefreshCw size={14} aria-hidden="true" /> : <CloudOff size={14} aria-hidden="true" />}
      <span>
        {online
          ? `Syncing ${pending} sale${pending === 1 ? "" : "s"} saved while you were offline…`
          : `You're offline. Cash and manual sales are saved on this device${pending ? ` (${pending} waiting)` : ""} and sync when you reconnect. Card payments need a connection.`}
      </span>
    </div>
  );
}

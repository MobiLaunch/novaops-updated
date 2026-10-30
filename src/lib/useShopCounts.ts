import { useEffect, useState } from "react";

import { useAppStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

export interface ShopCounts { low: number; toShip: number; unread: number; pendingBookings: number }

/** Small counters shown as badges in the sidebar; refreshed every 90 seconds. */
export function useShopCounts(): ShopCounts {
  const inventory = useAppStore((s) => s.inventory);
  const [remote, setRemote] = useState({ toShip: 0, unread: 0, pendingBookings: 0 });

  useEffect(() => {
    const sb = getSupabase();

    if (!sb) return;
    const load = async () => {
      const [o, m, b] = await Promise.all([
        sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
        sb.from("messages").select("id", { count: "exact", head: true }).eq("channel", "chat").eq("direction", "inbound").eq("read", false),
        sb.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setRemote({ toShip: o.count || 0, unread: m.count || 0, pendingBookings: b.count || 0 });
    };

    void load();
    const t = setInterval(() => void load(), 90000);

    return () => clearInterval(t);
  }, []);

  const low = inventory.filter((i: any) => i.itemType !== "service" && i.stock <= (i.low || 5)).length; // eslint-disable-line @typescript-eslint/no-explicit-any

  return { low, ...remote };
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Mail, MessageCircle, TriangleAlert } from "lucide-react";

import { sbFetchBookings, sbFetchCustomerMessages, sbFetchInventory, sbFetchMessages, isSupabaseConfigured } from "@/lib/supabase";

interface NotificationItem {
  key: string;
  icon: typeof Bell;
  label: string;
  path: string;
}

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!isSupabaseConfigured()) return;
    const [{ data: bookings }, { data: inventory }, { data: messages }, { data: chats }] = await Promise.all([
      sbFetchBookings(),
      sbFetchInventory(),
      sbFetchMessages(),
      sbFetchCustomerMessages(),
    ]);

    const next: NotificationItem[] = [];
    const pendingBookings = (bookings || []).filter((b) => b.status === "pending").length;

    if (pendingBookings > 0) {
      next.push({ key: "bookings", icon: CalendarDays, label: `${pendingBookings} pending booking${pendingBookings !== 1 ? "s" : ""}`, path: "/bookings" });
    }

    const lowStock = (inventory || []).filter((i) => i.stock <= i.low).length;

    if (lowStock > 0) {
      next.push({ key: "inventory", icon: TriangleAlert, label: `${lowStock} item${lowStock !== 1 ? "s" : ""} low on stock`, path: "/inventory" });
    }

    const unreadMail = (messages || []).filter((m) => m.direction === "inbound" && !m.read).length;

    if (unreadMail > 0) {
      next.push({ key: "mail", icon: Mail, label: `${unreadMail} unread message${unreadMail !== 1 ? "s" : ""}`, path: "/messages" });
    }

    const unreadChat = (chats || []).filter((m) => m.direction === "inbound" && !m.read).length;

    if (unreadChat > 0) {
      next.push({ key: "chat", icon: MessageCircle, label: `${unreadChat} unread customer chat${unreadChat !== 1 ? "s" : ""}`, path: "/messages" });
    }

    setItems(next);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notifications"
        className="relative flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-5" />
        {items.length > 0 && (
          <span className="absolute right-2 top-2 flex size-2.5 items-center justify-center rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="m-0 p-4 text-center text-sm text-muted">You&rsquo;re all caught up.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.key}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-secondary"
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
              >
                <item.icon className="size-4 shrink-0 text-accent" />
                <span className="text-foreground">{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { useNotifications } from "@/hooks/useNotifications";

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert };

const when = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  return (
    <>
      <Button variant="ghost" size="sm" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} onClick={() => { setOpen(true); markAllAsRead(); }}>
        <Bell size={16} />{unreadCount > 0 && <span>{unreadCount}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Notifications" description={notifications.length ? `${notifications.length} recent` : undefined}>
          {notifications.length === 0 ? (
            <EmptyState title="You're all caught up" description="New tickets, sales and appointments show up here." />
          ) : (
            <div className="nv-stack">
              {notifications.map((n) => {
                const Icon = ICONS[n.type];

                return (
                  <div key={n.id} className="nv-row" onMouseEnter={() => markAsRead(n.id)}>
                    <Icon size={16} />
                    <div className="nv-row-main"><strong>{n.title}</strong><span>{n.message}</span></div>
                    <span className="nv-muted">{when(n.timestamp)}</span>
                    <Button variant="ghost" size="sm" aria-label="Dismiss" onClick={() => removeNotification(n.id)}><X size={14} /></Button>
                  </div>
                );
              })}
              <div className="nv-actions"><Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

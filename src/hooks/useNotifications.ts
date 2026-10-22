import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: AppNotification["type"]) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

// In-memory only (reset on reload, capped at 50), same as before.
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (title, message, type = "info") =>
    set((s) => ({
      notifications: [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, message, type, timestamp: new Date().toISOString(), read: false }, ...s.notifications].slice(0, 50),
    })),
  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllAsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  clearAll: () => set({ notifications: [] }),
}));

export const useNotifications = () => {
  const store = useNotificationStore();

  return { ...store, unreadCount: store.notifications.filter((n) => !n.read).length };
};

// For non-hook callers.
export const addNotification = (title: string, message: string, type?: AppNotification["type"]) =>
  useNotificationStore.getState().addNotification(title, message, type);

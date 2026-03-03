interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

// Single global state — avoids localStorage cross-session contamination.
// Notifications are in-memory only and reset on page reload (intentional).
// For persistence across sessions, save to Supabase or a cookie.
export const useNotifications = () => {
  const notifications = useState<Notification[]>('notifications', () => [])

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    }
    notifications.value.unshift(notification)
    // Cap at 50 notifications in memory
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) notifications.value.splice(index, 1)
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) notification.read = true
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => { n.read = true })
  }

  const clearAll = () => {
    notifications.value = []
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
  }
}

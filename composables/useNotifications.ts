interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

export const useNotifications = () => {
  const notifications = useState<Notification[]>('notifications', () => {
    if (process.client) {
      const saved = localStorage.getItem('nova_notifications')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load notifications')
        }
      }
    }
    return []
  })

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    notifications.value.unshift(notification)
    
    // Save to localStorage
    if (process.client) {
      localStorage.setItem('nova_notifications', JSON.stringify(notifications.value))
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
      if (process.client) {
        localStorage.setItem('nova_notifications', JSON.stringify(notifications.value))
      }
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
      if (process.client) {
        localStorage.setItem('nova_notifications', JSON.stringify(notifications.value))
      }
    }
  }

  const clearAll = () => {
    notifications.value = []
    if (process.client) {
      localStorage.removeItem('nova_notifications')
    }
  }

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    unreadCount
  }
}

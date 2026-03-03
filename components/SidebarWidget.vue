<template>
  <div class="space-y-4">
    <!-- Upcoming Appointments Section -->
    <Card class="border-violet-500/20">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-sm font-semibold flex items-center gap-2">
            <CalendarClock class="w-4 h-4 text-violet-500" />
            Upcoming
          </CardTitle>
          <Button variant="ghost" size="sm" @click="navigateTo('/housecalls')" class="h-7 text-xs">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="item in upcomingItems.slice(0, 5)"
          :key="item.id"
          class="p-3 rounded-lg bg-gradient-to-br from-violet-500/5 to-blue-500/5 border border-violet-500/10 hover:border-violet-500/30 transition-colors cursor-pointer"
          @click="navigateToItem(item)"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <component :is="getIcon(item.type)" class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium line-clamp-1">{{ item.title }}</p>
              <p class="text-xs text-muted-foreground line-clamp-1">{{ item.subtitle }}</p>
              <div class="flex items-center gap-1 mt-1">
                <Clock class="w-3 h-3 text-violet-500" />
                <span class="text-xs text-violet-500">{{ item.timeFromNow }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="upcomingItems.length === 0" class="text-center py-6">
          <CalendarClock class="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p class="text-xs text-muted-foreground">No upcoming items</p>
        </div>
      </CardContent>
    </Card>

    <!-- Notifications Section -->
    <Card class="border-blue-500/20">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-sm font-semibold flex items-center gap-2">
            <Bell class="w-4 h-4 text-blue-500" />
            Notifications
            <Badge v-if="unreadCount > 0" variant="destructive" class="h-5 px-1.5 text-xs">
              {{ unreadCount }}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" @click="markAllRead" class="h-7 text-xs">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="notification in notifications.slice(0, 5)"
          :key="notification.id"
          class="p-3 rounded-lg border transition-colors cursor-pointer"
          :class="notification.read ? 'bg-muted/20 border-muted' : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/30'"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getNotificationBgClass(notification.type)"
            >
              <component :is="getNotificationIcon(notification.type)" class="w-4 h-4" :class="getNotificationIconClass(notification.type)" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium line-clamp-1">{{ notification.title }}</p>
              <p class="text-xs text-muted-foreground line-clamp-2">{{ notification.message }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ formatTime(notification.timestamp) }}</p>
            </div>
            <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
          </div>
        </div>

        <div v-if="notifications.length === 0" class="text-center py-6">
          <Bell class="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p class="text-xs text-muted-foreground">No notifications</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

import { 
  CalendarClock, 
  Bell, 
  Clock,
  MapPin,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Info,
  TicketCheck
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useNotifications } from '~/composables/useNotifications'

interface UpcomingItem {
  id: string
  type: 'housecall' | 'appointment' | 'ticket'
  title: string
  subtitle: string
  date: Date
  timeFromNow: string
  route: string
}

const appStore = useAppStore()
const { appointments } = storeToRefs(appStore)

// Get house calls from localStorage
const houseCalls = computed(() => {
  if (process.client) {
    const stored = localStorage.getItem('nova_housecalls')
    return stored ? JSON.parse(stored) : []
  }
  return []
})

// Get notifications
const { notifications } = useNotifications()

// Combine all upcoming items
const upcomingItems = computed<UpcomingItem[]>(() => {
  const items: UpcomingItem[] = []
  const now = new Date()

  // Add house calls
  houseCalls.value.forEach((call: any) => {
    const callDate = new Date(`${call.date}T${call.time}`)
    if (callDate >= now && call.status !== 'cancelled' && call.status !== 'completed') {
      items.push({
        id: `hc-${call.id}`,
        type: 'housecall',
        title: call.description,
        subtitle: call.address,
        date: callDate,
        timeFromNow: getTimeFromNow(callDate),
        route: '/housecalls'
      })
    }
  })

  // Add appointments
  appointments.value.forEach((apt: any) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`)
    if (aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed') {
      items.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: apt.description,
        subtitle: getCustomerName(apt.customerId),
        date: aptDate,
        timeFromNow: getTimeFromNow(aptDate),
        route: '/calendar'
      })
    }
  })

  // Sort by date
  return items.sort((a, b) => a.date.getTime() - b.date.getTime())
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const getCustomerName = (customerId: number) => {
  const customer = appStore.customers.find(c => c.id === customerId)
  return customer?.name || 'Unknown'
}

const getTimeFromNow = (date: Date) => {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    const minutes = Math.floor(diff / (1000 * 60))
    return minutes > 0 ? `in ${minutes} min` : 'Now'
  }
}

const getIcon = (type: string) => {
  const icons: Record<string, any> = {
    'housecall': MapPin,
    'appointment': CalendarDays,
    'ticket': TicketCheck
  }
  return icons[type] || CalendarClock
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    'success': CheckCircle,
    'warning': AlertCircle,
    'error': AlertCircle,
    'info': Info
  }
  return icons[type] || Info
}

const getNotificationBgClass = (type: string) => {
  const classes: Record<string, string> = {
    'success': 'bg-emerald-500/10',
    'warning': 'bg-amber-500/10',
    'error': 'bg-red-500/10',
    'info': 'bg-blue-500/10'
  }
  return classes[type] || 'bg-gray-500/10'
}

const getNotificationIconClass = (type: string) => {
  const classes: Record<string, string> = {
    'success': 'text-emerald-500',
    'warning': 'text-amber-500',
    'error': 'text-red-500',
    'info': 'text-blue-500'
  }
  return classes[type] || 'text-gray-500'
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

const navigateToItem = (item: UpcomingItem) => {
  navigateTo(item.route)
}

const handleNotificationClick = (notification: any) => {
  // Mark as read
  notification.read = true
  if (process.client) {
    localStorage.setItem('nova_notifications', JSON.stringify(notifications.value))
  }
}

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
  if (process.client) {
    localStorage.setItem('nova_notifications', JSON.stringify(notifications.value))
  }
}
</script>

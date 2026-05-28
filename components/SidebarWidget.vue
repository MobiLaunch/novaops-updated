<template>
  <div class="flex flex-col gap-4">
    <!-- Upcoming Appointments Section -->
    <div class="bg-surface border border-violet-500/20 rounded-xl overflow-hidden shadow-sm">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/10">
        <div class="flex items-center gap-2 text-xs font-bold">
          <i class="mdi mdi-calendar-clock text-violet"></i>
          Upcoming
        </div>
        <v-btn 
          variant="text" 
          color="secondary" 
          class="text-[10px] font-bold text-none !py-0.5 !px-2" 
          @click="navigateTo('/bookings')" 
        >
          View All
        </v-btn>
      </div>
      
      <div class="p-4 flex flex-col gap-2">
        <div
          v-for="item in upcomingItems.slice(0, 5)"
          :key="item.id"
          class="p-3 bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50 rounded-xl cursor-pointer flex items-start gap-3"
          @click="navigateToItem(item)"
        >
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <i class="mdi text-sm" :class="getIcon(item.type)"></i>
          </div>
          <div class="flex-grow min-w-0">
            <p class="text-xs font-semibold truncate leading-tight">{{ item.title }}</p>
            <p class="text-[10px] text-muted-foreground truncate mt-0.5">{{ item.subtitle }}</p>
            <div class="flex items-center gap-1 mt-1">
              <i class="mdi mdi-clock-outline text-[10px] text-violet"></i>
              <span class="text-[10px] font-semibold text-violet-500">{{ item.timeFromNow }}</span>
            </div>
          </div>
        </div>

        <div v-if="upcomingItems.length === 0" class="text-center py-6 flex flex-col items-center gap-1">
          <i class="mdi mdi-calendar-clock text-3xl text-muted"></i>
          <p class="text-xs text-muted-foreground">No upcoming items</p>
        </div>
      </div>
    </div>

    <!-- Notifications Section -->
    <div class="bg-surface border border-blue-500/20 rounded-xl overflow-hidden shadow-sm">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/10">
        <div class="flex items-center gap-2 text-xs font-bold">
          <i class="mdi mdi-bell-outline text-blue"></i>
          Notifications
          <span 
            v-if="unreadCount > 0" 
            class="bg-red-500/10 text-red-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
          >
            {{ unreadCount }}
          </span>
        </div>
        <v-btn 
          variant="text" 
          color="secondary" 
          class="text-[10px] font-bold text-none !py-0.5 !px-2" 
          @click="markAllRead" 
        >
          Clear All
        </v-btn>
      </div>

      <div class="p-4 flex flex-col gap-2">
        <div
          v-for="notification in notifications.slice(0, 5)"
          :key="notification.id"
          class="p-3 border rounded-xl cursor-pointer flex items-start gap-3 transition-colors"
          :class="[
            notification.read 
              ? 'bg-surface border-border/40 opacity-60 hover:bg-muted/30' 
              : 'bg-muted/40 border-border/80 hover:bg-muted/70'
          ]"
          @click="handleNotificationClick(notification)"
        >
          <div 
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :class="getNotificationBgClass(notification.type)"
          >
            <i class="mdi text-sm" :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="flex-grow min-w-0">
            <p class="text-xs font-semibold truncate leading-tight">{{ notification.title }}</p>
            <p class="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{{ notification.message }}</p>
            <p class="text-[9px] text-muted-foreground/75 mt-1">{{ formatTime(notification.timestamp) }}</p>
          </div>
          <div v-if="!notification.read" class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
        </div>

        <div v-if="notifications.length === 0" class="text-center py-6 flex flex-col items-center gap-1">
          <i class="mdi mdi-bell-outline text-3xl text-muted"></i>
          <p class="text-xs text-muted-foreground">No notifications</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
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
        route: '/bookings'
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
        route: '/bookings'
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
  const icons: Record<string, string> = {
    'housecall': 'mdi-map-marker-outline',
    'appointment': 'mdi-calendar',
    'ticket': 'mdi-ticket-confirmation-outline'
  }
  return icons[type] || 'mdi-calendar-clock'
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    'success': 'mdi-check-circle-outline',
    'warning': 'mdi-alert-circle-outline',
    'error': 'mdi-alert-circle-outline',
    'info': 'mdi-information-outline'
  }
  return icons[type] || 'mdi-information-outline'
}

const getNotificationBgClass = (type: string) => {
  const classes: Record<string, string> = {
    'success': 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15',
    'warning': 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15',
    'error': 'bg-red-500/10 text-red-500 dark:bg-red-500/15',
    'info': 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15'
  }
  return classes[type] || 'bg-muted text-muted-foreground'
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

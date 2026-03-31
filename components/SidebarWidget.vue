<template>
  <div class="d-flex flex-column gap-4">
    <!-- Upcoming Appointments Section -->
    <v-card variant="outlined" style="border-color:rgba(139,92,246,0.2)">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center gap-2 text-body-2 font-weight-bold">
            <CalendarClock :size="16" style="color:#8b5cf6" />
            Upcoming
          </div>
        </template>
        <template #append>
          <v-btn variant="text" size="small" @click="navigateTo('/bookings')">View All</v-btn>
        </template>
      </v-card-item>
      <v-card-text>
        <div class="d-flex flex-column gap-2">
          <v-card
            v-for="item in upcomingItems.slice(0, 5)"
            :key="item.id"
            variant="tonal"
            rounded="lg"
            class="pa-3 cursor-pointer"
            @click="navigateToItem(item)"
          >
            <div class="d-flex align-start gap-3">
              <v-avatar color="primary" size="32" rounded="lg">
                <v-icon :icon="getIcon(item.type)" size="16" color="white" />
              </v-avatar>
              <div class="flex-grow-1" style="min-width:0">
                <p class="text-body-2 font-weight-medium text-truncate mb-0">{{ item.title }}</p>
                <p class="text-caption text-medium-emphasis text-truncate mb-0">{{ item.subtitle }}</p>
                <div class="d-flex align-center gap-1 mt-1">
                  <v-icon icon="mdi-clock-outline" size="12" style="color:#8b5cf6" />
                  <span class="text-caption" style="color:#8b5cf6">{{ item.timeFromNow }}</span>
                </div>
              </div>
            </div>
          </v-card>

          <div v-if="upcomingItems.length === 0" class="text-center py-6">
            <CalendarClock :size="32" class="mx-auto mb-2 text-medium-emphasis" style="opacity:0.5" />
            <p class="text-caption text-medium-emphasis mb-0">No upcoming items</p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Notifications Section -->
    <v-card variant="outlined" style="border-color:rgba(59,130,246,0.2)">
      <v-card-item>
        <template #title>
          <div class="d-flex align-center gap-2 text-body-2 font-weight-bold">
            <v-icon icon="mdi-bell-outline" size="16" style="color:#3b82f6" />
            Notifications
            <v-chip v-if="unreadCount > 0" color="error" size="x-small" variant="tonal">{{ unreadCount }}</v-chip>
          </div>
        </template>
        <template #append>
          <v-btn variant="text" size="small" @click="markAllRead">Clear All</v-btn>
        </template>
      </v-card-item>
      <v-card-text>
        <div class="d-flex flex-column gap-2">
          <v-card
            v-for="notification in notifications.slice(0, 5)"
            :key="notification.id"
            :variant="notification.read ? 'flat' : 'tonal'"
            rounded="lg"
            class="pa-3 cursor-pointer"
            :style="notification.read ? 'opacity:0.6' : ''"
            @click="handleNotificationClick(notification)"
          >
            <div class="d-flex align-start gap-3">
              <v-avatar :color="getNotificationColor(notification.type)" size="32" rounded="lg" variant="tonal">
                <v-icon :icon="getNotificationIcon(notification.type)" size="16" />
              </v-avatar>
              <div class="flex-grow-1" style="min-width:0">
                <p class="text-body-2 font-weight-medium text-truncate mb-0">{{ notification.title }}</p>
                <p class="text-caption text-medium-emphasis mb-0" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ notification.message }}</p>
                <p class="text-caption text-medium-emphasis mt-1 mb-0">{{ formatTime(notification.timestamp) }}</p>
              </div>
              <div v-if="!notification.read" class="rounded-circle bg-info" style="width:8px;height:8px;margin-top:4px;flex-shrink:0"></div>
            </div>
          </v-card>

          <div v-if="notifications.length === 0" class="text-center py-6">
            <v-icon icon="mdi-bell-outline" size="32" class="mx-auto mb-2 text-medium-emphasis" style="opacity:0.5" />
            <p class="text-caption text-medium-emphasis mb-0">No notifications</p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
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
    'housecall': 'mdi-map-marker-outline',
    'appointment': 'mdi-calendar',
    'ticket': 'mdi-ticket-confirmation-outline'
  }
  return icons[type] || CalendarClock
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    'success': 'mdi-check-circle-outline',
    'warning': 'mdi-alert-circle',
    'error': 'mdi-alert-circle',
    'info': 'mdi-information-outline'
  }
  return icons[type] || Info
}

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    'success': 'success',
    'warning': 'warning',
    'error': 'error',
    'info': 'info'
  }
  return colors[type] || 'secondary'
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

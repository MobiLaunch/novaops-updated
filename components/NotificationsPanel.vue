<template>
  <div>
    <v-btn icon variant="text" @click="open = true" class="position-relative">
      <v-icon icon="mdi-bell-outline" size="20" />
      <v-badge
        v-if="unreadCount > 0"
        :content="unreadCount"
        color="error"
        floating
      />
    </v-btn>

    <v-dialog v-model="open" max-width="500">
      <v-card>
        <v-card-item>
          <v-card-title>Notifications</v-card-title>
          <template #append>
            <v-btn v-if="notifications.length > 0" variant="text" size="small" @click="clearAll">Clear All</v-btn>
          </template>
        </v-card-item>
        <v-card-text style="max-height:400px;overflow-y:auto">
          <div class="d-flex flex-column gap-2">
            <v-card
              v-for="notification in notifications"
              :key="notification.id"
              variant="tonal"
              rounded="lg"
              class="pa-3"
              :color="getColor(notification.type)"
              :style="notification.read ? 'opacity:0.6' : ''"
            >
              <div class="d-flex align-start justify-space-between">
                <div class="flex-grow-1">
                  <div class="d-flex align-center gap-2">
                    <v-icon :icon="getIcon(notification.type)" size="16" />
                    <p class="text-body-2 font-weight-medium mb-0">{{ notification.title }}</p>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mt-1 mb-0">{{ notification.message }}</p>
                  <p class="text-caption text-medium-emphasis mt-2 mb-0">{{ formatTime(notification.timestamp) }}</p>
                </div>
                <v-btn icon="mdi-close" size="x-small" variant="text" @click="removeNotification(notification.id)" />
              </div>
            </v-card>

            <div v-if="notifications.length === 0" class="text-center py-8">
              <v-icon icon="mdi-bell-outline" size="48" class="mx-auto mb-2 text-medium-emphasis" style="opacity:0.5" />
              <p class="text-medium-emphasis mb-0">No notifications</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'

const { notifications, removeNotification, clearAll, markAllAsRead, unreadCount } = useNotifications()
const open = ref(false)

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'mdi-check-circle-outline'
    case 'warning': return 'mdi-alert-outline'
    case 'error': return 'mdi-alert-circle'
    default: return 'mdi-information-outline'
  }
}

const getColor = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'warning': return 'warning'
    case 'error': return 'error'
    default: return 'info'
  }
}

const formatTime = (date: Date | string) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

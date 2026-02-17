<template>
  <div>
    <Button variant="ghost" size="icon" @click="open = true" class="relative">
      <Bell class="h-5 w-5" />
      <span 
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
      >
        {{ unreadCount }}
      </span>
    </Button>

    <Dialog v-model:open="open">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <div class="flex items-center justify-between pr-8">
            <DialogTitle>Notifications</DialogTitle>
            <Button 
              v-if="notifications.length > 0"
              variant="ghost" 
              size="sm" 
              @click="clearAll"
            >
              Clear All
            </Button>
          </div>
        </DialogHeader>

        <div class="space-y-2 max-h-[400px] overflow-y-auto">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="p-4 rounded-lg border transition-colors"
            :class="{
              'bg-blue-500/5 border-blue-500/20': notification.type === 'info',
              'bg-emerald-500/5 border-emerald-500/20': notification.type === 'success',
              'bg-amber-500/5 border-amber-500/20': notification.type === 'warning',
              'bg-red-500/5 border-red-500/20': notification.type === 'error',
              'opacity-60': notification.read
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <component 
                    :is="getIcon(notification.type)" 
                    class="w-4 h-4"
                    :class="{
                      'text-blue-500': notification.type === 'info',
                      'text-emerald-500': notification.type === 'success',
                      'text-amber-500': notification.type === 'warning',
                      'text-red-500': notification.type === 'error'
                    }"
                  />
                  <p class="font-medium text-sm">{{ notification.title }}</p>
                </div>
                <p class="text-sm text-muted-foreground mt-1">{{ notification.message }}</p>
                <p class="text-xs text-muted-foreground mt-2">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                class="h-6 w-6"
                @click="removeNotification(notification.id)"
              >
                <X class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div v-if="notifications.length === 0" class="text-center py-12">
            <Bell class="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p class="text-muted-foreground">No notifications</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Bell, Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { useNotifications } from '~/composables/useNotifications'

const { notifications, removeNotification, clearAll, unreadCount } = useNotifications()
const open = ref(false)

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle
    case 'warning': return AlertTriangle
    case 'error': return AlertCircle
    default: return Info
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

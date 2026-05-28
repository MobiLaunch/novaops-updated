<template>
  <div class="relative">
    <button 
      class="relative w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      @click="open = true"
    >
      <i class="mdi mdi-bell-outline text-lg"></i>
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm"
      >
        {{ unreadCount }}
      </span>
    </button>

    <v-dialog
      v-model="open"
      max-width="450"
    >
      <v-card class="rounded-xl">
        <v-card-item class="pb-3 border-b">
          <div class="flex items-center justify-between w-full">
            <span class="text-sm font-black text-foreground">Notifications</span>
            <v-btn 
              v-if="notifications.length > 0" 
              variant="text" 
              color="secondary" 
              class="text-[11px] font-bold text-none min-w-0 px-2 py-1 h-auto" 
              @click="clearAll" 
            >
              Clear All
            </v-btn>
          </div>
        </v-card-item>
        
        <v-card-text class="pt-4 pb-4">
          <div class="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="p-3.5 border rounded-xl flex items-start justify-between gap-3 transition-all"
              :class="[
                notification.read 
                  ? 'opacity-60 bg-surface border-border/40' 
                  : 'bg-muted/40 border-border/80'
              ]"
            >
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2">
                  <i class="mdi text-base" :class="[getIcon(notification.type), getIconColorClass(notification.type)]"></i>
                  <p class="text-xs font-bold leading-tight truncate text-foreground">{{ notification.title }}</p>
                </div>
                <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ notification.message }}</p>
                <p class="text-[10px] text-muted-foreground/75 mt-2 font-medium">{{ formatTime(notification.timestamp) }}</p>
              </div>
              <v-btn 
                icon="mdi-close" 
                variant="text" 
                color="secondary" 
                class="rounded-full !w-6 !h-6 shrink-0 !text-muted-foreground" 
                density="compact"
                @click="removeNotification(notification.id)" 
              />
            </div>

            <div v-if="notifications.length === 0" class="text-center py-10 flex flex-col items-center gap-2">
              <i class="mdi mdi-bell-outline text-4xl text-muted"></i>
              <p class="text-xs text-muted-foreground font-medium">No notifications</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const { notifications, removeNotification, clearAll, unreadCount } = useNotifications()
const open = ref(false)

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'mdi-check-circle-outline'
    case 'warning': return 'mdi-alert-outline'
    case 'error': return 'mdi-alert-circle'
    default: return 'mdi-information-outline'
  }
}

const getIconColorClass = (type: string) => {
  switch (type) {
    case 'success': return 'text-emerald-500'
    case 'warning': return 'text-amber-500'
    case 'error': return 'text-red-500'
    default: return 'text-blue-500'
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

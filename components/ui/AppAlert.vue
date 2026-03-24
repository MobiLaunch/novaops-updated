<template>
  <Transition name="alert-fade">
    <div
      v-if="visible"
      class="app-alert"
      :class="[`alert--${status}`, inline ? 'alert--inline' : 'alert--toast']"
      role="alert"
    >
      <!-- Indicator -->
      <div class="alert-indicator" :class="`indicator--${status}`">
        <component :is="statusIcon" class="alert-icon" v-if="!$slots.indicator" />
        <slot name="indicator" />
      </div>

      <!-- Content -->
      <div class="alert-content">
        <p class="alert-title" v-if="title || $slots.title">
          <slot name="title">{{ title }}</slot>
        </p>
        <p class="alert-description" v-if="description || $slots.default">
          <slot>{{ description }}</slot>
        </p>
      </div>

      <!-- Action slot -->
      <div class="alert-action" v-if="$slots.action">
        <slot name="action" />
      </div>

      <!-- Close button -->
      <button
        v-if="dismissible"
        class="alert-close"
        @click="dismiss"
        aria-label="Dismiss"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircle, AlertTriangle, XCircle, Info, X, Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  status?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'loading'
  title?: string
  description?: string
  dismissible?: boolean
  inline?: boolean
  modelValue?: boolean
}>(), {
  status: 'default',
  dismissible: false,
  inline: false,
  modelValue: true,
})

const emit = defineEmits<{ 'update:modelValue': [boolean]; dismiss: [] }>()

const internalVisible = ref(true)
const visible = computed(() => props.modelValue !== undefined ? props.modelValue : internalVisible.value)

function dismiss() {
  internalVisible.value = false
  emit('update:modelValue', false)
  emit('dismiss')
}

const statusIcon = computed(() => {
  const map = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger:  XCircle,
    info:    Info,
    accent:  Info,
    default: Info,
    loading: Loader2,
  }
  return map[props.status] || Info
})
</script>

<style scoped>
.app-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 16px;
  border: 1.5px solid transparent;
  padding: 14px 16px;
  width: 100%;
}

/* Toast mode — used in notification stack */
.alert--toast {
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
  backdrop-filter: blur(12px);
}

/* Inline mode — embedded in page content */
.alert--inline {
  box-shadow: none;
}

/* Status variants */
.alert--default  { background: hsl(var(--card)); border-color: hsl(var(--border)); }
.alert--success  { background: #10b98110; border-color: #10b98130; }
.alert--warning  { background: #f59e0b10; border-color: #f59e0b30; }
.alert--danger   { background: #ef444410; border-color: #ef444430; }
.alert--info     { background: #3b82f610; border-color: #3b82f630; }
.alert--accent   { background: #8b5cf610; border-color: #8b5cf630; }
.alert--loading  { background: hsl(var(--card)); border-color: hsl(var(--border)); }

/* Indicator circle */
.alert-indicator {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.indicator--default { background: hsl(var(--muted));  color: hsl(var(--muted-foreground)); }
.indicator--success { background: #10b98120; color: #059669; }
.indicator--warning { background: #f59e0b20; color: #d97706; }
.indicator--danger  { background: #ef444420; color: #dc2626; }
.indicator--info    { background: #3b82f620; color: #2563eb; }
.indicator--accent  { background: #8b5cf620; color: #7c3aed; }
.indicator--loading { background: hsl(var(--muted));  color: hsl(var(--muted-foreground)); }

.alert-icon { width: 15px; height: 15px; }

/* Content */
.alert-content { flex: 1; min-width: 0; }
.alert-title {
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1.3;
  margin-bottom: 2px;
}
.alert-description {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
  font-weight: 500;
}

/* Action */
.alert-action { flex-shrink: 0; }

/* Close button */
.alert-close {
  width: 24px; height: 24px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground));
  flex-shrink: 0;
  margin-top: 2px;
  transition: background 0.15s, color 0.15s, transform 0.2s;
}
.alert-close:hover { background: hsl(var(--muted) / 0.6); color: hsl(var(--foreground)); transform: scale(1.1); }
.alert-close:active { transform: scale(0.9); }

/* Transition */
.alert-fade-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); }
.alert-fade-leave-active { transition: all 0.2s ease; }
.alert-fade-enter-from  { opacity: 0; transform: translateY(-8px) scale(0.97); }
.alert-fade-leave-to    { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* Dark mode */
.dark .alert--success { background: #10b98118; border-color: #10b98138; }
.dark .alert--warning { background: #f59e0b18; border-color: #f59e0b38; }
.dark .alert--danger  { background: #ef444418; border-color: #ef444438; }
.dark .alert--info    { background: #3b82f618; border-color: #3b82f638; }
.dark .alert--accent  { background: #8b5cf618; border-color: #8b5cf638; }
.dark .indicator--success { color: #34d399; }
.dark .indicator--warning { color: #fbbf24; }
.dark .indicator--danger  { color: #f87171; }
.dark .indicator--info    { color: #60a5fa; }
.dark .indicator--accent  { color: #a78bfa; }
</style>

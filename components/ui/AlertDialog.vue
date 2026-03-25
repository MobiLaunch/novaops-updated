<template>
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="open"
        class="dialog-backdrop"
        @click.self="onBackdropClick"
        aria-modal="true"
        role="dialog"
        :aria-labelledby="headingId"
      >
        <Transition name="dialog-panel">
          <div v-if="open" class="dialog-container">
            <!-- Close X -->
            <button class="dialog-close-x" @click="cancel" aria-label="Close">
              <X class="w-4 h-4" />
            </button>

            <!-- Header -->
            <div class="dialog-header">
              <div class="dialog-status-icon" :class="`icon--${status}`">
                <component :is="statusIcon" class="w-5 h-5" />
              </div>
              <h2 :id="headingId" class="dialog-heading">
                <slot name="heading">{{ heading }}</slot>
              </h2>
            </div>

            <!-- Body -->
            <div class="dialog-body">
              <slot>
                <p class="dialog-body-text">{{ body }}</p>
              </slot>
            </div>

            <!-- Footer -->
            <div class="dialog-footer">
              <button class="btn btn--tertiary" @click="cancel">
                <slot name="cancel-label">{{ cancelLabel }}</slot>
              </button>
              <button
                class="btn"
                :class="`btn--${status}`"
                :disabled="confirming"
                @click="confirm"
              >
                <Loader2 v-if="confirming" class="w-4 h-4 animate-spin" />
                <slot name="confirm-label">{{ confirmLabel }}</slot>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, useId } from 'vue'
import { AlertTriangle, Trash2, Info, X, Loader2, CheckCircle } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open: boolean
  heading?: string
  body?: string
  status?: 'danger' | 'warning' | 'info' | 'success'
  confirmLabel?: string
  cancelLabel?: string
  closeOnBackdrop?: boolean
}>(), {
  heading: 'Are you sure?',
  body: 'This action cannot be undone.',
  status: 'danger',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  'update:open': [boolean]
  confirm: []
  cancel: []
}>()

const confirming = ref(false)
const headingId = 'dialog-heading-' + Math.random().toString(36).slice(2, 7)

const statusIcon = computed(() => {
  const map = { danger: Trash2, warning: AlertTriangle, info: Info, success: CheckCircle }
  return map[props.status] || AlertTriangle
})

function cancel() {
  emit('update:open', false)
  emit('cancel')
}

async function confirm() {
  confirming.value = true
  try {
    emit('confirm')
  } finally {
    confirming.value = false
    emit('update:open', false)
  }
}

function onBackdropClick() {
  if (props.closeOnBackdrop) cancel()
}
</script>

<style scoped>
/* Backdrop */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Panel */
.dialog-container {
  position: relative;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border));
  border-radius: 24px;
  padding: 28px 28px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);
}

/* Close X */
.dialog-close-x {
  position: absolute;
  top: 16px; right: 16px;
  width: 28px; height: 28px;
  border-radius: 99px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground));
  transition: background 0.15s, color 0.15s, transform 0.2s;
}
.dialog-close-x:hover { background: hsl(var(--muted) / 0.6); color: hsl(var(--foreground)); transform: scale(1.1); }
.dialog-close-x:active { transform: scale(0.9); }

/* Header */
.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  margin-bottom: 16px;
}
.dialog-status-icon {
  width: 52px; height: 52px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
}
.icon--danger  { background: #ef444418; color: #dc2626; }
.icon--warning { background: #f59e0b18; color: #d97706; }
.icon--info    { background: #3b82f618; color: #2563eb; }
.icon--success { background: #10b98118; color: #059669; }

.dialog-heading {
  font-size: 17px;
  font-weight: 800;
  color: hsl(var(--foreground));
  letter-spacing: -0.3px;
  line-height: 1.25;
}

/* Body */
.dialog-body {
  text-align: center;
  margin-bottom: 24px;
}
.dialog-body-text {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
  font-weight: 500;
}

/* Footer */
.dialog-footer {
  display: flex;
  gap: 10px;
}
.btn {
  flex: 1;
  padding: 11px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s, background 0.15s;
}
.btn:hover  { transform: scale(1.03); }
.btn:active { transform: scale(0.96); }
.btn:disabled { opacity: 0.6; pointer-events: none; }

.btn--tertiary {
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
  border: 1.5px solid hsl(var(--border));
}
.btn--tertiary:hover { background: hsl(var(--muted)); }

.btn--danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 14px #ef444440;
}
.btn--danger:hover { background: #dc2626; }

.btn--warning {
  background: #f59e0b;
  color: white;
  box-shadow: 0 4px 14px #f59e0b40;
}
.btn--warning:hover { background: #d97706; }

.btn--info {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 14px #3b82f640;
}
.btn--info:hover { background: #2563eb; }

.btn--success {
  background: #10b981;
  color: white;
  box-shadow: 0 4px 14px #10b98140;
}
.btn--success:hover { background: #059669; }

/* Transitions */
.dialog-backdrop-enter-active { transition: opacity 0.2s ease; }
.dialog-backdrop-leave-active { transition: opacity 0.2s ease; }
.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to { opacity: 0; }

.dialog-panel-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.dialog-panel-leave-active { transition: all 0.18s ease; }
.dialog-panel-enter-from   { opacity: 0; transform: scale(0.88) translateY(12px); }
.dialog-panel-leave-to     { opacity: 0; transform: scale(0.94) translateY(4px); }

/* Dark mode icon adjustments */
.dark .icon--danger  { background: #ef444425; color: #f87171; }
.dark .icon--warning { background: #f59e0b25; color: #fbbf24; }
.dark .icon--info    { background: #3b82f625; color: #60a5fa; }
.dark .icon--success { background: #10b98125; color: #34d399; }
</style>

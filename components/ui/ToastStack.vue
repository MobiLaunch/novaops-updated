<template>
  <Teleport to="body">
    <div class="toast-viewport" aria-label="Notifications" aria-live="polite">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-wrapper"
        >
          <AppAlert
            :status="t.status"
            :title="t.title"
            :description="t.description"
            :dismissible="t.dismissible !== false"
            :inline="false"
            @dismiss="dismiss(t.id)"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import AppAlert from '~/components/ui/AppAlert.vue'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-viewport {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 360px;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-wrapper {
  pointer-events: all;
}

/* TransitionGroup animations */
.toast-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from  { opacity: 0; transform: translateX(40px) scale(0.94); }
.toast-leave-to    { opacity: 0; transform: translateX(40px) scale(0.96); }
.toast-move        { transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1); }
</style>

// composables/useToast.ts
// HeroUI-style toast notification system for NovaOps

import { ref, readonly } from 'vue'

export type ToastStatus = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'loading'

export interface Toast {
  id: string
  title: string
  description?: string
  status: ToastStatus
  duration?: number  // ms, 0 = persistent
  dismissible?: boolean
}

const toasts = ref<Toast[]>([])

function toast(options: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9)
  const t: Toast = {
    id,
    duration: 4000,
    dismissible: true,
    ...options,
  }
  toasts.value.push(t)

  if (t.duration && t.duration > 0) {
    setTimeout(() => dismiss(id), t.duration)
  }

  return id
}

function dismiss(id: string) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

function dismissAll() {
  toasts.value = []
}

// Convenience shorthands
toast.success = (title: string, description?: string, opts?: Partial<Toast>) =>
  toast({ status: 'success', title, description, ...opts })

toast.danger = (title: string, description?: string, opts?: Partial<Toast>) =>
  toast({ status: 'danger', title, description, ...opts })

toast.warning = (title: string, description?: string, opts?: Partial<Toast>) =>
  toast({ status: 'warning', title, description, ...opts })

toast.info = (title: string, description?: string, opts?: Partial<Toast>) =>
  toast({ status: 'info', title, description, ...opts })

toast.loading = (title: string, description?: string) =>
  toast({ status: 'loading', title, description, duration: 0, dismissible: false })

export function useToast() {
  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
    dismissAll,
  }
}

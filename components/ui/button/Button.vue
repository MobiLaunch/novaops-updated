<template>
  <component
    :is="as"
    v-bind="$attrs"
    :class="buttonClass"
    :disabled="disabled"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost' | 'destructive' | 'outline' | 'secondary' | 'link'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  disabled?: boolean
  as?: string
}>(), {
  variant: 'solid',
  color: 'primary',
  size: 'md',
  radius: 'full',
  disabled: false,
  as: 'button',
})

const buttonClass = computed(() => {
  const base = 'hui-btn inline-flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer select-none border-none outline-none'

  const sizes: Record<string, string> = {
    sm:   'hui-btn-sm text-xs',
    md:   'hui-btn-md text-sm',
    lg:   'hui-btn-lg text-base',
    icon: 'w-10 h-10 p-0',
  }

  const radiuses: Record<string, string> = {
    none: 'rounded-none',
    sm:   'rounded-lg',
    md:   'rounded-xl',
    lg:   'rounded-2xl',
    full: 'rounded-full',
  }

  const variants: Record<string, string> = {
    solid:       props.color === 'primary'     ? 'hui-btn-solid-primary' :
                 props.color === 'secondary'   ? 'bg-secondary text-white shadow-md hover:brightness-105 hover:-translate-y-px active:scale-95' :
                 props.color === 'success'     ? 'bg-[#10b981] text-white shadow-md hover:bg-[#059669] hover:-translate-y-px active:scale-95' :
                 props.color === 'warning'     ? 'bg-[#f59e0b] text-white shadow-md hover:bg-[#d97706] hover:-translate-y-px active:scale-95' :
                 props.color === 'danger'      ? 'bg-[#ef4444] text-white shadow-md hover:bg-[#dc2626] hover:-translate-y-px active:scale-95' :
                                                 'bg-default-500 text-white hover:bg-default-600 active:scale-95',
    bordered:    'hui-btn-bordered',
    light:       'hui-btn-light',
    flat:        'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
    faded:       'bg-default-100 text-default-700 border border-default-200 hover:bg-default-200 active:scale-95',
    shadow:      props.color === 'primary' ? 'bg-primary text-white shadow-[0_8px_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_12px_32px_hsl(var(--primary)/0.45)] hover:-translate-y-1 active:scale-95' :
                                             'bg-default-500 text-white shadow-lg hover:-translate-y-1 active:scale-95',
    ghost:       'hui-btn-ghost',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
    outline:     'border-2 border-border bg-transparent hover:bg-muted/50 active:scale-95',
    secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95',
    link:        'text-primary underline-offset-4 hover:underline bg-transparent',
  }

  return [base, sizes[props.size], radiuses[props.radius], variants[props.variant]].join(' ')
})
</script>

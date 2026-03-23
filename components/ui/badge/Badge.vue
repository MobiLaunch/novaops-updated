<template>
  <span :class="badgeClass" v-bind="$attrs">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'solid' | 'flat' | 'bordered' | 'dot'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}>(), {
  variant: 'flat',
  color: 'default',
  size: 'md',
})

const badgeClass = computed(() => {
  const base = 'hui-chip inline-flex items-center font-bold whitespace-nowrap'
  const colors: Record<string, string> = {
    default:   'hui-chip-default',
    primary:   'hui-chip-primary',
    secondary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    success:   'hui-chip-success',
    warning:   'hui-chip-warning',
    danger:    'hui-chip-danger',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-xs',
  }
  return [base, colors[props.color], sizes[props.size]].join(' ')
})
</script>

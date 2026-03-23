<template>
  <input
    v-bind="$attrs"
    :class="inputClass"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  variant?: 'flat' | 'bordered' | 'faded' | 'underlined'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  radius?: 'sm' | 'md' | 'lg' | 'full' | 'none'
  disabled?: boolean
}>(), {
  variant: 'bordered',
  color: 'default',
  size: 'md',
  radius: 'lg',
  disabled: false,
})

defineEmits(['update:modelValue'])

const inputClass = computed(() => {
  const base = 'hui-input w-full font-medium transition-all outline-none font-[inherit]'
  const sizes: Record<string, string> = {
    sm: 'h-9 text-xs px-3',
    md: 'h-11 text-sm px-4',
    lg: 'h-14 text-base px-5',
  }
  const radii: Record<string, string> = {
    none: 'rounded-none',
    sm:   'rounded-lg',
    md:   'rounded-xl',
    lg:   'rounded-2xl',
    full: 'rounded-full',
  }
  return [base, sizes[props.size], radii[props.radius]].join(' ')
})
</script>

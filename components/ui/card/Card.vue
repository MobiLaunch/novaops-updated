<template>
  <div :class="cardClass" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  radius?: 'none' | 'sm' | 'md' | 'lg'
  isPressable?: boolean
  isHoverable?: boolean
  isBlurred?: boolean
  fullWidth?: boolean
}>(), {
  shadow: 'sm',
  radius: 'lg',
  isPressable: false,
  isHoverable: false,
  isBlurred: false,
  fullWidth: false,
})
const cardClass = computed(() => {
  const base = 'hui-card'
  const radii: Record<string, string> = {
    none: '!rounded-none',
    sm:   '!rounded-xl',
    md:   '!rounded-2xl',
    lg:   '!rounded-3xl',
  }
  const shadows: Record<string, string> = {
    none: 'shadow-none',
    sm:   '',
    md:   '!shadow-[var(--hui-shadow-md)]',
    lg:   '!shadow-[var(--hui-shadow-lg)]',
  }
  return [base, radii[props.radius], shadows[props.shadow],
    props.isPressable || props.isHoverable ? 'hui-card-hover cursor-pointer' : '',
    props.isBlurred ? 'backdrop-blur-md bg-background/70' : '',
    props.fullWidth ? 'w-full' : '',
  ].join(' ')
})
</script>

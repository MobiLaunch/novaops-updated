<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '~/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn(
      // M3 input — pill shape, muted fill, crisp focus ring
      'flex h-12 w-full rounded-[20px] border-2 border-border/70 bg-muted/50 px-5 py-2',
      'text-sm font-medium text-foreground',
      'placeholder:text-muted-foreground/60',
      'transition-all duration-200',
      'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  >
</template>

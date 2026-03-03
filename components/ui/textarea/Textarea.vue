<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
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
  <textarea
    v-model="modelValue"
    :class="cn(
      // M3 textarea — rounded-[20px], muted fill, matching Input style
      'flex min-h-[80px] w-full rounded-[20px] border-2 border-border/70 bg-muted/50 px-5 py-3.5',
      'text-sm font-medium text-foreground',
      'placeholder:text-muted-foreground/60',
      'transition-all duration-200 resize-none',
      'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  />
</template>

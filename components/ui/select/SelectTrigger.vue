<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <SelectTrigger
    v-bind="delegatedProps"
    :class="cn(
      // M3 select trigger — matches Input shape
      'flex h-12 w-full items-center justify-between rounded-[20px]',
      'border-2 border-border/70 bg-muted/50 px-5 py-2',
      'text-sm font-medium text-foreground',
      'placeholder:text-muted-foreground/60',
      'transition-all duration-200',
      'focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>span]:line-clamp-1',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50 flex-shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>

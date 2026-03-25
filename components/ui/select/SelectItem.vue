<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
} from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <SelectItem
    v-bind="delegatedProps"
    :class="cn(
      // M3 select item — rounded-[16px], spring hover
      'relative flex w-full cursor-pointer select-none items-center',
      'rounded-[16px] py-2.5 pl-9 pr-3',
      'text-sm font-medium outline-none',
      'transition-all duration-200',
      'focus:bg-primary/10 focus:text-primary',
      'hover:bg-muted/60',
      'data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      props.class,
    )"
  >
    <!-- Check indicator -->
    <span class="absolute left-3 flex h-4 w-4 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-3.5 w-3.5 text-primary" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

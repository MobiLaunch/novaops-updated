<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  SelectContent,
  type SelectContentEmits,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '~/lib/utils'

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(),
  { position: 'popper' },
)

const emits = defineEmits<SelectContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="forwarded"
      :class="cn(
        // M3 select panel — rounded-[24px], backdrop, shadow
        'relative z-50 max-h-80 min-w-32 overflow-hidden',
        'rounded-[24px] border border-border/60 bg-popover text-popover-foreground',
        'shadow-xl shadow-black/10',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'duration-200',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <SelectViewport
        :class="cn(
          'p-2',
          position === 'popper' && 'h-[--radix-select-trigger-height] w-full min-w-[--radix-select-trigger-width]',
        )"
      >
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>

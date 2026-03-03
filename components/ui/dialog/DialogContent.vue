<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <!-- M3: softer scrim with backdrop blur -->
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"
    />

    <!-- M3 Expressive panel — rounded-[32px], spring entrance -->
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-[32px] bg-background border border-border/60 shadow-2xl',
        'p-0 gap-0',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'duration-300',
        props.class,
      )"
    >
      <slot />

      <!-- M3 close button: pill shaped, spring hover -->
      <DialogClose
        class="absolute right-5 top-5 w-9 h-9 rounded-[18px] flex items-center justify-center bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:pointer-events-none"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

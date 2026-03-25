<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Label, type LabelProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <Label
    :class="cn(
      // M3 label — uppercase micro-text matching the app's label pattern
      'block text-[10px] font-black text-muted-foreground uppercase tracking-[0.12em]',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.class,
    )"
  >
    <slot />
  </Label>
</template>

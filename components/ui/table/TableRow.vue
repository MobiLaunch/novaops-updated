<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr :class="cn('border-b border-border/50 transition-all duration-200 hover:bg-muted/40 data-[state=selected]:bg-primary/5', props.class)">
    <slot />
  </tr>
</template>

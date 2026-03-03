<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <th :class="cn('h-11 px-4 text-left align-middle text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] [&:has([role=checkbox])]:pr-0', props.class)">
    <slot />
  </th>
</template>

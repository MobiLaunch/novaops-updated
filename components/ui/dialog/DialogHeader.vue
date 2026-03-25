<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!-- M3 dialog header — left-aligned, tighter spacing -->
  <div :class="cn('flex flex-col space-y-1 text-left', props.class)">
    <slot />
  </div>
</template>

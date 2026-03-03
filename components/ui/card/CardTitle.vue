<script setup lang="ts">
import { cn } from '~/lib/utils'

defineOptions({ name: 'CardTitle' })
const props = withDefaults(defineProps<{ class?: string }>(), { class: '' })
</script>

<template>
  <h3 :class="cn('text-sm font-black tracking-tight', props.class)">
    <slot />
  </h3>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

defineOptions({ name: 'CardDescription' })
const props = withDefaults(defineProps<{ class?: string }>(), { class: '' })
</script>

<template>
  <p :class="cn('text-xs font-medium text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

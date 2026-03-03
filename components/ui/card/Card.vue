<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardProps {
  class?: string
}

defineOptions({
  name: 'Card',
})

const props = withDefaults(defineProps<CardProps>(), {
  class: '',
})
</script>

<template>
  <div :class="cn('rounded-lg border bg-card text-card-foreground shadow-sm', props.class)">
    <slot />
  </div>
</template>

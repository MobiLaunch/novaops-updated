<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardProps {
  class?: string
}

defineOptions({ name: 'Card' })

const props = withDefaults(defineProps<CardProps>(), { class: '' })
</script>

<template>
  <!-- M3 Card — rounded-[28px] to match the app's card language -->
  <div :class="cn('rounded-[28px] border border-border/60 bg-card text-card-foreground', props.class)">
    <slot />
  </div>
</template>

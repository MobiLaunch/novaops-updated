<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardDescriptionProps {
  class?: string
}

defineOptions({
  name: 'CardDescription',
})

const props = withDefaults(defineProps<CardDescriptionProps>(), {
  class: '',
})
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

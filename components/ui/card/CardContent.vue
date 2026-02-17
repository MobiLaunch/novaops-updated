<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardContentProps {
  class?: string
}

defineOptions({
  name: 'CardContent',
})

const props = withDefaults(defineProps<CardContentProps>(), {
  class: '',
})
</script>

<template>
  <div :class="cn('p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

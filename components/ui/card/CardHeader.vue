<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardHeaderProps {
  class?: string
}

defineOptions({
  name: 'CardHeader',
})

const props = withDefaults(defineProps<CardHeaderProps>(), {
  class: '',
})
</script>

<template>
  <div :class="cn('flex flex-col space-y-1.5 p-6', props.class)">
    <slot />
  </div>
</template>

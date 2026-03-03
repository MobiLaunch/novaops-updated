<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardTitleProps {
  class?: string
}

defineOptions({
  name: 'CardTitle',
})

const props = withDefaults(defineProps<CardTitleProps>(), {
  class: '',
})
</script>

<template>
  <h3 :class="cn('text-2xl font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>

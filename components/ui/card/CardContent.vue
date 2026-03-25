<script setup lang="ts">
import { cn } from '~/lib/utils'

defineOptions({ name: 'CardContent' })
const props = withDefaults(defineProps<{ class?: string }>(), { class: '' })
</script>

<template>
  <div :class="cn('p-5', props.class)">
    <slot />
  </div>
</template>

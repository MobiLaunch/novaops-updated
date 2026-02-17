<script setup lang="ts">
import { MenubarSeparator } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <MenubarSeparator :class="cn('-mx-1 my-1 h-px bg-border', props.class)" />
</template>

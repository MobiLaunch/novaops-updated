<script setup lang="ts">
import { MenubarRoot, type MenubarRootProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<MenubarRootProps & { class?: string }>()
</script>

<template>
  <MenubarRoot v-bind="props" :class="cn('flex h-9 items-center space-x-1 rounded-lg border border-border bg-background p-1 shadow-sm', props.class)">
    <slot />
  </MenubarRoot>
</template>

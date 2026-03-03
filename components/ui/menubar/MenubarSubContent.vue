<script setup lang="ts">
import { MenubarSubContent, type MenubarSubContentProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<MenubarSubContentProps & { class?: string }>()
</script>

<template>
  <MenubarSubContent v-bind="props" :class="cn('z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', props.class)">
    <slot />
  </MenubarSubContent>
</template>

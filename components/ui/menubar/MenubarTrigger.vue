<script setup lang="ts">
import { MenubarTrigger, type MenubarTriggerProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<MenubarTriggerProps & { class?: string }>()
</script>

<template>
  <MenubarTrigger v-bind="props" :class="cn('flex cursor-default select-none items-center rounded-[12px] px-4 py-1.5 text-sm font-bold outline-none focus:bg-primary/10 focus:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary', props.class)">
    <slot />
  </MenubarTrigger>
</template>

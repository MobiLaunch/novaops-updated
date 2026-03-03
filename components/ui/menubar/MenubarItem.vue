<script setup lang="ts">
import { MenubarItem, type MenubarItemProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<MenubarItemProps & { class?: string; inset?: boolean }>()
</script>

<template>
  <MenubarItem v-bind="props" :class="cn('relative flex cursor-default select-none items-center rounded-[12px] px-3 py-2 text-sm font-medium outline-none focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.inset && 'pl-8', props.class)">
    <slot />
  </MenubarItem>
</template>

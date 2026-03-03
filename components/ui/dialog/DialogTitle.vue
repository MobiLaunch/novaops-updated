<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogTitle, type DialogTitleProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <!-- M3 dialog title — black weight, tight tracking -->
  <DialogTitle :class="cn('text-base font-black tracking-tight', props.class)">
    <slot />
  </DialogTitle>
</template>

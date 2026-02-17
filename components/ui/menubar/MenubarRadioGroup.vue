<script setup lang="ts">
import { MenubarRadioGroup, type MenubarRadioGroupProps } from 'radix-vue'

const props = defineProps<MenubarRadioGroupProps>()
</script>

<template>
  <MenubarRadioGroup v-bind="props"><slot /></MenubarRadioGroup>
</template>

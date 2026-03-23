<template>
  <textarea
    v-bind="$attrs"
    :class="cls"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{
  modelValue?: string
  size?: 'sm' | 'md' | 'lg'
  radius?: 'sm' | 'md' | 'lg' | 'full' | 'none'
}>(), { size: 'md', radius: 'lg' })
defineEmits(['update:modelValue'])
const cls = computed(() => {
  const r = { none:'rounded-none', sm:'rounded-xl', md:'rounded-2xl', lg:'rounded-2xl', full:'rounded-full' }[props.radius]
  return `hui-input w-full min-h-[88px] py-3 resize-none ${r}`
})
</script>

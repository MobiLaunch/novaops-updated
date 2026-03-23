<template>
  <Teleport to="body">
    <div class="hui-modal-backdrop" @click.self="$emit('close')">
      <div class="hui-modal hui-modal-md" v-bind="$attrs">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
defineEmits(['close'])
</script>

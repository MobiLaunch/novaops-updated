<template>
  <div v-if="show" class="electron-titlebar" />
</template>

<script setup lang="ts">
const show = ref(false)
onMounted(() => {
  show.value = !!(typeof window !== 'undefined' && (window as any).electronAPI?.isElectron)
})
</script>

<style scoped>
.electron-titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  -webkit-app-region: drag;
  z-index: 9999;
}
</style>

<template>
  <div :class="{ 'electron-app': isElectron }">
    <VitePwaManifest />
    <ElectronTitlebar />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isElectron = ref(false)
onMounted(() => {
  isElectron.value = !!(window as any).electronAPI?.isElectron
})
</script>

<style>
.electron-app {
  padding-top: 40px;
}
</style>

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

useHead({
  link: [
    { rel: 'icon',             type: 'image/x-icon',  href: '/icon.ico' },
    { rel: 'icon',             type: 'image/png',     href: '/icon-192.png', sizes: '192x192' },
    { rel: 'icon',             type: 'image/png',     href: '/icon-512.png', sizes: '512x512' },
    { rel: 'apple-touch-icon',                        href: '/icon-192.png' },
    { rel: 'shortcut icon',    type: 'image/x-icon',  href: '/icon.ico' },
  ],
  meta: [
    { name: 'theme-color', content: '#5b5ef4' },
  ],
})
</script>

<style>
.electron-app {
  padding-top: 40px;
}
</style>

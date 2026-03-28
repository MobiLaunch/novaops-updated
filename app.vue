<template>
  <div :class="{ 'electron-app': isElectron }">
    <VitePwaManifest />
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
    { rel: 'apple-touch-icon',                         href: '/icon-192.png' },
  ],
  meta: [
    { name: 'theme-color', content: '#6366f1' },
  ],
})
</script>

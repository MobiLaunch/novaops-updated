<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <v-progress-circular indeterminate size="32" width="4" color="primary" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: [] })

const isFirstLaunch = import.meta.client && !localStorage.getItem('novaops_launched')

if (isFirstLaunch) {
  localStorage.setItem('novaops_launched', '1')
  await navigateTo('/intro', { replace: true })
} else {
  await navigateTo('/login', { replace: true })
}
</script>

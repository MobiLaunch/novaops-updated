<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <ProgressSpinner style="width: 32px; height: 32px" stroke-width="4" />
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

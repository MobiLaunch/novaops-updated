<template>
  <div class="d-flex min-h-screen align-center justify-center">
    <v-progress-circular indeterminate color="primary" size="32" />
  </div>
</template>

<script setup lang="ts">
// Root route — decide first destination.
//
// Priority:
//   1. If this is the very first launch (no 'novaops_launched' flag in
//      localStorage), show the intro screen regardless of auth state so the
//      user sees the onboarding animation before anything else.
//   2. Otherwise redirect to /login (which bounces authenticated users to
//      /dashboard via the auth middleware).
definePageMeta({ middleware: [] })

const isFirstLaunch = import.meta.client && !localStorage.getItem('novaops_launched')

if (isFirstLaunch) {
  localStorage.setItem('novaops_launched', '1')
  await navigateTo('/intro', { replace: true })
} else {
  await navigateTo('/login', { replace: true })
}
</script>

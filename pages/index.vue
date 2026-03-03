<script setup lang="ts">
// Root route — decide first destination.
//
// Priority:
//   1. If this is the very first launch (no 'novaops_launched' flag in
//      localStorage), show the intro screen regardless of auth state so the
//      user sees the onboarding animation before anything else.
//   2. Otherwise redirect to /login (which bounces authenticated users to
//      /dashboard via the auth middleware).
//
// This file must exist; without it Nuxt's file-based router has no handler for /
// and serves a blank 404.
definePageMeta({ middleware: [] })

const isFirstLaunch = import.meta.client
  ? !localStorage.getItem('novaops_launched')
  : false

if (isFirstLaunch) {
  // Mark as launched so subsequent visits go straight to login
  if (import.meta.client) localStorage.setItem('novaops_launched', '1')
  await navigateTo('/intro', { replace: true })
} else {
  await navigateTo('/login', { replace: true })
}
</script>

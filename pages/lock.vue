<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">

    <!-- Subtle background -->
    <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 50% 0%, #6366f108 0%, transparent 70%)" />
    <div class="absolute inset-0 opacity-[0.015] pointer-events-none"
      style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 24px 24px;" />

    <div class="relative w-full max-w-xs flex flex-col items-center gap-8">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <div class="text-center flex flex-col items-center gap-3">
        <div class="w-16 h-16 rounded-3xl flex items-center justify-center" style="background: #6366f118; outline: 1px solid #6366f130">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" style="color: #6366f1">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Screen Locked</h1>
          <p class="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
        </div>
      </div>

      <!-- ── PIN Dots ───────────────────────────────────────────── -->
      <div class="flex justify-center gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-150 text-2xl font-bold select-none"
          :style="pin.length >= i
            ? 'background: #6366f122; outline: 2px solid #6366f160; color: #6366f1; transform: scale(1.05)'
            : 'outline: 1.5px solid hsl(var(--border)); color: transparent'"
        >
          {{ pin.length >= i ? '•' : '·' }}
        </div>
      </div>

      <!-- ── Error ──────────────────────────────────────────────── -->
      <div class="h-5 flex items-center justify-center">
        <p v-if="error" class="text-sm text-center font-medium animate-pulse" style="color: #ef4444">{{ error }}</p>
      </div>

      <!-- ── Numpad ─────────────────────────────────────────────── -->
      <div class="grid grid-cols-3 gap-3 w-full">
        <button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          class="h-14 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 select-none bg-card"
          style="outline: 1px solid hsl(var(--border))"
          @click="addDigit(num)"
        >{{ num }}</button>

        <!-- Clear -->
        <button
          class="h-14 rounded-2xl transition-all duration-100 active:scale-95 select-none flex items-center justify-center"
          style="background: #ef444412; outline: 1px solid #ef444420"
          @click="clearPin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color: #ef4444">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
          </svg>
        </button>

        <!-- Zero -->
        <button
          class="h-14 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 select-none bg-card"
          style="outline: 1px solid hsl(var(--border))"
          @click="addDigit(0)"
        >0</button>

        <!-- Backspace -->
        <button
          class="h-14 rounded-2xl transition-all duration-100 active:scale-95 select-none flex items-center justify-center"
          style="background: hsl(var(--muted)/0.5); outline: 1px solid hsl(var(--border))"
          @click="backspace"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>

      <!-- ── Sign out ────────────────────────────────────────────── -->
      <button
        class="text-xs text-muted-foreground hover:text-foreground transition-colors pb-2"
        style="text-decoration: underline; text-underline-offset: 3px"
        @click="logout"
      >
        Sign out instead
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: false })

const pin = ref('')
const error = ref('')
const savedPin = ref('1234')

onMounted(async () => {
  try {
    const mod = await import('~/stores/app')
    const store = mod.useAppStore()
    if (store?.settings?.pin) {
      savedPin.value = store.settings.pin
    }
  } catch {
    // use default 1234
  }
})

const addDigit = (digit: number) => {
  if (pin.value.length < 4) {
    pin.value += digit.toString()
    error.value = ''
    if (pin.value.length === 4) checkPin()
  }
}

const backspace = () => {
  pin.value = pin.value.slice(0, -1)
  error.value = ''
}

const clearPin = () => {
  pin.value = ''
  error.value = ''
}

const checkPin = () => {
  if (pin.value === savedPin.value) {
    localStorage.setItem('screen_locked', 'false')
    localStorage.setItem('last_activity', Date.now().toString())
    navigateTo('/dashboard')
  } else {
    error.value = 'Incorrect PIN'
    setTimeout(() => {
      pin.value = ''
      error.value = ''
    }, 1000)
  }
}

const logout = () => {
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('screen_locked')
  navigateTo('/login')
}
</script>

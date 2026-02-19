<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">

    <!-- Subtle background texture -->
    <div class="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/20 pointer-events-none" />
    <div class="absolute inset-0 opacity-[0.015] pointer-events-none"
      style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 24px 24px;" />

    <div class="relative w-full max-w-xs space-y-8">

      <!-- Header -->
      <div class="text-center space-y-3">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight">Screen Locked</h1>
          <p class="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
        </div>
      </div>

      <!-- PIN Indicator Dots -->
      <div class="flex justify-center gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-150 text-2xl font-bold select-none"
          :class="pin.length >= i
            ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm'
            : 'border-border text-transparent'"
        >
          {{ pin.length >= i ? '•' : '·' }}
        </div>
      </div>

      <!-- Error Message -->
      <div class="h-5 flex items-center justify-center">
        <p
          v-if="error"
          class="text-sm text-center text-red-500 font-medium animate-pulse"
        >
          {{ error }}
        </p>
      </div>

      <!-- Numpad -->
      <div class="grid grid-cols-3 gap-2.5">
        <button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          class="h-14 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 active:scale-95 text-xl font-semibold transition-all duration-100 shadow-sm select-none"
          @click="addDigit(num)"
        >
          {{ num }}
        </button>

        <!-- Clear -->
        <button
          class="h-14 rounded-xl border border-border bg-card hover:bg-accent active:scale-95 transition-all duration-100 text-muted-foreground shadow-sm select-none flex items-center justify-center"
          @click="clearPin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
          </svg>
        </button>

        <!-- Zero -->
        <button
          class="h-14 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 active:scale-95 text-xl font-semibold transition-all duration-100 shadow-sm select-none"
          @click="addDigit(0)"
        >
          0
        </button>

        <!-- Backspace -->
        <button
          class="h-14 rounded-xl border border-border bg-card hover:bg-accent active:scale-95 transition-all duration-100 text-muted-foreground shadow-sm select-none flex items-center justify-center"
          @click="backspace"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>

      <!-- Sign out link -->
      <div class="text-center pb-2">
        <button
          class="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          @click="logout"
        >
          Sign out instead
        </button>
      </div>
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

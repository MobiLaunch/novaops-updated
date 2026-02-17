<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="w-full max-w-sm">
      <!-- Lock Icon -->
      <div class="text-center mb-8">
        <div class="mx-auto mb-4 w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 class="text-2xl font-semibold">Screen Locked</h1>
        <p class="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
      </div>

      <!-- PIN Dots -->
      <div class="flex justify-center gap-4 mb-6">
        <div
          v-for="i in 4"
          :key="i"
          class="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-150"
          :class="pin.length >= i ? 'border-primary bg-primary/10' : 'border-border'"
        >
          {{ pin.length >= i ? '•' : '' }}
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-sm text-center text-red-500 mb-4">
        {{ error }}
      </p>

      <!-- Numpad -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          class="h-14 rounded-lg border border-border bg-background hover:bg-accent text-xl font-semibold transition-colors"
          @click="addDigit(num)"
        >
          {{ num }}
        </button>
        <button
          class="h-14 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-muted-foreground"
          @click="clearPin"
        >
          ✕
        </button>
        <button
          class="h-14 rounded-lg border border-border bg-background hover:bg-accent text-xl font-semibold transition-colors"
          @click="addDigit(0)"
        >
          0
        </button>
        <button
          class="h-14 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-muted-foreground"
          @click="backspace"
        >
          ⌫
        </button>
      </div>

      <!-- Sign out -->
      <div class="text-center">
        <button
          class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
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

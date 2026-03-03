<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style="background: hsl(var(--background))">

    <!-- Background blobs -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
      <div class="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #a855f7, transparent)" />
    </div>

    <div class="relative w-full max-w-xs flex flex-col items-center gap-8" style="animation: lockEnter 0.45s cubic-bezier(0.34,1.3,0.64,1) both">

      <!-- Header -->
      <div class="text-center flex flex-col items-center gap-4">
        <div
          class="w-20 h-20 rounded-[32px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 8px 32px #6366f140"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.75">
            <rect x="3" y="11" width="18" height="11" rx="3" ry="3"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight">Screen Locked</h1>
          <p class="text-sm text-muted-foreground font-medium mt-1">Enter your PIN to continue</p>
        </div>
      </div>

      <!-- PIN Dots — squircle M3 style -->
      <div class="flex justify-center gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl font-black select-none transition-all duration-200"
          :style="pin.length >= i
            ? `background: #6366f124; outline: 2.5px solid #6366f170; outline-offset: 0; color: #6366f1; transform: scale(1.08)`
            : `outline: 2px solid hsl(var(--border)/0.7); outline-offset: 0; color: transparent`"
        >●</div>
      </div>

      <!-- Error message -->
      <div class="h-6 flex items-center justify-center">
        <p
          v-if="error"
          class="text-sm font-bold text-center"
          style="color: #ef4444; animation: errShake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)"
        >{{ error }}</p>
      </div>

      <!-- Numpad — M3 jelly bean keys -->
      <div class="grid grid-cols-3 gap-3 w-full">
        <button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          class="m3-numkey h-16 rounded-[24px] text-xl font-black select-none bg-card"
          style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
          @click="addDigit(num)"
        >{{ num }}</button>

        <!-- Clear -->
        <button
          class="m3-numkey h-16 rounded-[24px] select-none flex items-center justify-center"
          style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0"
          @click="clearPin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="color: #ef4444">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
          </svg>
        </button>

        <!-- Zero -->
        <button
          class="m3-numkey h-16 rounded-[24px] text-xl font-black select-none bg-card"
          style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
          @click="addDigit(0)"
        >0</button>

        <!-- Backspace -->
        <button
          class="m3-numkey h-16 rounded-[24px] select-none flex items-center justify-center"
          style="background: hsl(var(--muted)/0.6); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
          @click="backspace"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>

      <!-- Sign out -->
      <button
        class="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 pb-2 hover:scale-105 active:scale-95 transition-all"
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
    if (store?.settings?.pin) savedPin.value = store.settings.pin
  } catch { }
})

const addDigit = (digit: number) => {
  if (pin.value.length < 4) {
    pin.value += digit.toString()
    error.value = ''
    if (pin.value.length === 4) checkPin()
  }
}
const backspace = () => { pin.value = pin.value.slice(0, -1); error.value = '' }
const clearPin  = () => { pin.value = ''; error.value = '' }

const checkPin = () => {
  if (pin.value === savedPin.value) {
    localStorage.setItem('screen_locked', 'false')
    localStorage.setItem('last_activity', Date.now().toString())
    navigateTo('/dashboard')
  } else {
    error.value = 'Incorrect PIN — try again'
    setTimeout(() => { pin.value = ''; error.value = '' }, 1000)
  }
}
const logout = () => { localStorage.removeItem('isAuthenticated'); localStorage.removeItem('screen_locked'); navigateTo('/login') }
</script>

<style scoped>
@keyframes lockEnter {
  0%   { transform: scale(0.88) translateY(24px); opacity: 0; }
  65%  { transform: scale(1.04) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
@keyframes errShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}
.m3-numkey {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.m3-numkey:hover  { transform: scale(1.05); }
.m3-numkey:active { transform: scale(0.88); }
</style>
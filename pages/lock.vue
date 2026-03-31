<template>
  <v-container fluid class="fill-height d-flex flex-column align-center justify-center position-relative overflow-hidden pa-4" style="background: rgb(var(--v-theme-background))">

    <!-- Background blobs -->
    <div class="position-absolute" style="top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: hidden;">
      <div style="position: absolute; top: -10rem; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; border-radius: 50%; opacity: 0.1; filter: blur(60px); background: radial-gradient(circle, rgb(var(--v-theme-primary)), transparent)" />
      <div style="position: absolute; bottom: 0; right: 0; width: 300px; height: 300px; border-radius: 50%; opacity: 0.1; filter: blur(60px); background: radial-gradient(circle, #a855f7, transparent)" />
    </div>

    <div class="d-flex flex-column align-center w-100" style="max-width: 320px; z-index: 1; animation: lockEnter 0.45s cubic-bezier(0.34,1.3,0.64,1) both;">

      <!-- Header -->
      <div class="text-center d-flex flex-column align-center gap-4 mb-8">
        <v-sheet
          rounded="xl"
          elevation="4"
          class="d-flex align-center justify-center"
          height="80"
          width="80"
          style="background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #8b5cf6 100%);"
        >
          <v-icon icon="mdi-shield-lock-outline" size="40" color="white" />
        </v-sheet>
        <div>
          <h1 class="text-h5 font-weight-black tracking-tight">Screen Locked</h1>
          <p class="text-caption text-medium-emphasis font-weight-medium mt-1">Enter your PIN to continue</p>
        </div>
      </div>

      <!-- PIN Dots -->
      <div class="d-flex justify-center gap-3 mb-4 w-100">
        <v-sheet
          v-for="i in 4"
          :key="i"
          rounded="xl"
          height="64"
          class="flex-1-1-100 d-flex align-center justify-center font-weight-black transition-all"
          :style="pin.length >= i
            ? `background: rgba(var(--v-theme-primary), 0.12); border: 2.5px solid rgba(var(--v-theme-primary), 0.7); color: rgb(var(--v-theme-primary)); transform: scale(1.08)`
            : `border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); color: transparent; background: transparent;`"
        >
          <v-icon>mdi-circle-small</v-icon>
        </v-sheet>
      </div>

      <!-- Error message -->
      <div class="d-flex align-center justify-center mb-4" style="height: 24px">
        <p
          v-if="error"
          class="text-caption font-weight-bold text-center text-error"
          style="animation: errShake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)"
        >{{ error }}</p>
      </div>

      <!-- Numpad -->
      <v-row dense class="mb-8 w-100 mx-0">
        <v-col cols="4" v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" class="pa-1.5">
          <v-btn
            block
            height="64"
            rounded="xl"
            variant="flat"
            class="text-h6 font-weight-black bg-surface m3-numkey"
            style="border: 2px solid rgba(var(--v-border-color), 0.6);"
            @click="addDigit(num)"
          >
            {{ num }}
          </v-btn>
        </v-col>

        <!-- Clear -->
        <v-col cols="4" class="pa-1.5">
          <v-btn
            block
            height="64"
            rounded="xl"
            variant="flat"
            class="m3-numkey"
            style="color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.1); border: 2px solid rgba(var(--v-theme-error), 0.2)"
            @click="clearPin"
          >
            <v-icon size="24">mdi-close-circle-outline</v-icon>
          </v-btn>
        </v-col>

        <!-- Zero -->
        <v-col cols="4" class="pa-1.5">
          <v-btn
            block
            height="64"
            rounded="xl"
            variant="flat"
            class="text-h6 font-weight-black bg-surface m3-numkey"
            style="border: 2px solid rgba(var(--v-border-color), 0.6);"
            @click="addDigit(0)"
          >
            0
          </v-btn>
        </v-col>

        <!-- Backspace -->
        <v-col cols="4" class="pa-1.5">
          <v-btn
            block
            height="64"
            rounded="xl"
            variant="flat"
            class="m3-numkey text-medium-emphasis"
            style="background: rgba(var(--v-theme-background), 0.8); border: 2px solid rgba(var(--v-border-color), 0.6)"
            @click="backspace"
          >
            <v-icon size="24">mdi-backspace-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <!-- Sign out -->
      <v-btn
        variant="text"
        size="small"
        class="text-caption font-weight-bold text-medium-emphasis text-decoration-underline text-none mt-2"
        @click="logout"
      >
        Sign out instead
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: false })

const router = useRouter()
const pin = ref('')
const error = ref('')
const savedPin = ref('1234')

onMounted(async () => {
  const storedPin = localStorage.getItem('novaops_pin')
  if (storedPin) savedPin.value = storedPin
  try {
    const mod = await import('~/stores/app')
    const store = mod.useAppStore()
    if (store?.settings?.pin) {
      savedPin.value = store.settings.pin
      localStorage.setItem('novaops_pin', store.settings.pin)
    }
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
    router.push('/dashboard')
  } else {
    error.value = 'Incorrect PIN — try again'
    setTimeout(() => { pin.value = ''; error.value = '' }, 1000)
  }
}
const logout = () => { localStorage.removeItem('isAuthenticated'); localStorage.removeItem('screen_locked'); router.push('/login') }
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
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m3-numkey:hover  { transform: scale(1.05); }
.m3-numkey:active { transform: scale(0.92); }
</style>
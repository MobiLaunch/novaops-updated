<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">

    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute rounded-full opacity-10 blur-3xl"
        style="top: -10rem; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; background: radial-gradient(circle, var(--p-primary-500, #6366f1), transparent);"
      />
      <div
        class="absolute rounded-full opacity-10 blur-3xl"
        style="bottom: 0; right: 0; width: 300px; height: 300px; background: radial-gradient(circle, #a855f7, transparent);"
      />
    </div>

    <div class="flex flex-col items-center w-full max-w-xs z-10" style="animation: lockEnter 0.45s cubic-bezier(0.34,1.3,0.64,1) both;">

      <div class="text-center flex flex-col items-center gap-4 mb-8">
        <div
          class="w-20 h-20 rounded-xl flex items-center justify-center text-white shadow-lg"
          style="background: linear-gradient(135deg, var(--p-primary-500, #6366f1) 0%, #8b5cf6 100%);"
        >
          <i class="mdi mdi-shield-lock-outline text-4xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-black m-0">Screen Locked</h1>
          <p class="text-xs text-muted-foreground font-medium mt-1 m-0">Enter your PIN to continue</p>
        </div>
      </div>

      <div class="flex justify-center gap-3 mb-4 w-full">
        <div
          v-for="i in 4"
          :key="i"
          class="flex-1 h-16 rounded-xl flex items-center justify-center font-black transition-all border-2"
          :class="pin.length >= i
            ? 'border-primary bg-primary/10 text-primary scale-105'
            : 'border-border text-transparent bg-transparent'"
        >
          <i class="mdi mdi-circle-small text-2xl" :class="pin.length >= i ? 'opacity-100' : 'opacity-0'"></i>
        </div>
      </div>

      <div class="flex items-center justify-center mb-4 h-6">
        <p
          v-if="error"
          class="text-xs font-bold text-center text-red-500 m-0"
          style="animation: errShake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)"
        >{{ error }}</p>
      </div>

      <div class="grid grid-cols-3 gap-2 w-full mb-8">
        <Button
          v-for="num in [1,2,3,4,5,6,7,8,9]"
          :key="num"
          :label="String(num)"
          variant="outlined"
          class="font-black text-xl py-4 h-16"
          @click="addDigit(num)"
        />
        <Button severity="danger" variant="outlined" class="h-16" @click="clearPin">
          <i class="mdi mdi-close-circle-outline text-2xl"></i>
        </Button>
        <Button :label="'0'" variant="outlined" class="font-black text-xl py-4 h-16" @click="addDigit(0)" />
        <Button variant="outlined" class="h-16" @click="backspace">
          <i class="mdi mdi-backspace-outline text-2xl"></i>
        </Button>
      </div>

      <Button label="Sign out instead" variant="text" severity="secondary" class="text-xs font-bold underline" @click="logout" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  } catch { /* ignore */ }
})

const addDigit = (digit: number) => {
  if (pin.value.length < 4) {
    pin.value += digit.toString()
    error.value = ''
    if (pin.value.length === 4) checkPin()
  }
}
const backspace = () => { pin.value = pin.value.slice(0, -1); error.value = '' }
const clearPin = () => { pin.value = ''; error.value = '' }

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
const logout = () => {
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('screen_locked')
  router.push('/login')
}
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
</style>

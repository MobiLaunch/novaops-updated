<template>
  <v-app class="login-v-app">
    <div class="login-root">
      <div class="login-blobs" aria-hidden="true">
        <div class="login-blob login-blob--1" />
        <div class="login-blob login-blob--2" />
        <div class="login-blob login-blob--3" />
      </div>

      <v-container fluid class="login-container d-flex align-center justify-center">
        <div class="login-stack">
          <div class="text-center mb-6 login-enter">
            <div class="login-logo-wrap m3-logo-bounce">
              <svg class="login-logo-svg" viewBox="0 0 709 709" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M531.067 0H177.022C79.2556 0 0 79.2556 0 177.022V531.067C0 628.834 79.2556 708.089 177.022 708.089H531.067C628.834 708.089 708.089 628.834 708.089 531.067V177.022C708.089 79.2556 628.834 0 531.067 0Z" fill="url(#paint0_linear_1260_273)" />
                <g filter="url(#filter2_d_1260_273)">
                  <path d="M452.379 137.68H493.443C523.743 137.68 547.079 164.414 542.985 194.435L491.717 570.401H393.371L452.379 137.68Z" fill="url(#paint1_linear_1260_273)" />
                </g>
                <g filter="url(#filter3_d_1260_273)">
                  <path d="M196.687 137.68H265.247C281.002 137.68 293.137 151.581 291.008 167.193L236.025 570.401H137.68L196.687 137.68Z" fill="url(#paint2_linear_1260_273)" />
                </g>
                <path d="M196.707 137.68H262.857C282.464 137.68 300.262 149.14 308.375 166.99L491.744 570.401H393.398L196.707 137.68Z" fill="url(#paint3_linear_1260_273)" fill-opacity="0.2" />
                <defs>
                  <filter id="filter2_d_1260_273" x="378.271" y="137.58" width="180.282" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="15" />
                    <feGaussianBlur stdDeviation="7.55" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape" />
                  </filter>
                  <filter id="filter3_d_1260_273" x="122.58" y="137.58" width="183.77" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="15" />
                    <feGaussianBlur stdDeviation="7.55" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape" />
                  </filter>
                  <linearGradient id="paint0_linear_1260_273" x1="0" y1="354.045" x2="708.089" y2="354.045" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F9AA32" />
                    <stop offset="0.2" stop-color="#F8774E" />
                    <stop offset="0.410649" stop-color="#FD4372" />
                    <stop offset="0.585" stop-color="#F95DA5" />
                    <stop offset="0.8" stop-color="#F57DE4" />
                    <stop offset="1" stop-color="#43B9FB" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_1260_273" x1="472.048" y1="570.401" x2="472.049" y2="137.68" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#009DDC" />
                    <stop offset="1" stop-color="#3C9D51" />
                  </linearGradient>
                  <linearGradient id="paint2_linear_1260_273" x1="216.356" y1="570.401" x2="216.357" y2="137.68" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#009DDC" />
                    <stop offset="1" stop-color="#3C9D51" />
                  </linearGradient>
                  <linearGradient id="paint3_linear_1260_273" x1="344.226" y1="570.401" x2="344.226" y2="137.68" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#009DDC" />
                    <stop offset="1" stop-color="#3C9D51" stop-opacity="0.85" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="text-h5 font-weight-black mt-4">NovaOps</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">Sign in to your repair shop</p>
          </div>

          <v-card class="login-card pa-6" max-width="420" width="100%" rounded="xl" elevation="6" border>
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="comfortable"
              rounded="lg"
              class="mb-4"
              closable
              @click:close="error = ''"
            >
              {{ error }}
            </v-alert>

            <div v-if="googleEnabled || facebookEnabled" class="d-flex flex-column gap-3 mb-2">
              <v-btn
                v-if="googleEnabled"
                variant="outlined"
                size="large"
                rounded="pill"
                class="text-none font-weight-bold"
                :disabled="loading"
                @click="signInWithGoogle"
              >
                <template #prepend>
                  <span class="d-inline-flex me-1" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </span>
                </template>
                Continue with Google
              </v-btn>

              <v-btn
                v-if="facebookEnabled"
                size="large"
                rounded="pill"
                class="text-none font-weight-bold text-white fb-btn"
                :disabled="loading"
                @click="signInWithFacebook"
              >
                <template #prepend>
                  <v-icon icon="mdi-facebook" size="20" color="white" />
                </template>
                Continue with Facebook
              </v-btn>

              <v-divider class="my-1">
                <span class="text-caption text-medium-emphasis font-weight-bold px-2">or</span>
              </v-divider>
            </div>

            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :disabled="loading"
              hide-details="auto"
              @keyup.enter="handleLogin"
            />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              autocomplete="current-password"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              :disabled="loading"
              hide-details="auto"
              @keyup.enter="handleLogin"
            />

            <v-btn
              block
              color="primary"
              size="large"
              rounded="pill"
              class="text-none font-weight-black mb-2"
              :loading="loading"
              prepend-icon="mdi-login"
              @click="handleLogin"
            >
              Sign In
            </v-btn>

            <v-divider class="my-4">
              <span class="text-caption text-medium-emphasis font-weight-bold px-2">New here?</span>
            </v-divider>

            <v-btn block variant="tonal" rounded="pill" size="large" class="text-none font-weight-bold" to="/register">
              Create an account
            </v-btn>
          </v-card>

          <p class="text-center text-caption text-medium-emphasis mt-4">
            Repair shop management by NovaOps
          </p>

          <v-card
            v-if="!$supabase && !sbConn.status.connected"
            class="mt-4 pa-5 login-enter"
            color="success"
            variant="tonal"
            border
            rounded="xl"
            max-width="420"
            width="100%"
          >
            <div class="d-flex align-start gap-3 mb-4">
              <v-avatar color="success" size="40" rounded="lg" variant="flat">
                <v-icon icon="mdi-database-outline" size="22" color="white" />
              </v-avatar>
              <div>
                <p class="text-body-2 font-weight-black text-success">Connect your database first</p>
                <p class="text-caption text-medium-emphasis mt-1">
                  NovaOps needs a Supabase project to store your data. It is free and takes about two minutes.
                </p>
              </div>
            </div>
            <div class="d-flex flex-column gap-2">
              <v-btn
                color="success"
                variant="flat"
                rounded="pill"
                class="flex-grow-1 text-none font-weight-black"
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                prepend-icon="mdi-open-in-new"
              >
                Create free project
              </v-btn>
              <v-btn
                variant="outlined"
                color="success"
                rounded="pill"
                class="flex-grow-1 text-none font-weight-black"
                prepend-icon="mdi-link"
                @click="showSbSetup = true"
              >
                I have a project
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-container>
    </div>

    <v-dialog v-model="showSbSetup" max-width="480" scrim="rgba(0,0,0,0.55)">
      <v-card rounded="xl" border class="overflow-hidden">
        <v-card-item class="border-b py-3">
          <template #prepend>
            <v-avatar color="success" size="44" rounded="lg">
              <v-icon icon="mdi-database-outline" color="white" />
            </v-avatar>
          </template>
          <v-card-title class="text-subtitle-1 font-weight-black ps-0">Connect Supabase</v-card-title>
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="showSbSetup = false" />
          </template>
        </v-card-item>
        <v-card-text class="pt-6">
          <v-sheet color="surface-variant" rounded="lg" class="pa-3 mb-4">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase" style="letter-spacing: 0.08em">
              supabase.com/dashboard → your project → Settings → API
            </p>
          </v-sheet>
          <v-text-field
            v-model="sbSetupForm.url"
            label="Project URL"
            type="url"
            placeholder="https://xxxxxxxxxxxx.supabase.co"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
          />
          <v-text-field
            v-model="sbSetupForm.key"
            label="Anon / public key"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
          />
          <v-alert v-if="sbConn.status.error" type="error" variant="tonal" density="compact" class="mb-3" rounded="lg">
            {{ sbConn.status.error }}
          </v-alert>
          <v-btn
            block
            color="success"
            size="large"
            rounded="pill"
            class="text-none font-weight-black"
            :loading="sbConn.status.checking"
            :disabled="sbConn.status.checking || !sbSetupForm.url || !sbSetupForm.key"
            prepend-icon="mdi-database-check"
            @click="handleLoginSbConnect"
          >
            Connect &amp; sign in
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({ layout: 'auth' })

const { $supabase } = useNuxtApp()
const sbConn = useSupabaseConnect()

const showSbSetup = ref(false)
const sbSetupForm = ref({ url: '', key: '' })

watch(showSbSetup, (open) => {
  if (open) sbConn.status.error = null
})

const handleLoginSbConnect = async () => {
  await sbConn.saveAndConnect(sbSetupForm.value.url, sbSetupForm.value.key)
}

const config = useRuntimeConfig()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const googleEnabled = computed(() => !!$supabase && !!(config.public as any).socialGoogleEnabled)
const facebookEnabled = computed(() => !!$supabase && !!(config.public as any).socialFacebookEnabled)

async function ensureProfile(user: any) {
  const { error: profileError } = await ($supabase as any)
    .from('profiles').select('id').eq('id', user.id).single()
  if (profileError?.code === 'PGRST116') {
    await ($supabase as any).from('profiles').insert({
      id: user.id, email: user.email,
      business_name: '', phone: '', address: '', currency: '$',
    })
    return true
  }
  return false
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data, error: authError } = await ($supabase as any).auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) throw authError
    if (data.user) {
      const isNew = await ensureProfile(data.user)
      await navigateTo(isNew ? '/intro?from=register' : '/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''
  try {
    const isElectron = !!(window as any).electronAPI?.isElectron

    if (isElectron) {
      const electronAPI = (window as any).electronAPI
      const supabaseUrl = config.public.supabaseUrl as string
      const supabaseKey = config.public.supabaseKey as string

      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase not configured')

      const result = await electronAPI.startGoogleOAuth(supabaseUrl, supabaseKey)
      if (!result.ok) throw new Error(result.error || 'Google sign-in failed')

      if (result.code) {
        const { data, error: sessError } = await ($supabase as any).auth.exchangeCodeForSession(result.code)
        if (sessError) throw sessError
        if (data?.user) {
          const isNew = await ensureProfile(data.user)
          await navigateTo(isNew ? '/intro?from=register' : '/dashboard')
          return
        }
      }

      throw new Error('No session returned from OAuth')
    } else {
      const { error: authError } = await ($supabase as any).auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (authError) throw authError
    }
  } catch (err: any) {
    error.value = err.message || 'Google sign-in failed'
    loading.value = false
  }
}

const signInWithFacebook = async () => {
  loading.value = true
  error.value = ''
  try {
    const { error: authError } = await ($supabase as any).auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email,public_profile',
      },
    })
    if (authError) throw authError
  } catch (err: any) {
    error.value = err.message || 'Facebook sign-in failed'
    loading.value = false
  }
}
</script>

<style scoped>
.login-v-app {
  min-height: 100vh;
  min-height: 100dvh;
  background: rgb(var(--v-theme-background));
}

.login-root {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 1;
}

.login-blobs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.login-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.22;
}

.login-blob--1 {
  width: 24rem;
  height: 24rem;
  top: -8rem;
  left: -8rem;
  background: radial-gradient(circle, #6366f1, transparent);
}

.login-blob--2 {
  width: 24rem;
  height: 24rem;
  bottom: -8rem;
  right: -8rem;
  background: radial-gradient(circle, #a855f7, transparent);
  opacity: 0.16;
}

.login-blob--3 {
  width: 36rem;
  height: 36rem;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #06b6d4, transparent);
  opacity: 0.06;
}

.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  z-index: 2;
}

.login-stack {
  width: 100%;
  max-width: 26rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-card {
  animation: loginEnter 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) both;
}

.login-enter {
  animation: loginEnter 0.55s cubic-bezier(0.34, 1.3, 0.64, 1) both;
}

.login-logo-wrap {
  filter: drop-shadow(0 8px 40px rgba(253, 67, 114, 0.35));
}

.login-logo-svg {
  width: 5rem;
  height: 5rem;
  display: block;
  margin: 0 auto;
}

.fb-btn {
  background: #1877f2 !important;
}

@keyframes loginEnter {
  0% {
    transform: scale(0.94) translateY(20px);
    opacity: 0;
  }
  65% {
    transform: scale(1.02) translateY(-4px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.m3-logo-bounce {
  animation: logoBounce 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes logoBounce {
  0% {
    transform: scale(0.6) rotate(-10deg);
    opacity: 0;
  }
  65% {
    transform: scale(1.1) rotate(3deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
</style>

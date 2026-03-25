<template>
  <!-- position:fixed + inset:0 ensures the background fills every pixel of
       the Electron window, including the hidden-titlebar region that
       min-h-screen misses. overflow-y:auto restores scrollability. -->
  <div style="position:fixed;inset:0;overflow-y:auto;background:hsl(var(--background));display:flex;align-items:center;justify-content:center;padding:1rem">

    <!-- M3 Expressive background blobs: fixed to cover entire window -->
    <div style="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0">
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
      <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style="background: radial-gradient(circle, #a855f7, transparent)" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style="background: radial-gradient(circle, #06b6d4, transparent)" />
    </div>

    <div class="relative w-full max-w-sm flex flex-col gap-7" style="position:relative;z-index:1;animation: loginEnter 0.5s cubic-bezier(0.34,1.3,0.64,1) both">

      <!-- Logo & Brand -->
      <div class="flex flex-col items-center gap-4">
        <div class="m3-logo-bounce drop-shadow-2xl" style="filter: drop-shadow(0 8px 40px rgba(253,67,114,0.4))">
          <svg class="w-20 h-20" viewBox="0 0 709 709" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M531.067 0H177.022C79.2556 0 0 79.2556 0 177.022V531.067C0 628.834 79.2556 708.089 177.022 708.089H531.067C628.834 708.089 708.089 628.834 708.089 531.067V177.022C708.089 79.2556 628.834 0 531.067 0Z" fill="url(#paint0_linear_1260_273)"/>
            <g filter="url(#filter2_d_1260_273)">
            <path d="M452.379 137.68H493.443C523.743 137.68 547.079 164.414 542.985 194.435L491.717 570.401H393.371L452.379 137.68Z" fill="url(#paint1_linear_1260_273)"/>
            </g>
            <g filter="url(#filter3_d_1260_273)">
            <path d="M196.687 137.68H265.247C281.002 137.68 293.137 151.581 291.008 167.193L236.025 570.401H137.68L196.687 137.68Z" fill="url(#paint2_linear_1260_273)"/>
            </g>
            <path d="M196.707 137.68H262.857C282.464 137.68 300.262 149.14 308.375 166.99L491.744 570.401H393.398L196.707 137.68Z" fill="url(#paint3_linear_1260_273)" fill-opacity="0.2"/>
            <defs>
            <filter id="filter2_d_1260_273" x="378.271" y="137.58" width="180.282" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="15"/>
            <feGaussianBlur stdDeviation="7.55"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
            </filter>
            <filter id="filter3_d_1260_273" x="122.58" y="137.58" width="183.77" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="15"/>
            <feGaussianBlur stdDeviation="7.55"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
            </filter>
            <linearGradient id="paint0_linear_1260_273" x1="0" y1="354.045" x2="708.089" y2="354.045" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F9AA32"/>
            <stop offset="0.2" stop-color="#F8774E"/>
            <stop offset="0.410649" stop-color="#FD4372"/>
            <stop offset="0.585" stop-color="#F95DA5"/>
            <stop offset="0.8" stop-color="#F57DE4"/>
            <stop offset="1" stop-color="#43B9FB"/>
            </linearGradient>
            <linearGradient id="paint1_linear_1260_273" x1="472.048" y1="570.401" x2="472.049" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51"/>
            </linearGradient>
            <linearGradient id="paint2_linear_1260_273" x1="216.356" y1="570.401" x2="216.357" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51"/>
            </linearGradient>
            <linearGradient id="paint3_linear_1260_273" x1="344.226" y1="570.401" x2="344.226" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51" stop-opacity="0.85"/>
            </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div class="text-center">
          <h1 class="text-3xl font-black tracking-tight">NovaOps</h1>
          <p class="text-sm text-muted-foreground mt-1 font-medium">Sign in to your repair shop</p>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-[32px] bg-card p-7 flex flex-col gap-5 shadow-xl" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">

        <!-- Error alert -->
        <div
          v-if="error"
          class="flex items-center gap-3 p-4 rounded-[20px]"
          style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0"
        >
          <AlertCircle class="w-5 h-5 flex-shrink-0" style="color: #ef4444" />
          <p class="text-sm font-semibold" style="color: #ef4444">{{ error }}</p>
        </div>

        <!-- ── Social sign-in buttons ──────────────────────────────────── -->
        <div v-if="googleEnabled || facebookEnabled" class="flex flex-col gap-3">
          <!-- Google -->
          <button
            v-if="googleEnabled"
            class="social-btn w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-3 border-2 transition-all"
            style="background: #fff; border-color: #e5e7eb; color: #374151"
            :disabled="loading"
            @click="signInWithGoogle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <!-- Facebook -->
          <button
            v-if="facebookEnabled"
            class="social-btn w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-3 border-2 transition-all"
            style="background: #1877F2; border-color: #1877F2; color: #fff"
            :disabled="loading"
            @click="signInWithFacebook"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          <!-- Divider -->
          <div class="relative flex items-center gap-3 my-1">
            <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
            <span class="text-xs text-muted-foreground font-semibold">or</span>
            <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="m3-label">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full h-12 px-4 rounded-[20px] text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="m3-label">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full h-12 px-4 rounded-[20px] text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Sign In button -->
        <button
          class="m3-jelly-btn w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 20px #6366f150"
          :disabled="loading"
          @click="handleLogin"
        >
          <div v-if="loading" class="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
          <LogIn v-else class="w-5 h-5" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>

        <!-- Divider -->
        <div class="relative flex items-center gap-3">
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
          <span class="text-xs text-muted-foreground font-semibold">New here?</span>
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
        </div>

        <!-- Register -->
        <NuxtLink to="/register">
          <button class="m3-tonal-btn w-full h-12 rounded-full text-sm font-bold transition-all" style="background: hsl(var(--muted)); color: hsl(var(--foreground))">
            Create an account
          </button>
        </NuxtLink>

      </div>

      <p class="text-center text-xs text-muted-foreground font-medium">
        Repair shop management by NovaOps
      </p>

      <!-- Supabase not-connected banner -->
      <div v-if="!$supabase && !sbConn.status.connected"
        class="rounded-[24px] p-5 flex flex-col gap-4"
        style="background:#3ecf8e10;outline:2px solid #3ecf8e28;outline-offset:0;animation:loginEnter 0.55s 0.15s cubic-bezier(0.34,1.3,0.64,1) both">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-[16px] flex items-center justify-center flex-shrink-0" style="background:#3ecf8e20">
            <Database class="w-4 h-4" style="color:#3ecf8e" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-black" style="color:#1a9e6a">Connect your database first</p>
            <p class="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
              NovaOps needs a Supabase project to store your data. It's free and takes 2 minutes.
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
            style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)">
            <ExternalLink class="w-3.5 h-3.5" />
            Create Free Project
          </a>
          <button @click="showSbSetup = true"
            class="flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-xs font-black transition-all hover:scale-[1.02] active:scale-95"
            style="background:#3ecf8e14;color:#1a9e6a;outline:1.5px solid #3ecf8e28;outline-offset:0">
            <Link class="w-3.5 h-3.5" />
            I have a project
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Supabase quick-connect modal on login page -->
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="showSbSetup" class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(10px)" @click.self="showSbSetup = false">
        <div class="w-full max-w-md rounded-[32px] bg-card flex flex-col shadow-2xl overflow-hidden"
          style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0;animation:sbModalEnter 0.35s cubic-bezier(0.34,1.3,0.64,1) both">

          <div class="flex items-center gap-4 px-7 pt-7 pb-5 border-b border-border/50" style="background:#3ecf8e06">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center flex-shrink-0 shadow-md"
              style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
              <Database class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <h2 class="text-base font-black">Connect Supabase</h2>
              <p class="text-xs text-muted-foreground font-medium mt-0.5">Paste your project credentials</p>
            </div>
            <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 text-muted-foreground" @click="showSbSetup = false">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-7 space-y-4">
            <div class="rounded-[16px] p-3.5 space-y-1.5" style="background:hsl(var(--muted)/0.5)">
              <p class="text-[11px] font-black text-muted-foreground uppercase tracking-widest">supabase.com/dashboard → your project → Settings → API</p>
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Project URL</label>
              <input v-model="sbSetupForm.url" type="url" placeholder="https://xxxxxxxxxxxx.supabase.co"
                class="w-full h-12 px-4 rounded-[18px] text-xs font-mono border-2 outline-none transition-all"
                style="background:hsl(var(--muted)/0.5);border-color:hsl(var(--border)/0.7)"
                @focus="($event.target as HTMLElement).style.borderColor='#3ecf8e'"
                @blur="($event.target as HTMLElement).style.borderColor='hsl(var(--border)/0.7)'" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Anon / Public Key</label>
              <input v-model="sbSetupForm.key" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                class="w-full h-12 px-4 rounded-[18px] text-xs font-mono border-2 outline-none transition-all"
                style="background:hsl(var(--muted)/0.5);border-color:hsl(var(--border)/0.7)"
                @focus="($event.target as HTMLElement).style.borderColor='#3ecf8e'"
                @blur="($event.target as HTMLElement).style.borderColor='hsl(var(--border)/0.7)'" />
            </div>
            <div v-if="sbConn.status.error" class="flex items-center gap-2 p-3 rounded-[14px] text-xs font-semibold"
              style="background:#ef444412;color:#ef4444">
              <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
              {{ sbConn.status.error }}
            </div>
            <button @click="handleLoginSbConnect" :disabled="sbConn.status.checking || !sbSetupForm.url || !sbSetupForm.key"
              class="w-full h-12 rounded-full text-sm font-black text-white flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:scale-[1.02]"
              style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
              <div v-if="sbConn.status.checking" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <Database v-else class="w-4 h-4" />
              {{ sbConn.status.checking ? 'Testing…' : 'Connect & Sign In' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LogIn, AlertCircle, Database, ExternalLink, Link, X } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { $supabase } = useNuxtApp()
const sbConn = useSupabaseConnect()

// Supabase quick-connect from login page
const showSbSetup = ref(false)
const sbSetupForm = ref({ url: '', key: '' })

watch(showSbSetup, (open) => {
  if (open) sbConn.status.error = null
})

const handleLoginSbConnect = async () => {
  await sbConn.saveAndConnect(sbSetupForm.value.url, sbSetupForm.value.key)
  // On success: window.location.href = '/' — page reloads with new client
}
const config        = useRuntimeConfig()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

// Social sign-in buttons are shown whenever Supabase is available.
// Previously gated on NUXT_PUBLIC_SOCIAL_GOOGLE/FACEBOOK env vars which were
// rarely set, causing the buttons to never appear.
// Supabase controls whether providers are enabled — if not configured in the
// Supabase dashboard, signInWithOAuth returns a clear error we show the user.
// Only show social login buttons when BOTH Supabase is configured AND the
// provider is explicitly enabled via NUXT_PUBLIC_SOCIAL_GOOGLE / _FACEBOOK.
// Showing buttons without the provider configured causes "Invalid App ID"
// or "provider not enabled" errors on the Supabase/OAuth side.
const googleEnabled   = computed(() => !!$supabase && !!(config.public as any).socialGoogleEnabled)
const facebookEnabled = computed(() => !!$supabase && !!(config.public as any).socialFacebookEnabled)

// ── Ensure profile row exists after any sign-in ────────────────────────────
async function ensureProfile(user: any) {
  const { error: profileError } = await ($supabase as any)
    .from('profiles').select('id').eq('id', user.id).single()
  if (profileError?.code === 'PGRST116') {
    await ($supabase as any).from('profiles').insert({
      id: user.id, email: user.email,
      business_name: '', phone: '', address: '', currency: '$',
    })
    // Brand new account — show the intro screen before profile setup
    return true  // isNew
  }
  return false  // existing user
}

// ── Email + password ───────────────────────────────────────────────────────
const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password'
    return
  }
  loading.value = true
  error.value   = ''
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

// ── Google OAuth (Supabase Auth) ───────────────────────────────────────────
// In Electron: uses the loopback server approach (opens system browser,
// captures the callback on 127.0.0.1, exchanges for a Supabase session).
// In regular browser: uses Supabase's built-in signInWithOAuth redirect.
const signInWithGoogle = async () => {
  loading.value = true
  error.value   = ''
  try {
    const isElectron = !!(window as any).electronAPI?.isElectron

    if (isElectron) {
      // ── Electron loopback OAuth flow ──────────────────────────────────
      const electronAPI = (window as any).electronAPI
      const supabaseUrl = config.public.supabaseUrl as string
      const supabaseKey = config.public.supabaseKey as string

      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase not configured')

      const result = await electronAPI.startGoogleOAuth(supabaseUrl, supabaseKey)
      if (!result.ok) throw new Error(result.error || 'Google sign-in failed')

      // We got the authorization code — now Supabase handles the exchange.
      // Since Supabase redirected us through its /auth/v1/authorize, the
      // callback URL actually contains access_token + refresh_token as
      // hash fragments or query params. We need to set the session.
      if (result.code) {
        // The loopback received an auth code. For Supabase OAuth, the
        // callback URL from Supabase actually includes the tokens directly
        // when using the implicit flow. Let's try to exchange via the
        // Supabase client's built-in exchange.
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
      // ── Browser redirect OAuth flow ──────────────────────────────────
      const { error: authError } = await ($supabase as any).auth.signInWithOAuth({
        provider:  'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt:      'consent',
          },
        },
      })
      if (authError) throw authError
      // Supabase will redirect the browser; loading stays true
    }
  } catch (err: any) {
    error.value   = err.message || 'Google sign-in failed'
    loading.value = false
  }
}

// ── Facebook OAuth (Supabase Auth) ─────────────────────────────────────────
const signInWithFacebook = async () => {
  loading.value = true
  error.value   = ''
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
    error.value   = err.message || 'Facebook sign-in failed'
    loading.value = false
  }
}
</script>

<style scoped>
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
@keyframes loginEnter {
  0%   { transform: scale(0.94) translateY(20px); opacity: 0; }
  65%  { transform: scale(1.02) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

.m3-logo-bounce {
  animation: logoBounce 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes logoBounce {
  0%   { transform: scale(0.6) rotate(-10deg); opacity: 0; }
  65%  { transform: scale(1.1) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
}

.m3-jelly-btn {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-jelly-btn:hover:not(:disabled)  { transform: scale(1.04) translateY(-2px); box-shadow: 0 8px 32px #6366f160 !important; }
.m3-jelly-btn:active:not(:disabled) { transform: scale(0.92); }

.m3-tonal-btn {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m3-tonal-btn:hover  { transform: scale(1.03); }
.m3-tonal-btn:active { transform: scale(0.95); }

.social-btn {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
}
.social-btn:hover:not(:disabled)  { transform: scale(1.03) translateY(-1px); filter: brightness(1.05); }
.social-btn:active:not(:disabled) { transform: scale(0.96); }
@keyframes sbModalEnter {
  0%   { opacity: 0; transform: scale(0.9) translateY(16px); }
  65%  { opacity: 1; transform: scale(1.02) translateY(-3px); }
  100% { transform: scale(1) translateY(0); }
}
.overlay-enter-active { transition: opacity 0.2s ease; }
.overlay-leave-active { transition: opacity 0.18s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>

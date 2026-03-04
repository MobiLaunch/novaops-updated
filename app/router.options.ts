import type { RouterConfig } from '@nuxt/schema'
import { createWebHashHistory } from 'vue-router'

export default <RouterConfig>{
    // Hash history is required for Electron's file:// protocol.
    // On web (Vercel / browser) we use the default HTML5 history so
    // Supabase auth fragments (#access_token, token refresh) work correctly.
    history: base => {
        if (import.meta.client && (window as any).electronAPI?.isElectron) {
            return createWebHashHistory(base)
        }
        return undefined   // falls back to Nuxt's default (createWebHistory)
    }
}

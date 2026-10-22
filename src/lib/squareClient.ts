/**
 * Square API client for the Frontend.
 * 
 * Uses the Electron `proxyFetch` IPC bridge to bypass browser CORS restrictions.
 * If running in a normal browser (not Electron), it falls back to standard fetch
 * (which will likely fail due to Square's CORS policy, but preserves interface parity).
 */

import { useAppStore } from '@/lib/store'

const SQUARE_API = 'https://connect.squareup.com/v2'
const SQUARE_VERSION = '2025-01-23'   // latest stable as of early 2025

export function getSquareCredentials() {
    const appStore = useAppStore.getState()
    const settings = appStore.settings

    // Credentials come from the user settings held in the app store (the browser has no server env).
    const accessToken = settings?.squareAccessToken || ''
    const locationId = settings?.squareLocationId || ''

    if (!accessToken || !locationId) {
        throw new Error('Square credentials missing. Configure them in Settings.')
    }

    return { accessToken, locationId }
}

export async function squareFetch(
    path: string,
    options: { method?: string; body?: any; accessToken?: string } = {}
) {
    let token = options.accessToken
    if (!token) {
        const creds = getSquareCredentials()
        token = creds.accessToken
    }

    const url = `${SQUARE_API}${path}`
    const fetchOpts = {
        method: options.method ?? 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Square-Version': SQUARE_VERSION,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    }

    // Attempt to use the Electron IPC Proxy to bypass CORS
    const electronAPI = (window as any).electronAPI
    if (electronAPI && electronAPI.proxyFetch) {
        const res = await electronAPI.proxyFetch(url, fetchOpts)
        if (!res.ok) {
            const msg = res.data?.errors?.[0]?.detail || res.data?.errors?.[0]?.code || res.statusText || 'Square API error'
            throw new Error(msg)
        }
        return res.data
    }

    // Fallback to standard fetch (useful during early dev mode layout design, though CORS will 
    // block real API requests)
    const res = await fetch(url, fetchOpts)
    const data = await res.json()

    if (!res.ok) {
        const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || 'Square API error'
        throw new Error(msg)
    }

    return data
}

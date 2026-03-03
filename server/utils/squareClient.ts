/**
 * Square API client — raw fetch, no SDK.
 * Works in all Nitro environments: local Node, Vercel Edge, Vercel Serverless.
 *
 * Credentials are read from Nuxt private runtimeConfig (server-only).
 * Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in:
 *   - Local: novaops-updated-main/.env
 *   - Vercel: Dashboard → Project → Settings → Environment Variables
 */

const SQUARE_API = 'https://connect.squareup.com/v2'
const SQUARE_VERSION = '2025-01-23'   // latest stable as of early 2025

import { H3Event, getHeader } from 'h3'

export function getServerSquareCredentials(event?: H3Event) {
  const config = useRuntimeConfig()

  let accessToken = ''
  let locationId = ''

  if (event) {
    accessToken = getHeader(event, 'x-square-access-token') || ''
    locationId = getHeader(event, 'x-square-location-id') || ''
  }

  // Fall back to preferred config / process.env
  if (!accessToken) {
    accessToken = config.squareAccessToken || process.env.SQUARE_ACCESS_TOKEN || ''
  }
  if (!locationId) {
    locationId = config.squareLocationId || process.env.SQUARE_LOCATION_ID || ''
  }

  if (!accessToken || !locationId) {
    throw new Error(
      'Square credentials missing. Configure them in Settings or environment variables.'
    )
  }

  return { accessToken, locationId }
}

export async function serverSquareFetch(
  path: string,
  accessToken: string,
  options: { method?: string; body?: any } = {}
) {
  const res = await fetch(`${SQUARE_API}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_VERSION,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || 'Square API error'
    throw new Error(msg)
  }

  return data
}

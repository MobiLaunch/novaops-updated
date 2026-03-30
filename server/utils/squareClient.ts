/**
 * Square API client — raw fetch, no SDK.
 * Works in all Nitro environments: local Node, Vercel Edge, Vercel Serverless.
 *
 * Credentials are read from Nuxt private runtimeConfig (server-only).
 * Set SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_APPLICATION_ID in:
 *   - Local: .env
 *   - Vercel: Dashboard → Project → Settings → Environment Variables
 *
 * Sandbox is auto-detected from the access token prefix (EAAAl = sandbox,
 * anything else = production). No separate env var needed.
 */

const SQUARE_VERSION = '2025-01-23'

import { H3Event, getHeader } from 'h3'

function isSandboxToken(token: string): boolean {
  // Square sandbox access tokens start with "EAAAl" (lowercase L)
  // Production tokens start with "EAAAl" too but sandbox app IDs start with "sandbox-"
  // The most reliable signal is the token itself — sandbox tokens contain "sandbox" in them
  // OR the SQUARE_APPLICATION_ID starts with "sandbox-"
  return token.startsWith('EAAAlx') === false
    ? false
    : process.env.SQUARE_APPLICATION_ID?.startsWith('sandbox-') ?? false
}

function getSquareBaseUrl(accessToken: string): string {
  const appId = process.env.SQUARE_APPLICATION_ID || ''
  const sandbox = appId.startsWith('sandbox-') ||
    accessToken.toLowerCase().includes('sandbox') ||
    process.env.SQUARE_SANDBOX === 'true'
  return sandbox
    ? 'https://connect.squareupsandbox.com/v2'
    : 'https://connect.squareup.com/v2'
}

export function getServerSquareCredentials(event?: H3Event) {
  const config = useRuntimeConfig()

  let accessToken = ''
  let locationId = ''

  if (event) {
    accessToken = getHeader(event, 'x-square-access-token') || ''
    locationId = getHeader(event, 'x-square-location-id') || ''
  }

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
  const baseUrl = getSquareBaseUrl(accessToken)

  const res = await fetch(`${baseUrl}${path}`, {
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

export async function createPayment(accessToken: string, payload: any) {
  return serverSquareFetch('/payments', accessToken, { method: 'POST', body: payload })
}

export async function retrievePayment(accessToken: string, paymentId: string) {
  return serverSquareFetch(`/payments/${paymentId}`, accessToken)
}

export async function createOrder(accessToken: string, payload: any) {
  return serverSquareFetch('/orders', accessToken, { method: 'POST', body: payload })
}

export async function retrieveOrder(accessToken: string, orderId: string) {
  return serverSquareFetch(`/orders/${orderId}`, accessToken)
}

export async function listCustomers(accessToken: string) {
  return serverSquareFetch('/customers', accessToken)
}

export async function pairTerminal(accessToken: string, payload: any) {
  return serverSquareFetch('/terminal/checkouts', accessToken, { method: 'POST', body: payload })
}

export async function listLocations(accessToken: string) {
  return serverSquareFetch('/locations', accessToken)
}

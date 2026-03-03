const SQUARE_API = 'https://connect.squareup.com/v2'
const SQUARE_VERSION = '2024-01-18'

export function getSquareCredentials() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID
  if (!accessToken || !locationId) {
    throw new Error('SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID must be set in environment variables.')
  }
  return { accessToken, locationId }
}

export async function squareFetch(
  path: string,
  accessToken: string,
  options: { method?: string; body?: any } = {}
) {
  const isSandbox = process.env.SQUARE_APPLICATION_ID?.startsWith('sandbox-')
  const baseUrl = isSandbox
    ? 'https://connect.squareupsandbox.com/v2'
    : SQUARE_API

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

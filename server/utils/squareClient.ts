// Raw fetch-based Square API client — no SDK, works in all Nitro/Vercel environments

const SQUARE_API = 'https://connect.squareup.com/v2'
const SQUARE_VERSION = '2024-01-18'

export function getSquareCredentials() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!accessToken || !locationId) {
    throw new Error('SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID must be set in Vercel environment variables.')
  }

  return { accessToken, locationId }
}

export async function squareFetch(
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

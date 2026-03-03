// server/api/square/test.post.ts
// Temporary debug endpoint — remove after fixing
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Check 1: Can we read env vars?
  const hasAccessToken = !!process.env.SQUARE_ACCESS_TOKEN
  const hasLocationId  = !!process.env.SQUARE_LOCATION_ID
  const hasAppId       = !!process.env.SQUARE_APPLICATION_ID

  // Check 2: Can we import squareClient?
  let credError = null
  let credentials = null
  try {
    credentials = getSquareCredentials()
  } catch (e: any) {
    credError = e.message
  }

  // Check 3: Can we reach Square's API at all?
  let pingError = null
  let pingStatus = null
  if (credentials) {
    try {
      const isSandbox = process.env.SQUARE_APPLICATION_ID?.startsWith('sandbox-')
      const base = isSandbox
        ? 'https://connect.squareupsandbox.com/v2'
        : 'https://connect.squareup.com/v2'
      const res = await fetch(`${base}/locations/${credentials.locationId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Square-Version': '2024-01-18',
        },
      })
      pingStatus = res.status
      if (!res.ok) {
        const data = await res.json()
        pingError = data?.errors?.[0]?.detail || `HTTP ${res.status}`
      }
    } catch (e: any) {
      pingError = e.message
    }
  }

  return {
    env: { hasAccessToken, hasLocationId, hasAppId },
    credentials: credError ? { error: credError } : { ok: true, locationId: credentials?.locationId },
    squarePing: pingError ? { error: pingError } : { status: pingStatus, ok: pingStatus === 200 },
    body,
  }
})

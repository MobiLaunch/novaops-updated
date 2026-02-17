import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async () => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!accessToken || !locationId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Square credentials not configured. Add SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID to your Vercel environment variables.',
    })
  }

  try {
    const squarePkg = await import('square')
    const { Client, Environment } = (squarePkg.default ?? squarePkg) as any

    const client = new Client({
      accessToken,
      environment: Environment.Production,
    })

    const response = await client.locationsApi.retrieveLocation(locationId)
    const result = JSON.parse(JSON.stringify(response.result, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))

    return {
      success: true,
      locationName: result.location?.name,
      status: 'Connected',
    }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Connection failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

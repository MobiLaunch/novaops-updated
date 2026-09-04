/**
 * GET /api/square/connection-test
 * FIX: Removed top-level imports for h3 (Nitro auto-imports) and squareClient
 * (moved to dynamic import inside handler to prevent TDZ errors).
 */


export default defineEventHandler(async (event) => {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(event)
    const data = await serverSquareFetch(`/locations/${locationId}`, accessToken)
    return { success: true, locationName: data.location?.name, status: 'Connected' }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Connection failed' })
  }
})

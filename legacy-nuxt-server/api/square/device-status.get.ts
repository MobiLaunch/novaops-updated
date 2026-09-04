/**
 * GET /api/square/device-status
 * FIX: Removed top-level imports for h3 and squareClient (dynamic import inside handler).
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const deviceCodeId = query.deviceCodeId as string

  try {
    const { accessToken } = getServerSquareCredentials(event)
    const data = await serverSquareFetch(`/devices/codes/${deviceCodeId}`, accessToken)
    return {
      status: data.device_code?.status,
      deviceId: data.device_code?.device_id,
      pairingCode: data.device_code?.code,
    }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to check device status' })
  }
})

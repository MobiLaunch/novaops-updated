/**
 * POST /api/square/pair-device
 * FIX: Removed top-level imports for h3 and squareClient (dynamic import inside handler).
 */

export default defineEventHandler(async (event) => {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(event)
    const data = await serverSquareFetch('/devices/codes', accessToken, {
      method: 'POST',
      body: {
        idempotency_key: `novaops-pair-${Date.now()}`,
        device_code: {
          product_type: 'TERMINAL_API',
          location_id: locationId,
        },
      },
    })
    return {
      deviceCodeId: data.device_code?.id,
      pairingCode: data.device_code?.code,
      status: data.device_code?.status,
    }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to generate pairing code' })
  }
})

import { defineEventHandler, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async () => {
  try {
    const { accessToken, locationId } = getSquareCredentials()

    // Step 1: Create a device code
    const data = await squareFetch('/devices/codes', accessToken, {
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

import { defineEventHandler, readBody, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amountCents, deviceId, referenceId, note } = body

  if (!amountCents || !deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing amountCents or deviceId' })
  }

  try {
    const { accessToken, locationId } = getSquareCredentials()
    const data = await squareFetch('/terminals/checkouts', accessToken, {
      method: 'POST',
      body: {
        idempotency_key: `${referenceId || 'novaops'}-${Date.now()}`,
        checkout: {
          amount_money: { amount: amountCents, currency: 'USD' },
          device_options: {
            device_id: deviceId,
            skip_receipt_screen: false,
            collect_signature: false,
          },
          location_id: locationId,
          reference_id: referenceId || 'novaops-pos',
          note: note || 'NovaOps Sale',
          payment_type: 'CARD_PRESENT',
        },
      },
    })
    return { success: true, checkoutId: data.checkout?.id, status: data.checkout?.status }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Terminal request failed' })
  }
})

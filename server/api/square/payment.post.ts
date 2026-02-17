import { defineEventHandler, readBody, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sourceId, amountCents, referenceId, note } = body

  if (!sourceId || !amountCents) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceId or amountCents' })
  }

  try {
    const { accessToken, locationId } = getSquareCredentials()
    const data = await squareFetch('/payments', accessToken, {
      method: 'POST',
      body: {
        source_id: sourceId,
        idempotency_key: `${referenceId || 'novaops'}-${Date.now()}`,
        amount_money: { amount: amountCents, currency: 'USD' },
        location_id: locationId,
        reference_id: referenceId || 'novaops-pos',
        note: note || 'NovaOps Sale',
      },
    })
    return { success: true, paymentId: data.payment?.id, status: data.payment?.status }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Payment failed' })
  }
})

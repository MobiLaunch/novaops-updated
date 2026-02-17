import { defineEventHandler, readBody, createError } from 'h3'
import { getSquareClient, serializeBigInt } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sourceId, amountCents, referenceId, note } = body

  if (!sourceId || !amountCents) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceId or amountCents' })
  }

  try {
    const { client, locationId } = await getSquareClient()
    const idempotencyKey = `${referenceId || 'novaops'}-${Date.now()}`

    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
      locationId,
      referenceId: referenceId || 'novaops-pos',
      note: note || 'NovaOps Sale',
    })

    const payment = serializeBigInt(result.payment)
    return { success: true, paymentId: payment.id, status: payment.status }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Payment failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

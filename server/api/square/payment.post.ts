import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!accessToken || !locationId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Square credentials not configured on server.',
    })
  }

  const body = await readBody(event)
  const { sourceId, amountCents, referenceId, note } = body

  if (!sourceId || !amountCents) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceId or amountCents' })
  }

  try {
    const squarePkg = await import('square')
    const { Client, Environment } = (squarePkg.default ?? squarePkg) as any

    const client = new Client({
      accessToken,
      environment: Environment.Production,
    })

    const idempotencyKey = `${referenceId || 'novaops'}-${Date.now()}`

    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: 'USD',
      },
      locationId,
      referenceId: referenceId || 'novaops-pos',
      note: note || 'NovaOps Sale',
    })

    const payment = JSON.parse(JSON.stringify(result.payment, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))

    return { success: true, paymentId: payment.id, status: payment.status }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Payment failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

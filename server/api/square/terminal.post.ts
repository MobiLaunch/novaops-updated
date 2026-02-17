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
  const { amountCents, deviceId, referenceId, note } = body

  if (!amountCents || !deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing amountCents or deviceId' })
  }

  try {
    const squarePkg = await import('square')
    const { Client, Environment } = (squarePkg.default ?? squarePkg) as any

    const client = new Client({
      accessToken,
      environment: Environment.Production,
    })

    const idempotencyKey = `${referenceId || 'novaops'}-${Date.now()}`

    const { result } = await client.terminalApi.createTerminalCheckout({
      idempotencyKey,
      checkout: {
        amountMoney: {
          amount: BigInt(amountCents),
          currency: 'USD',
        },
        deviceOptions: {
          deviceId,
          skipReceiptScreen: false,
          collectSignature: false,
        },
        locationId,
        referenceId: referenceId || 'novaops-pos',
        note: note || 'NovaOps Sale',
        paymentType: 'CARD_PRESENT',
      },
    })

    const checkout = JSON.parse(JSON.stringify(result.checkout, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))

    return { success: true, checkoutId: checkout.id, status: checkout.status }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Terminal request failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

import { defineEventHandler, readBody, createError } from 'h3'
import { getSquareClient, serializeBigInt } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amountCents, deviceId, referenceId, note } = body

  if (!amountCents || !deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing amountCents or deviceId' })
  }

  try {
    const { client, locationId } = await getSquareClient()
    const idempotencyKey = `${referenceId || 'novaops'}-${Date.now()}`

    const { result } = await client.terminalApi.createTerminalCheckout({
      idempotencyKey,
      checkout: {
        amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
        deviceOptions: { deviceId, skipReceiptScreen: false, collectSignature: false },
        locationId,
        referenceId: referenceId || 'novaops-pos',
        note: note || 'NovaOps Sale',
        paymentType: 'CARD_PRESENT',
      },
    })

    const checkout = serializeBigInt(result.checkout)
    return { success: true, checkoutId: checkout.id, status: checkout.status }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Terminal request failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

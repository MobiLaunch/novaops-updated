/**
 * POST /api/square/terminal
 * FIX: Removed top-level imports for h3 and squareClient (dynamic import inside handler).
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amountCents, deviceId, referenceId, note } = body

  if (!amountCents || !deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing amountCents or deviceId' })
  }

  try {
    const { accessToken, locationId } = getServerSquareCredentials(event)
    const data = await serverSquareFetch('/terminals/checkouts', accessToken, {
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

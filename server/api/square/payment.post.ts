/**
 * POST /api/square/payment
 * FIX: Removed top-level imports for h3 and squareClient (dynamic import inside handler).
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sourceId, amountCents, referenceId, note } = body

  if (!sourceId || !amountCents) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceId or amountCents' })
  }

  try {
    const { accessToken, locationId } = getServerSquareCredentials(event)
    const data = await serverSquareFetch('/payments', accessToken, {
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

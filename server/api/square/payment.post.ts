/**
 * POST /api/square/payment
 * Full POS pipeline: creates a Square Order then charges it via card nonce.
 * Delegates to posTransactionService so all orchestration is centralised.
 */

import { runPOSTransaction } from '../../services/posTransactionService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    sourceId,
    amountCents,
    referenceId,
    note,
    // POS pipeline extras (optional)
    ticketId,
    customerId,
    customerName,
    customerEmail,
    items,
    taxRatePct,
  } = body

  // ── Fast-path: simple ad-hoc charge (no line items supplied) ─────
  if (!items || items.length === 0) {
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
  }

  // ── Full pipeline: order → payment → verify ──────────────────────
  const result = await runPOSTransaction(event, {
    ticketId:      ticketId   ?? null,
    customerId:    customerId ?? 0,
    customerName:  customerName ?? 'Walk-in',
    customerEmail: customerEmail,
    items,
    sourceId,
    taxRatePct,
    note,
  })

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error || 'POS transaction failed' })
  }

  return {
    success:       true,
    paymentId:     result.squarePaymentId,
    squareOrderId: result.squareOrderId,
    receiptUrl:    result.receiptUrl,
    amountCents:   result.amountCents,
    status:        'COMPLETED',
  }
})

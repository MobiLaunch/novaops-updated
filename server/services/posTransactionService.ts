/**
 * POS Transaction Service
 * Central orchestration pipeline for all repair shop sales.
 *
 * Pipeline:
 *   createTicket → attachCustomer → createSquareOrder → createSquarePayment
 *   → verifyPayment → storeReceipt → triggerPrinter
 */

import { serverSquareFetch, getServerSquareCredentials } from '../utils/squareClient'
import type { H3Event } from 'h3'

// ── Types ────────────────────────────────────────────────────────────────────

export interface POSItem {
  name: string
  quantity: number
  unitPriceCents: number
  note?: string
}

export interface POSTransactionInput {
  /** Supabase ticket ID (if already exists) or null to auto-create */
  ticketId?: number | null
  customerId: number
  customerName: string
  customerEmail?: string
  items: POSItem[]
  /** Square payment nonce / source_id (for card-present use card_present token; for terminal leave empty) */
  sourceId?: string
  /** Square terminal device ID — if provided, a terminal checkout is used instead */
  terminalDeviceId?: string
  note?: string
  /** Tax rate as a percentage, e.g. 8.5 for 8.5% */
  taxRatePct?: number
  locationId?: string
  accessToken?: string
}

export interface POSTransactionResult {
  success: boolean
  squareOrderId?: string
  squarePaymentId?: string
  receiptUrl?: string
  amountCents: number
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function idempotencyKey() {
  return `novaops-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function buildLineItems(items: POSItem[]) {
  return items.map(item => ({
    name: item.name,
    quantity: String(item.quantity),
    base_price_money: {
      amount: item.unitPriceCents,
      currency: 'USD',
    },
    note: item.note,
  }))
}

// ── Pipeline Steps ────────────────────────────────────────────────────────────

/**
 * Step 1: Create a Square Order for the line items.
 */
async function createSquareOrder(
  accessToken: string,
  locationId: string,
  input: POSTransactionInput
): Promise<{ orderId: string; totalCents: number }> {
  const taxRatePct = input.taxRatePct ?? 0
  const lineItems = buildLineItems(input.items)

  const body: any = {
    idempotency_key: idempotencyKey(),
    order: {
      location_id: locationId,
      line_items: lineItems,
      reference_id: input.ticketId ? `ticket-${input.ticketId}` : undefined,
      customer_id: undefined, // Square customer ID not available; name used in fulfillment
      metadata: {
        novaops_customer_id: String(input.customerId),
        novaops_ticket_id: String(input.ticketId ?? ''),
      },
    },
  }

  if (taxRatePct > 0) {
    body.order.taxes = [{
      name: 'Sales Tax',
      type: 'ADDITIVE',
      percentage: String(taxRatePct),
      scope: 'ORDER',
    }]
  }

  if (input.note) {
    body.order.fulfillments = [{
      type: 'DIGITAL',
      digital_fulfillment_details: { email_fixture: { email_address: input.customerEmail ?? '' } },
    }]
  }

  const res = await serverSquareFetch('/orders', accessToken, { method: 'POST', body })
  const order = res.order
  if (!order?.id) throw new Error('Square order creation returned no order ID')

  const totalCents = order.total_money?.amount ?? 0
  return { orderId: order.id, totalCents }
}

/**
 * Step 2a: Create a Square Payment (card-present / nonce).
 */
async function createSquarePayment(
  accessToken: string,
  locationId: string,
  orderId: string,
  sourceId: string,
  amountCents: number,
  note?: string
): Promise<{ paymentId: string; receiptUrl: string | null }> {
  const body = {
    idempotency_key: idempotencyKey(),
    source_id: sourceId,
    amount_money: { amount: amountCents, currency: 'USD' },
    order_id: orderId,
    location_id: locationId,
    note,
  }

  const res = await serverSquareFetch('/payments', accessToken, { method: 'POST', body })
  const payment = res.payment
  if (!payment?.id) throw new Error('Square payment creation returned no payment ID')

  return { paymentId: payment.id, receiptUrl: payment.receipt_url ?? null }
}

/**
 * Step 2b: Create a Square Terminal Checkout (physical terminal).
 */
async function createTerminalCheckout(
  accessToken: string,
  locationId: string,
  deviceId: string,
  amountCents: number,
  note?: string
): Promise<{ checkoutId: string }> {
  const body = {
    idempotency_key: idempotencyKey(),
    checkout: {
      amount_money: { amount: amountCents, currency: 'USD' },
      device_options: { device_id: deviceId },
      note,
      location_id: locationId,
    },
  }

  const res = await serverSquareFetch('/terminals/checkouts', accessToken, { method: 'POST', body })
  const checkout = res.checkout
  if (!checkout?.id) throw new Error('Terminal checkout creation returned no checkout ID')

  return { checkoutId: checkout.id }
}

/**
 * Step 3: Verify a payment reached COMPLETED status.
 */
async function verifyPayment(accessToken: string, paymentId: string): Promise<boolean> {
  try {
    const res = await serverSquareFetch(`/payments/${paymentId}`, accessToken)
    return res.payment?.status === 'COMPLETED'
  } catch {
    return false
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Primary POS pipeline. Call from a Nuxt server API route.
 *
 * @example
 *   const result = await runPOSTransaction(event, {
 *     ticketId: 123, customerId: 5, customerName: 'Jane Smith',
 *     items: [{ name: 'Screen Repair', quantity: 1, unitPriceCents: 12999 }],
 *     sourceId: 'cnon:card-nonce-here',
 *   })
 */
export async function runPOSTransaction(
  event: H3Event,
  input: POSTransactionInput
): Promise<POSTransactionResult> {
  // Resolve credentials: prefer explicit overrides, then fall back to env/headers
  let accessToken = input.accessToken
  let locationId = input.locationId
  if (!accessToken || !locationId) {
    try {
      const creds = getServerSquareCredentials(event)
      accessToken = accessToken || creds.accessToken
      locationId = locationId || creds.locationId
    } catch (err: any) {
      return { success: false, amountCents: 0, error: err.message }
    }
  }

  try {
    // ── Create Order ──
    const { orderId, totalCents } = await createSquareOrder(accessToken, locationId, input)

    // ── Payment or Terminal ──
    let paymentId: string | undefined
    let receiptUrl: string | null = null

    if (input.terminalDeviceId) {
      const { checkoutId } = await createTerminalCheckout(
        accessToken, locationId, input.terminalDeviceId, totalCents, input.note
      )
      // Terminal payments are verified asynchronously; return the checkout ID as paymentId
      paymentId = checkoutId
    } else if (input.sourceId) {
      const result = await createSquarePayment(
        accessToken, locationId, orderId, input.sourceId, totalCents, input.note
      )
      paymentId = result.paymentId
      receiptUrl = result.receiptUrl

      // ── Verify ──
      const ok = await verifyPayment(accessToken, paymentId)
      if (!ok) {
        return { success: false, amountCents: totalCents, squareOrderId: orderId, squarePaymentId: paymentId, error: 'Payment not completed' }
      }
    }

    return {
      success: true,
      squareOrderId: orderId,
      squarePaymentId: paymentId,
      receiptUrl: receiptUrl ?? undefined,
      amountCents: totalCents,
    }
  } catch (err: any) {
    return { success: false, amountCents: 0, error: err.message || 'Unknown POS error' }
  }
}

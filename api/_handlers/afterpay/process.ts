import { wrap, createError, readBody } from "../../_lib/nitro.js";
import { getServerSquareCredentials, serverSquareFetch } from "../../_lib/square.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default wrap(async (event: any) => {
    const body = await readBody(event)
    const { sourceId, amountCents } = body

    if (!sourceId || !amountCents) {
        throw createError({ statusCode: 400, statusMessage: 'Missing sourceId or amountCents for Afterpay payment' })
    }

    try {
        const { accessToken, locationId } = getServerSquareCredentials(event)

        // Process the Afterpay credit token with Square's v2/payments endpoint
        const data = await serverSquareFetch('/payments', accessToken, {
        event,
            method: 'POST',
            body: {
                idempotency_key: `afterpay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source_id: sourceId,
                amount_money: {
                    amount: amountCents,
                    currency: 'USD',
                },
                location_id: locationId,
                autocomplete: true,
                note: 'NovaOps Afterpay POS Checkout',
            },
        })

        if (data.payment && data.payment.status === 'COMPLETED') {
            return { success: true, paymentId: data.payment.id, status: data.payment.status }
        } else {
            throw createError({ statusCode: 400, statusMessage: `Afterpay transaction failed: ${data.payment?.status || 'Unknown error'}` })
        }
    } catch (error: any) {
        throw createError({ statusCode: 400, statusMessage: error.message || 'Afterpay payment request failed' })
    }
})

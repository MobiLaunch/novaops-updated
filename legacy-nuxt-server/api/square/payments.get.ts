/**
 * GET /api/square/payments
 * Fetches payment history from Square. Supports ?days=30 query param.
 */
export default defineEventHandler(async (event) => {
    try {
        const { accessToken, locationId } = getServerSquareCredentials(event)
        const query = getQuery(event)
        const days = parseInt(query.days as string) || 30

        const beginTime = new Date()
        beginTime.setDate(beginTime.getDate() - days)

        const data = await serverSquareFetch('/payments/search', accessToken, {
            method: 'POST',
            body: {
                query: {
                    filter: {
                        location_ids: [locationId],
                        created_at: {
                            start_at: beginTime.toISOString(),
                        },
                    },
                    sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' },
                },
                limit: 100,
            },
        })

        const payments = (data.payments || []).map((p: any) => ({
            id: p.id,
            amount: (p.amount_money?.amount || 0) / 100,
            currency: p.amount_money?.currency || 'USD',
            tip: (p.tip_money?.amount || 0) / 100,
            fee: (p.processing_fee || []).reduce((a: number, f: any) => a + (f.amount_money?.amount || 0), 0) / 100,
            status: p.status,
            cardBrand: p.card_details?.card?.card_brand || null,
            lastFour: p.card_details?.card?.last_4 || null,
            receiptUrl: p.receipt_url || null,
            createdAt: p.created_at,
            orderId: p.order_id || null,
            referenceId: p.reference_id || null,
            note: p.note || '',
        }))

        return { success: true, payments, count: payments.length }
    } catch (error: any) {
        throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to fetch payments' })
    }
})

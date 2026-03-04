/**
 * GET /api/square/orders
 * Fetches order history from Square. Supports ?days=30 query param.
 */
export default defineEventHandler(async (event) => {
    try {
        const { accessToken, locationId } = getServerSquareCredentials(event)
        const query = getQuery(event)
        const days = parseInt(query.days as string) || 30

        const beginTime = new Date()
        beginTime.setDate(beginTime.getDate() - days)

        const data = await serverSquareFetch('/orders/search', accessToken, {
            method: 'POST',
            body: {
                location_ids: [locationId],
                query: {
                    filter: {
                        date_time_filter: {
                            created_at: {
                                start_at: beginTime.toISOString(),
                            },
                        },
                    },
                    sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' },
                },
                limit: 100,
            },
        })

        const orders = (data.orders || []).map((o: any) => ({
            id: o.id,
            total: (o.total_money?.amount || 0) / 100,
            subtotal: (o.total_money?.amount || 0) / 100 - (o.total_tax_money?.amount || 0) / 100,
            tax: (o.total_tax_money?.amount || 0) / 100,
            discount: (o.total_discount_money?.amount || 0) / 100,
            tip: (o.total_tip_money?.amount || 0) / 100,
            state: o.state,
            lineItems: (o.line_items || []).map((li: any) => ({
                name: li.name,
                quantity: parseInt(li.quantity) || 1,
                amount: (li.total_money?.amount || 0) / 100,
            })),
            createdAt: o.created_at,
            closedAt: o.closed_at || null,
        }))

        return { success: true, orders, count: orders.length }
    } catch (error: any) {
        throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to fetch orders' })
    }
})

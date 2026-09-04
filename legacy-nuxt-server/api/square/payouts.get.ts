/**
 * GET /api/square/payouts
 * Fetches payout (bank deposit) history from Square. Supports ?days=90 query param.
 */
export default defineEventHandler(async (event) => {
    try {
        const { accessToken, locationId } = getServerSquareCredentials(event)
        const query = getQuery(event)
        const days = parseInt(query.days as string) || 90

        const beginTime = new Date()
        beginTime.setDate(beginTime.getDate() - days)

        const data = await serverSquareFetch(
            `/payouts?location_id=${locationId}&begin_time=${beginTime.toISOString()}&sort_order=DESC&limit=50`,
            accessToken
        )

        const payouts = (data.payouts || []).map((p: any) => ({
            id: p.id,
            amount: (p.amount_money?.amount || 0) / 100,
            currency: p.amount_money?.currency || 'USD',
            status: p.status,
            arrivalDate: p.arrival_date || null,
            createdAt: p.created_at,
            type: p.type || 'BATCH',
        }))

        return { success: true, payouts, count: payouts.length }
    } catch (error: any) {
        throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to fetch payouts' })
    }
})

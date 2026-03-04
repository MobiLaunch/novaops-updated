/**
 * GET /api/square/customers
 * Fetches customer list from Square.
 */
export default defineEventHandler(async (event) => {
    try {
        const { accessToken } = getServerSquareCredentials(event)

        const data = await serverSquareFetch('/customers/search', accessToken, {
            method: 'POST',
            body: {
                limit: 100,
                query: {
                    sort: { field: 'CREATED_AT', order: 'DESC' },
                },
            },
        })

        const customers = (data.customers || []).map((c: any) => ({
            id: c.id,
            name: [c.given_name, c.family_name].filter(Boolean).join(' ') || 'No Name',
            email: c.email_address || '',
            phone: c.phone_number || '',
            createdAt: c.created_at,
            note: c.note || '',
        }))

        return { success: true, customers, count: customers.length }
    } catch (error: any) {
        throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to fetch customers' })
    }
})

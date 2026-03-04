// composables/useSquareData.ts
// Reactive composable for fetching Square financial data.
// Passes Square credentials via headers so server routes can authenticate.

export const useSquareData = () => {
    const appStore = useAppStore()

    // ── Reactive state ─────────────────────────────────────────────────────
    const payments = ref<any[]>([])
    const orders = ref<any[]>([])
    const payouts = ref<any[]>([])
    const sqCustomers = ref<any[]>([])

    const loading = reactive({ payments: false, orders: false, payouts: false, customers: false })
    const error = reactive({ payments: '', orders: '', payouts: '', customers: '' })

    // ── Helpers ────────────────────────────────────────────────────────────
    const headers = computed(() => {
        const s = appStore.settings
        return {
            'x-square-access-token': s.squareAccessToken || '',
            'x-square-location-id': s.squareLocationId || '',
        }
    })

    const isConfigured = computed(() => !!(headers.value['x-square-access-token'] && headers.value['x-square-location-id']))

    // ── Fetch functions ────────────────────────────────────────────────────
    const fetchPayments = async (days = 30) => {
        if (!isConfigured.value) return
        loading.payments = true; error.payments = ''
        try {
            const data = await $fetch<any>(`/api/square/payments?days=${days}`, { headers: headers.value })
            payments.value = data.payments || []
        } catch (e: any) { error.payments = e?.data?.message || e.message || 'Failed' }
        finally { loading.payments = false }
    }

    const fetchOrders = async (days = 30) => {
        if (!isConfigured.value) return
        loading.orders = true; error.orders = ''
        try {
            const data = await $fetch<any>(`/api/square/orders?days=${days}`, { headers: headers.value })
            orders.value = data.orders || []
        } catch (e: any) { error.orders = e?.data?.message || e.message || 'Failed' }
        finally { loading.orders = false }
    }

    const fetchPayouts = async (days = 90) => {
        if (!isConfigured.value) return
        loading.payouts = true; error.payouts = ''
        try {
            const data = await $fetch<any>(`/api/square/payouts?days=${days}`, { headers: headers.value })
            payouts.value = data.payouts || []
        } catch (e: any) { error.payouts = e?.data?.message || e.message || 'Failed' }
        finally { loading.payouts = false }
    }

    const fetchCustomers = async () => {
        if (!isConfigured.value) return
        loading.customers = true; error.customers = ''
        try {
            const data = await $fetch<any>('/api/square/customers', { headers: headers.value })
            sqCustomers.value = data.customers || []
        } catch (e: any) { error.customers = e?.data?.message || e.message || 'Failed' }
        finally { loading.customers = false }
    }

    const fetchAll = async (days = 30) => {
        await Promise.allSettled([
            fetchPayments(days),
            fetchOrders(days),
            fetchPayouts(days > 90 ? days : 90),
            fetchCustomers(),
        ])
    }

    // ── Computed summaries ─────────────────────────────────────────────────
    const totalRevenue = computed(() => payments.value.filter(p => p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0))
    const totalTips = computed(() => payments.value.filter(p => p.status === 'COMPLETED').reduce((a, p) => a + p.tip, 0))
    const totalFees = computed(() => payments.value.filter(p => p.status === 'COMPLETED').reduce((a, p) => a + Math.abs(p.fee), 0))
    const netRevenue = computed(() => totalRevenue.value - totalFees.value)
    const totalPayouts = computed(() => payouts.value.filter(p => p.status === 'PAID').reduce((a, p) => a + p.amount, 0))

    const isLoading = computed(() => loading.payments || loading.orders || loading.payouts || loading.customers)

    return {
        // State
        payments, orders, payouts, sqCustomers,
        loading, error, isLoading, isConfigured,
        // Fetch
        fetchPayments, fetchOrders, fetchPayouts, fetchCustomers, fetchAll,
        // Computed
        totalRevenue, totalTips, totalFees, netRevenue, totalPayouts,
    }
}

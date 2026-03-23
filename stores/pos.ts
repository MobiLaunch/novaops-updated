import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const usePosStore = defineStore('pos', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  
  const quickSales = ref<any[]>([])

  const createPosSale = async (saleData: {
    customerId?: number | null
    items: Array<{ name: string; price: number; quantity: number; sku?: string }>
    subtotal: number
    tax: number
    total: number
    paymentMethod: string
    note?: string
  }) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')

    const { data, error } = await ($supabase as any).from('pos_sales').insert({
      profile_id:     auth.user.id,
      customer_id:    saleData.customerId || null,
      items:          saleData.items,
      subtotal:       saleData.subtotal,
      tax:            saleData.tax,
      total:          saleData.total,
      payment_method: saleData.paymentMethod,
      note:           saleData.note || '',
      status:         'completed',
    }).select().single()

    if (error) throw error
    return data
  }

  return { quickSales, createPosSale }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const normalizeVendorRepair = (r: VendorRepair) => ({
  ...r,
  customerId: r.customer_id ?? r.customerId,
  ticketRef: r.ticket_ref ?? r.ticketRef ?? '',
  trackingNumber: r.tracking_number ?? r.trackingNumber ?? '',
  sentDate: r.sent_date ?? r.sentDate ?? null,
  estReturn: r.est_return ?? r.estReturn ?? null,
})

export const useVendorRepairsStore = defineStore('vendorRepairs', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const vendorRepairs = ref<VendorRepair[]>([])

  const createVendorRepair = async (repair: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('vendor_repairs').insert({
      profile_id: auth.user.id,
      customer_id: repair.customerId,
      device: repair.device || '',
      issue: repair.issue || '',
      vendor: repair.vendor || '',
      ticket_ref: repair.ticketRef || '',
      tracking_number: repair.trackingNumber || '',
      status: repair.status || 'Preparing to Ship',
      sent_date: repair.sentDate || null,
      est_return: repair.estReturn || null,
      notes: repair.notes || '',
    }).select().single()
    if (error) throw error
    vendorRepairs.value.unshift(normalizeVendorRepair(data))
    return data
  }

  const updateVendorRepair = async (id: any, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const payload: any = { ...updates }
    if (updates.customerId !== undefined) { payload.customer_id = updates.customerId; delete payload.customerId }
    if (updates.ticketRef !== undefined) { payload.ticket_ref = updates.ticketRef; delete payload.ticketRef }
    if (updates.trackingNumber !== undefined) { payload.tracking_number = updates.trackingNumber; delete payload.trackingNumber }
    if (updates.sentDate !== undefined) { payload.sent_date = updates.sentDate; delete payload.sentDate }
    if (updates.estReturn !== undefined) { payload.est_return = updates.estReturn; delete payload.estReturn }
    const { data, error } = await ($supabase as any).from('vendor_repairs').update(payload).eq('id', id).select().single()
    if (error) throw error
    const index = vendorRepairs.value.findIndex(r => r.id === id)
    if (index !== -1) vendorRepairs.value[index] = normalizeVendorRepair(data)
    return data
  }

  const deleteVendorRepair = async (id: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('vendor_repairs').delete().eq('id', id)
    if (error) throw error
    vendorRepairs.value = vendorRepairs.value.filter(r => r.id !== id)
  }

  return { vendorRepairs, createVendorRepair, updateVendorRepair, deleteVendorRepair }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const normalizeCustomer = (c: Customer) => ({
  ...c,
  driversLicense: c.drivers_license ?? c.driversLicense ?? '',
  tags: c.tags ?? [],
  notes: c.notes ?? '',
})

export const useCustomersStore = defineStore('customers', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const customers = ref<Customer[]>([])

  const createCustomer = async (c: Customer) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('customers').insert({
      profile_id: auth.user.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      drivers_license: c.driversLicense || '',
      address: c.address || '',
      tags: c.tags || [],
      notes: c.notes || '',
    }).select().single()
    if (error) throw error
    customers.value.unshift(normalizeCustomer(data))
    return data
  }

  const updateCustomer = async (id: number, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const payload: any = { ...updates }
    if (updates.driversLicense !== undefined) { payload.drivers_license = updates.driversLicense; delete payload.driversLicense }
    const { data, error } = await ($supabase as any).from('customers').update(payload).eq('id', id).select().single()
    if (error) throw error
    const index = customers.value.findIndex(c => c.id === id)
    if (index !== -1) customers.value[index] = normalizeCustomer(data)
    return data
  }

  const deleteCustomer = async (id: number) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('customers').delete().eq('id', id)
    if (error) throw error
    customers.value = customers.value.filter(c => c.id !== id)
  }

  return { customers, createCustomer, updateCustomer, deleteCustomer }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ServiceItem } from '~/types'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const useServicesStore = defineStore('services', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const services = ref<ServiceItem[]>([])

  const createService = async (item: ServiceItem) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('services').insert({
      profile_id: auth.user.id,
      name: item.name,
      category: item.category || 'Services',
      description: item.description || '',
      price: item.price || 0,
      estimated_minutes: item.estimated_minutes || 0,
      duration: item.estimated_minutes || 0,
      active: item.active ?? true,
    }).select().single()
    if (error) throw error
    services.value.push(data)
    return data
  }

  const updateService = async (id: any, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { data, error } = await ($supabase as any).from('services').update(updates).eq('id', id).select().single()
    if (error) throw error
    const index = services.value.findIndex((s: any) => s.id === id)
    if (index !== -1) services.value[index] = data
    return data
  }

  const deleteService = async (id: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('services').delete().eq('id', id)
    if (error) throw error
    services.value = services.value.filter((s: any) => s.id !== id)
  }

  return { services, createService, updateService, deleteService }
})

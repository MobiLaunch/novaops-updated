import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Appointment, HouseCall } from '~/types'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const normalizeAppointment = (a: Appointment, HouseCall) => ({
  ...a,
  customerId: a.customer_id ?? a.customerId,
})

export const normalizeHouseCall = (h: Appointment, HouseCall) => ({
  ...h,
  customerId: h.customer_id ?? h.customerId,
})

export const useCalendarStore = defineStore('calendar', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  
  const houseCalls = ref<HouseCall[]>([])
  const appointments = ref<Appointment[]>([])

  const createHouseCall = async (call: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('house_calls').insert({
      profile_id: auth.user.id,
      customer_id: call.customerId,
      description: call.description || '',
      address: call.address || '',
      date: call.date || null,
      time: call.time || '',
      status: call.status || 'scheduled',
      notes: call.notes || '',
    }).select().single()
    if (error) throw error
    houseCalls.value.push(normalizeHouseCall(data))
    return data
  }

  const updateHouseCall = async (id: any, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const payload: any = { ...updates }
    if (updates.customerId !== undefined) { payload.customer_id = updates.customerId; delete payload.customerId }
    const { data, error } = await ($supabase as any).from('house_calls').update(payload).eq('id', id).select().single()
    if (error) throw error
    const index = houseCalls.value.findIndex(h => h.id === id)
    if (index !== -1) houseCalls.value[index] = normalizeHouseCall(data)
    return data
  }

  const deleteHouseCall = async (id: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('house_calls').delete().eq('id', id)
    if (error) throw error
    houseCalls.value = houseCalls.value.filter(h => h.id !== id)
  }

  const createAppointment = async (appt: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('appointments').insert({
      profile_id: auth.user.id,
      customer_id: appt.customerId,
      title: appt.title || '',
      description: appt.description || '',
      date: appt.date || null,
      time: appt.time || '',
      status: appt.status || 'scheduled',
      notes: appt.notes || '',
    }).select().single()
    if (error) throw error
    appointments.value.push(normalizeAppointment(data))
    return data
  }

  const updateAppointment = async (id: any, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const payload: any = { ...updates }
    if (updates.customerId !== undefined) { payload.customer_id = updates.customerId; delete payload.customerId }
    const { data, error } = await ($supabase as any).from('appointments').update(payload).eq('id', id).select().single()
    if (error) throw error
    const index = appointments.value.findIndex(a => a.id === id)
    if (index !== -1) appointments.value[index] = normalizeAppointment(data)
    return data
  }

  const deleteAppointment = async (id: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('appointments').delete().eq('id', id)
    if (error) throw error
    appointments.value = appointments.value.filter(a => a.id !== id)
  }

  return { 
    houseCalls, appointments, 
    createHouseCall, updateHouseCall, deleteHouseCall,
    createAppointment, updateAppointment, deleteAppointment
  }
})

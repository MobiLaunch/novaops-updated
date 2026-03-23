import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'
import { useSettingsStore } from './settings'
import { printBarcodeLabel } from '~/utils/print'

export const normalizeTicket = (t: Ticket) => ({
  ...t,
  customerId: t.customer_id ?? t.customerId,
  createdAt: t.created_at ?? t.createdAt,
  updatedAt: t.updated_at ?? t.updatedAt,
  serialNumber: t.serial_number ?? t.serialNumber ?? '',
  warrantyDays: t.warranty_days ?? t.warrantyDays ?? 0,
  warrantyStart: t.warranty_start ?? t.warrantyStart ?? null,
  deviceModel: t.device_model ?? t.deviceModel ?? '',
  timeLog: t.time_log ?? t.timeLog ?? [],
  photos: t.photos ?? [],
  notes: t.notes ?? [],
  parts: t.parts ?? [],
  payments: t.payments ?? [],
  priority: t.priority ?? 'normal',
  status: t.status ?? 'Open',
  price: t.price ?? 0,
  tracking: t.tracking ?? null,
  signature: t.signature ?? null,
})

export const useTicketsStore = defineStore('tickets', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const settingsStore = useSettingsStore()
  const tickets = ref<Ticket[]>([])

  const createTicket = async (ticketData: Partial<Ticket>) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('tickets').insert({
      profile_id: auth.user.id,
      customer_id: ticketData.customerId,
      device: ticketData.device,
      device_model: ticketData.deviceModel || '',
      device_description: ticketData.deviceDescription || '',
      issue: ticketData.issue,
      status: ticketData.status || 'Open',
      price: ticketData.price || 0,
      serial_number: ticketData.serialNumber || '',
      warranty_days: ticketData.warrantyDays || 0,
      warranty_start: ticketData.warrantyStart || null,
      photos: ticketData.photos || [],
      signature: ticketData.signature || null,
      notes: ticketData.notes || [],
      parts: ticketData.parts || [],
      payments: ticketData.payments || [],
      time_log: ticketData.timeLog || [],
      priority: ticketData.priority || 'normal',
      tracking: ticketData.tracking || null,
    }).select().single()
    
    if (error) throw error
    const normalizedTicket = normalizeTicket(data)
    tickets.value.unshift(normalizedTicket)

    try {
      const printerConfig = JSON.parse(localStorage.getItem('novaops_printer_settings') || '{}')
      if (printerConfig.autoPrintBarcode) {
        const sku = `TKT-${data.id}`
        printBarcodeLabel({
          sku,
          name: `${ticketData.device} ${ticketData.deviceModel || ''}`.trim(),
          customerName: 'Customer', // Simplified for decoupling
          price: ticketData.price || 0,
          currency: settingsStore.settings?.currency || '$'
        }).catch((e: any) => console.warn('Failed to auto-print label:', e))
      }
    } catch (e: any) { }

    return data
  }

  const updateTicket = async (id: number, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { data, error } = await ($supabase as any).from('tickets').update(updates).eq('id', id).select().single()
    if (error) throw error
    const index = tickets.value.findIndex(t => t.id === id)
    if (index !== -1) tickets.value[index] = normalizeTicket(data)
    return data
  }

  const updateTicketStatus = async (id: number, status: string) => updateTicket(id, { status })

  const deleteTicket = async (id: number) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('tickets').delete().eq('id', id)
    if (error) throw error
    tickets.value = tickets.value.filter(t => t.id !== id)
  }

  return { tickets, createTicket, updateTicket, updateTicketStatus, deleteTicket }
})

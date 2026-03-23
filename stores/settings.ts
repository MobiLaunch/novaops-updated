import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const useSettingsStore = defineStore('settings', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  
  const settings = ref({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    currency: '$',
    taxRate: 0,
    statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered',
    pin: '1234',
    // Square tokens remain for UI binding but are not used for API calls directly on client anymore
    squareAccessToken: '',
    squareLocationId: '',
    squareSandbox: false,
  })
  
  const settingsRowId = ref<number | null>(null)
  const notificationPrefs = ref({
    newTicket: true,
    newSale: true,
    newCustomer: false,
    appointment: true,
    newMessage: true,
  })

  const saveSettings = async (newSettings: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')

    Object.assign(settings.value, newSettings)
    if (typeof localStorage !== 'undefined' && settings.value.pin) {
      localStorage.setItem('novaops_pin', settings.value.pin)
    }

    const bizPayload: Record<string, any> = {
      business_name: settings.value.businessName,
      email: settings.value.email,
      phone: settings.value.phone,
      address: settings.value.address,
      currency: settings.value.currency,
      tax_rate: settings.value.taxRate,
      statuses: settings.value.statuses,
    }

    Object.keys(bizPayload).forEach(k => {
      if (bizPayload[k] === undefined) delete bizPayload[k]
    })

    const rowId = settingsRowId.value
    let bizError: any
    if (rowId) {
      const res = await ($supabase as any).from('settings').update(bizPayload).eq('id', rowId)
      bizError = res.error
    } else {
      const res = await ($supabase as any).from('settings').insert({ ...bizPayload, profile_id: auth.user.id }).select().single()
      bizError = res.error
      if (!bizError && res.data) settingsRowId.value = res.data.id
    }

    if (bizError) throw new Error(bizError.message || 'Failed to save business settings')
  }

  const saveAll = async () => await saveSettings({ ...settings.value })

  const saveSquareConfig = async () => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const payload = {
      profile_id: auth.user.id,
      access_token: settings.value.squareAccessToken,
      location_id: settings.value.squareLocationId,
      sandbox: settings.value.squareSandbox,
    }
    const { error } = await ($supabase as any).from('square_config').upsert(payload, { onConflict: 'profile_id' })
    if (error) throw error
    if (typeof localStorage !== 'undefined' && payload.access_token && payload.location_id) {
      try {
        localStorage.setItem('novaops_square_config', JSON.stringify({ access_token: payload.access_token, location_id: payload.location_id, sandbox: payload.sandbox }))
      } catch { }
    }
  }

  return { settings, settingsRowId, notificationPrefs, saveSettings, saveAll, saveSquareConfig }
})

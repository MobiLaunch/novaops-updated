import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'

// Import domain stores
import { useAuthStore } from './auth'
import { useTicketsStore, normalizeTicket } from './tickets'
import { useCustomersStore, normalizeCustomer } from './customers'
import { useInventoryStore, normalizeInventory } from './inventory'
import { useCalendarStore, normalizeAppointment, normalizeHouseCall } from './calendar'
import { useVendorRepairsStore, normalizeVendorRepair } from './vendorRepairs'
import { useServicesStore } from './services'
import { useExpensesStore } from './expenses'
import { useSettingsStore } from './settings'
import { usePosStore } from './pos'

export const useAppStore = defineStore('app', () => {
  const { $supabase } = useNuxtApp()

  const authStore = useAuthStore()
  const ticketsStore = useTicketsStore()
  const customersStore = useCustomersStore()
  const inventoryStore = useInventoryStore()
  const calendarStore = useCalendarStore()
  const vendorRepairsStore = useVendorRepairsStore()
  const servicesStore = useServicesStore()
  const expensesStore = useExpensesStore()
  const settingsStore = useSettingsStore()
  const posStore = usePosStore()

  const { user, isLoaded, isLoading, supabaseReady } = storeToRefs(authStore)
  const { tickets } = storeToRefs(ticketsStore)
  const { customers } = storeToRefs(customersStore)
  const { inventory } = storeToRefs(inventoryStore)
  const { houseCalls, appointments } = storeToRefs(calendarStore)
  const { vendorRepairs } = storeToRefs(vendorRepairsStore)
  const { services } = storeToRefs(servicesStore)
  const { expenses } = storeToRefs(expensesStore)
  const { settings, settingsRowId, notificationPrefs } = storeToRefs(settingsStore)
  const { quickSales } = storeToRefs(posStore)

  const trackedDevices = ref<string[]>([])
  const trackDevice = (device: string) => {
    if (device && !trackedDevices.value.includes(device)) {
      trackedDevices.value.push(device)
    }
  }

  const setupAuthListener = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('novaops_notif_prefs')
        if (stored) Object.assign(notificationPrefs.value, JSON.parse(stored))
      } catch { }
    }

    if (!$supabase) return
    ($supabase as any).auth.onAuthStateChange((event: string, session: any) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        user.value = session.user
        if (!isLoaded.value) initializeData()
      }
      if (event === 'SIGNED_OUT') {
        user.value = null
        tickets.value = []
        customers.value = []
        inventory.value = []
        houseCalls.value = []
        vendorRepairs.value = []
        appointments.value = []
        isLoaded.value = false
        navigateTo('/login')
      }
    })
  }

  const initializeData = async () => {
    if (!$supabase) return
    if (!user.value) {
      const authUser = await authStore.checkAuth()
      if (!authUser) return
    }

    const uid = user.value!.id
    if (isLoaded.value) return
    isLoading.value = true

    try {
      const [t, c, i, h, vr, a, p, svc, bsRow, expRows, sqRow] = await Promise.all([
        ($supabase as any).from('tickets').select('*').eq('profile_id', uid).order('created_at', { ascending: false }),
        ($supabase as any).from('customers').select('*').eq('profile_id', uid).order('created_at', { ascending: false }),
        ($supabase as any).from('inventory').select('*').eq('profile_id', uid).order('name', { ascending: true }),
        ($supabase as any).from('house_calls').select('*').eq('profile_id', uid).order('date', { ascending: true }),
        ($supabase as any).from('vendor_repairs').select('*').eq('profile_id', uid).order('created_at', { ascending: false }),
        ($supabase as any).from('appointments').select('*').eq('profile_id', uid).order('date', { ascending: true }),
        ($supabase as any).from('profiles').select('*').eq('id', uid).single(),
        ($supabase as any).from('services').select('*').eq('profile_id', uid).order('name', { ascending: true }),
        ($supabase as any).from('settings').select('*').eq('profile_id', uid).maybeSingle(),
        ($supabase as any).from('expenses').select('*').eq('profile_id', uid).order('date', { ascending: false }),
        ($supabase as any).from('square_config').select('*').eq('profile_id', uid).maybeSingle(),
      ])

      tickets.value = (t.data || []).map(normalizeTicket)
      customers.value = (c.data || []).map(normalizeCustomer)
      inventory.value = (i.data || []).map(normalizeInventory)
      houseCalls.value = (h.data || []).map(normalizeHouseCall)
      vendorRepairs.value = (vr.data || []).map(normalizeVendorRepair)
      appointments.value = (a.data || []).map(normalizeAppointment)
      services.value = (svc.data || [])

      const bs = bsRow?.data
      if (bs) {
        settings.value = {
          ...settings.value,
          businessName: bs.business_name || '',
          email: bs.email || '',
          phone: String(bs.phone || ''),
          address: bs.address || '',
          currency: bs.currency || '$',
          taxRate: bs.tax_rate || 0,
          statuses: bs.statuses || 'Open, In Progress, Completed',
        }
        settingsRowId.value = bs.id
      }

      expenses.value = expRows?.data || []

      const sqData = sqRow?.data
      if (sqData?.access_token && sqData?.location_id) {
        settings.value = {
          ...settings.value,
          squareAccessToken: sqData.access_token || '',
          squareLocationId: sqData.location_id || '',
          squareSandbox: sqData.sandbox ?? false,
        }
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('novaops_square_config', JSON.stringify({ access_token: sqData.access_token, location_id: sqData.location_id, sandbox: sqData.sandbox }))
          } catch { }
        }
      } else if (typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem('novaops_square_config')
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed?.access_token && parsed?.location_id) {
              settings.value = {
                ...settings.value,
                squareAccessToken: parsed.access_token || '',
                squareLocationId: parsed.location_id || '',
                squareSandbox: parsed.sandbox ?? false,
              }
            }
          }
        } catch { }
      }

      if (p.data) settings.value = { ...settings.value, pin: p.data.pin || '1234' }

      isLoaded.value = true
      enableRealtime()
    } catch (error) {
      console.error('[NovaOps] Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const enableRealtime = () => {
    if (!$supabase) return
    ($supabase as any).channel('business-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: any) => handleRealtimeEvent(payload))
      .subscribe()
  }

  const handleRealtimeEvent = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord, table } = payload
    if (newRecord?.profile_id !== user.value?.id && oldRecord?.profile_id !== user.value?.id) {
      if (eventType !== 'DELETE') return
    }

    const tableMap: Record<string, { array: any; normalize: (r: any) => any }> = {
      tickets: { array: tickets, normalize: normalizeTicket },
      customers: { array: customers, normalize: normalizeCustomer },
      inventory: { array: inventory, normalize: normalizeInventory },
      house_calls: { array: houseCalls, normalize: normalizeHouseCall },
      vendor_repairs: { array: vendorRepairs, normalize: normalizeVendorRepair },
      appointments: { array: appointments, normalize: normalizeAppointment },
    }

    const target = tableMap[table]
    if (!target) return

    switch (eventType) {
      case 'INSERT': target.array.value.unshift(target.normalize(newRecord)); break
      case 'UPDATE': {
        const index = target.array.value.findIndex((item: any) => item.id === newRecord.id)
        if (index !== -1) target.array.value[index] = target.normalize(newRecord)
        break
      }
      case 'DELETE':target.array.value = target.array.value.filter((item: any) => item.id !== oldRecord.id); break
    }
  }

  return {
    tickets, customers, inventory, houseCalls, vendorRepairs, appointments, quickSales,
    settings, notificationPrefs, expenses, user, isLoaded, isLoading, supabaseReady, services,
    
    setupAuthListener, initializeData,
    checkAuth: authStore.checkAuth,
    logout: authStore.logout,
    trackDevice,

    createTicket: ticketsStore.createTicket, updateTicket: ticketsStore.updateTicket,
    updateTicketStatus: ticketsStore.updateTicketStatus, deleteTicket: ticketsStore.deleteTicket,
    
    createInventoryItem: inventoryStore.createInventoryItem, updateInventoryItem: inventoryStore.updateInventoryItem, deleteInventoryItem: inventoryStore.deleteInventoryItem,
    createHouseCall: calendarStore.createHouseCall, updateHouseCall: calendarStore.updateHouseCall, deleteHouseCall: calendarStore.deleteHouseCall,
    createAppointment: calendarStore.createAppointment, updateAppointment: calendarStore.updateAppointment, deleteAppointment: calendarStore.deleteAppointment,
    createCustomer: customersStore.createCustomer, updateCustomer: customersStore.updateCustomer, deleteCustomer: customersStore.deleteCustomer,
    createVendorRepair: vendorRepairsStore.createVendorRepair, updateVendorRepair: vendorRepairsStore.updateVendorRepair, deleteVendorRepair: vendorRepairsStore.deleteVendorRepair,
    
    createService: servicesStore.createService, updateService: servicesStore.updateService, deleteService: servicesStore.deleteService,
    createExpense: expensesStore.createExpense, deleteExpense: expensesStore.deleteExpense,
    
    saveSettings: settingsStore.saveSettings, saveAll: settingsStore.saveAll, saveSquareConfig: settingsStore.saveSquareConfig,
    createPosSale: posStore.createPosSale,
  }
})

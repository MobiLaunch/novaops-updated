// stores/app.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'

export const useAppStore = defineStore('app', () => {
  const { $supabase } = useNuxtApp()

  // --- State ---
  const tickets = ref<any[]>([])
  const customers = ref<any[]>([])
  const inventory = ref<any[]>([])
  const houseCalls = ref<any[]>([])
  const appointments = ref<any[]>([])
  const quickSales = ref<any[]>([])
  const settings = ref({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    currency: '$',
    taxRate: 0,
    statuses: 'Open, In Progress, Completed',
    pin: '1234'
  })

  const user = ref<any>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const supabaseReady = ref(!!$supabase)

  // --- Auth ---
  const checkAuth = async () => {
    if (!$supabase) return null
    const { data: { user: authUser } } = await ($supabase as any).auth.getUser()
    user.value = authUser
    return authUser
  }


  // Normalize Supabase snake_case to camelCase expected by the UI
  const normalizeTicket = (t: any) => ({
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

  const normalizeCustomer = (c: any) => ({
    ...c,
    driversLicense: c.drivers_license ?? c.driversLicense ?? '',
    tags: c.tags ?? [],
    notes: c.notes ?? '',
  })

  const normalizeInventory = (i: any) => ({
    ...i,
    sku: i.sku ?? '',
    low: i.low ?? i.min_stock ?? 5,
    cost: i.cost ?? 0,
    price: i.price ?? 0,
    stock: i.stock ?? 0,
    category: i.category ?? 'Parts',
  })

  // --- Data Loading ---
  const initializeData = async () => {
    if (!$supabase) {
      console.warn('[NovaOps] Supabase not configured. Running in offline mode.')
      return
    }

    const authUser = await checkAuth()
    if (!authUser) {
      console.log('[NovaOps] No authenticated user')
      return
    }

    if (isLoaded.value) return

    isLoading.value = true

    try {
      const [t, c, i, h, a, p] = await Promise.all([
        ($supabase as any).from('tickets').select('*').eq('profile_id', authUser.id).order('created_at', { ascending: false }),
        ($supabase as any).from('customers').select('*').eq('profile_id', authUser.id).order('created_at', { ascending: false }),
        ($supabase as any).from('inventory').select('*').eq('profile_id', authUser.id).order('name', { ascending: true }),
        ($supabase as any).from('house_calls').select('*').eq('profile_id', authUser.id).order('date', { ascending: true }),
        ($supabase as any).from('appointments').select('*').eq('profile_id', authUser.id).order('date', { ascending: true }),
        ($supabase as any).from('profiles').select('*').eq('id', authUser.id).single()
      ])

      tickets.value = (t.data || []).map(normalizeTicket)
      customers.value = (c.data || []).map(normalizeCustomer)
      inventory.value = (i.data || []).map(normalizeInventory)
      houseCalls.value = h.data || []
      appointments.value = a.data || []

      if (p.data) {
        settings.value = {
          businessName: p.data.business_name || '',
          email: p.data.email || '',
          phone: p.data.phone || ''
        }
      }

      isLoaded.value = true
      enableRealtime()
    } catch (error) {
      console.error('[NovaOps] Failed to load data:', error)
    } finally {
      isLoading.value = false
    }
  }

  // --- Realtime ---
  const enableRealtime = () => {
    if (!$supabase) return
    ;($supabase as any)
      .channel('business-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: any) => {
        handleRealtimeEvent(payload)
      })
      .subscribe()
  }

  const handleRealtimeEvent = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord, table } = payload

    if (newRecord?.profile_id !== user.value?.id && oldRecord?.profile_id !== user.value?.id) {
      return
    }

    const tableMap: Record<string, Ref<any[]>> = {
      tickets,
      customers,
      inventory,
      house_calls: houseCalls,
      appointments
    }

    const targetArray = tableMap[table]
    if (!targetArray) return

    switch (eventType) {
      case 'INSERT': {
        const norm = table === 'tickets' ? normalizeTicket(newRecord)
          : table === 'customers' ? normalizeCustomer(newRecord)
          : table === 'inventory' ? normalizeInventory(newRecord)
          : newRecord
        targetArray.value.unshift(norm)
        break
      }
      case 'UPDATE': {
        const index = targetArray.value.findIndex((item: any) => item.id === newRecord.id)
        if (index !== -1) targetArray.value[index] = newRecord
        break
      }
      case 'DELETE':
        targetArray.value = targetArray.value.filter((item: any) => item.id !== oldRecord.id)
        break
    }
  }

  // --- CRUD ---
  const createTicket = async (ticketData: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { error } = await ($supabase as any).from('tickets').insert({
      ...ticketData,
      profile_id: user.value.id
    })
    if (error) throw error
  }

  const updateTicketStatus = async (id: number, status: string) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('tickets').update({ status }).eq('id', id)
    if (error) throw error
  }

  // saveAll: persists settings to Supabase (called by pages after local mutations)
  const saveAll = async () => {
    if (!$supabase || !user.value) return
    await ($supabase as any).from('profiles').update({
      business_name: settings.value.businessName,
      email: settings.value.email,
      phone: settings.value.phone,
    }).eq('id', user.value.id)
  }

  // trackDevice: lightweight device tracking stub (was in old store)
  const trackedDevices = ref<string[]>([])
  const trackDevice = (device: string) => {
    if (device && !trackedDevices.value.includes(device)) {
      trackedDevices.value.push(device)
    }
  }

  const logout = async () => {
    if ($supabase) await ($supabase as any).auth.signOut()
    user.value = null
    tickets.value = []
    customers.value = []
    inventory.value = []
    houseCalls.value = []
    appointments.value = []
    isLoaded.value = false
    navigateTo('/login')
  }

  return {
    tickets,
    customers,
    inventory,
    houseCalls,
    appointments,
    quickSales,
    settings,
    user,
    isLoaded,
    isLoading,
    supabaseReady,
    initializeData,
    checkAuth,
    createTicket,
    updateTicketStatus,
    saveAll,
    trackDevice,
    logout
  }
})


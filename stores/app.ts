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
    // getSession() restores from localStorage first, getUser() then validates with server
    const { data: { session } } = await ($supabase as any).auth.getSession()
    if (!session) return null
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

  const normalizeHouseCall = (h: any) => ({
    ...h,
    customerId: h.customer_id ?? h.customerId,
  })

  const normalizeAppointment = (a: any) => ({
    ...a,
    customerId: a.customer_id ?? a.customerId,
  })
  // Called once from the root layout. Subscribes to auth state so data loads
  // as soon as Supabase restores the session — no race condition with onMounted.
  const setupAuthListener = () => {
    if (!$supabase) return
    ;($supabase as any).auth.onAuthStateChange((event: string, session: any) => {
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
        appointments.value = []
        isLoaded.value = false
        navigateTo('/login')
      }
    })
  }

  const initializeData = async () => {
    if (!$supabase) {
      console.warn('[NovaOps] Supabase not configured. Running in offline mode.')
      return
    }

    // Ensure we have a user — either set by setupAuthListener or fetch it now
    if (!user.value) {
      const authUser = await checkAuth()
      if (!authUser) return
    }

    const uid = user.value!.id
    if (isLoaded.value) return

    isLoading.value = true

    try {
      const [t, c, i, h, a, p] = await Promise.all([
        ($supabase as any).from('tickets').select('*').eq('profile_id', uid).order('created_at', { ascending: false }),
        ($supabase as any).from('customers').select('*').eq('profile_id', uid).order('created_at', { ascending: false }),
        ($supabase as any).from('inventory').select('*').eq('profile_id', uid).order('name', { ascending: true }),
        ($supabase as any).from('house_calls').select('*').eq('profile_id', uid).order('date', { ascending: true }),
        ($supabase as any).from('appointments').select('*').eq('profile_id', uid).order('date', { ascending: true }),
        ($supabase as any).from('profiles').select('*').eq('id', uid).single()
      ])

      tickets.value = (t.data || []).map(normalizeTicket)
      customers.value = (c.data || []).map(normalizeCustomer)
      inventory.value = (i.data || []).map(normalizeInventory)
      houseCalls.value = (h.data || []).map(normalizeHouseCall)
      appointments.value = (a.data || []).map(normalizeAppointment)

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
          : table === 'house_calls' ? normalizeHouseCall(newRecord)
          : table === 'appointments' ? normalizeAppointment(newRecord)
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

  // ── Tickets ──────────────────────────────────────────────────────────────
  const createTicket = async (ticketData: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('tickets').insert({
      profile_id: user.value.id,
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
    tickets.value.unshift(normalizeTicket(data))
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

  const updateTicketStatus = async (id: number, status: string) => {
    return updateTicket(id, { status })
  }

  const deleteTicket = async (id: number) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('tickets').delete().eq('id', id)
    if (error) throw error
    tickets.value = tickets.value.filter(t => t.id !== id)
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  const createInventoryItem = async (item: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('inventory').insert({
      profile_id: user.value.id,
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'Parts',
      stock: item.stock || 0,
      low: item.low || 5,
      cost: item.cost || 0,
      price: item.price || 0,
      model: item.model || '',
    }).select().single()
    if (error) throw error
    inventory.value.push(normalizeInventory(data))
    return data
  }

  const updateInventoryItem = async (id: number, updates: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { data, error } = await ($supabase as any).from('inventory').update(updates).eq('id', id).select().single()
    if (error) throw error
    const index = inventory.value.findIndex(i => i.id === id)
    if (index !== -1) inventory.value[index] = normalizeInventory(data)
    return data
  }

  const deleteInventoryItem = async (id: number) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('inventory').delete().eq('id', id)
    if (error) throw error
    inventory.value = inventory.value.filter(i => i.id !== id)
  }

  // ── House Calls ───────────────────────────────────────────────────────────
  const createHouseCall = async (call: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('house_calls').insert({
      profile_id: user.value.id,
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

  // ── Appointments ──────────────────────────────────────────────────────────
  const createAppointment = async (appt: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('appointments').insert({
      profile_id: user.value.id,
      customer_id: appt.customerId,
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

  // ── Customers ─────────────────────────────────────────────────────────────
  const createCustomer = async (c: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('customers').insert({
      profile_id: user.value.id,
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

  // ── Settings ──────────────────────────────────────────────────────────────
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
    setupAuthListener,
    initializeData,
    checkAuth,
    createTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    createHouseCall,
    updateHouseCall,
    deleteHouseCall,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    saveAll,
    trackDevice,
    logout
  }
})



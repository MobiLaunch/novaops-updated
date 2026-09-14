<template>
  <div class="page-shell">
    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-muted-foreground m-0">Mobicare Website</p>
        <h1 class="text-xl font-black m-0">Site Control Center</h1>
        <p class="text-sm text-muted-foreground m-0">Website content, bookings, orders and catalog in the same control plane.</p>
      </div>
      <v-btn color="primary" class="text-none" :loading="saving" @click="saveSettings">
        <i class="mdi mdi-content-save-outline mr-1"></i> Save Site Changes
      </v-btn>
    </header>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
      <div class="kpi-card"><div class="text-2xl font-black">{{ bookings.length }}</div><div class="text-xs text-muted-foreground">Website bookings</div></div>
      <div class="kpi-card"><div class="text-2xl font-black">{{ openBookings }}</div><div class="text-xs text-muted-foreground">Needs attention</div></div>
      <div class="kpi-card"><div class="text-2xl font-black">{{ orders.length }}</div><div class="text-xs text-muted-foreground">Website orders</div></div>
      <div class="kpi-card"><div class="text-2xl font-black">{{ products.length }}</div><div class="text-xs text-muted-foreground">Catalog products</div></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <section class="bg-surface border border-border rounded-xl p-4">
        <h2 class="font-black m-0 mb-3">Hero & business content</h2>
        <div class="grid gap-3">
          <v-text-field v-model="site.business_name" label="Business name" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="site.hero_line1" label="Hero line 1" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="site.hero_line2" label="Hero line 2" variant="outlined" density="compact" hide-details />
          <v-textarea v-model="site.hero_subtitle" label="Hero subtitle" variant="outlined" density="compact" rows="3" hide-details />
          <v-text-field v-model="site.phone" label="Phone" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="site.address" label="Address" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="site.primary_color" label="Primary color" variant="outlined" density="compact" hide-details />
        </div>
      </section>

      <section class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-black m-0">Latest website bookings</h2>
          <v-btn variant="text" size="small" class="text-none" to="/bookings">Open tickets</v-btn>
        </div>
        <div v-if="bookings.length" class="flex flex-col gap-2">
          <div v-for="b in bookings.slice(0, 8)" :key="b.id" class="p-3 rounded-lg border border-border flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><i class="mdi mdi-calendar-check-outline"></i></div>
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate">{{ b.customer_name }}</div>
              <div class="text-xs text-muted-foreground truncate">{{ b.service }} · {{ b.appt_date }} {{ b.appt_time }}</div>
            </div>
            <v-chip size="x-small" :color="b.novaops_ticket_id ? 'success' : 'warning'">{{ b.novaops_ticket_id ? `Ticket #${b.novaops_ticket_id}` : b.status }}</v-chip>
          </div>
        </div>
        <div v-else class="text-sm text-muted-foreground text-center py-10">No website bookings yet.</div>
      </section>

      <section class="bg-surface border border-border rounded-xl p-4 lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-black m-0">Website orders</h2>
          <v-btn variant="text" size="small" class="text-none" to="/pos">Open POS</v-btn>
        </div>
        <v-data-table :headers="orderHeaders" :items="orders" :items-per-page="8" density="compact" class="bg-transparent" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $supabase } = useNuxtApp()
const appStore = useAppStore()
const saving = ref(false)
const site = reactive<any>({
  id: null, business_name: 'Mobicare Device Recovery', hero_line1: '', hero_line2: '', hero_subtitle: '',
  phone: '', address: '', primary_color: '#6366f1', footer_text: '', services: [], features: []
})
const bookings = ref<any[]>([])
const orders = ref<any[]>([])
const products = ref<any[]>([])
const openBookings = computed(() => bookings.value.filter(b => !['completed','cancelled','ticket_created'].includes(String(b.status))).length)
const orderHeaders = [
  { title: 'Order', key: 'id' }, { title: 'Customer', key: 'customer_name' },
  { title: 'Total', key: 'total' }, { title: 'Status', key: 'status' }, { title: 'Created', key: 'created_at' }
]

async function load() {
  if (!$supabase || !appStore.user) return
  const uid = appStore.user.id
  const [siteRow, bookingRows, orderRows, productRows] = await Promise.all([
    ($supabase as any).from('website_settings').select('*').eq('profile_id', uid).maybeSingle(),
    ($supabase as any).from('bookings').select('*').eq('profile_id', uid).order('created_at', { ascending: false }).limit(50),
    ($supabase as any).from('orders').select('*').eq('profile_id', uid).order('created_at', { ascending: false }).limit(50),
    ($supabase as any).from('products').select('*').eq('profile_id', uid).order('created_at', { ascending: false })
  ])
  if (siteRow.data) Object.assign(site, siteRow.data)
  bookings.value = bookingRows.data || []
  orders.value = orderRows.data || []
  products.value = productRows.data || []
}

async function saveSettings() {
  if (!$supabase || !appStore.user) return
  saving.value = true
  try {
    const payload = { ...site, profile_id: appStore.user.id, updated_at: new Date().toISOString() }
    const { data, error } = await ($supabase as any).from('website_settings').upsert(payload, { onConflict: 'id' }).select().single()
    if (error) throw error
    Object.assign(site, data)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

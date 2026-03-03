export interface Profile {
  id: string
  email: string
  business_name: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  profile_id?: string
  name: string
  phone: string
  email: string
  driversLicense?: string
  address?: string
  tags: string[]
  notes: string
  created_at?: string
}

export interface Ticket {
  id: number
  profile_id?: string
  customerId: number
  device: string
  deviceModel?: string
  deviceDescription?: string
  issue: string
  status: string
  tracking: string | null
  price: number
  serialNumber: string
  warrantyDays: number
  warrantyStart: string | null
  photos: string[]
  signature: string | null
  notes: Array<{
    id: string
    text: string
    timestamp: string
    author: string
  }>
  parts: any[]
  payments: any[]
  timeLog: any[]
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: number
  profile_id?: string
  name: string
  sku: string
  category?: string
  stock: number
  low: number
  cost: number
  price: number
  model: string
}

export interface Appointment {
  id: string
  profile_id?: string
  customerId: number
  description: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
}

export interface QuickSale {
  id: string
  profile_id?: string
  description: string
  amount: number
  date: string
  paymentMethod: string
}

export interface Settings {
  businessName: string
  email: string
  phone?: string
  address?: string
  currency: string
  taxRate: number
  statuses: string
  pin: string
}

export interface AppData {
  customers: Customer[]
  inventory: InventoryItem[]
  tickets: Ticket[]
  todos: any[]
  quickSales: QuickSale[]
  appointments: Appointment[]
  protectionPlans: any[]
  settings: Settings
  analytics: Analytics
}

export interface Analytics {
  dailyRevenue: Array<{ date: string; amount: number }>
  popularDevices: Record<string, number>
  customerLifetime: Record<string, number>
  avgRepairTime: number
}

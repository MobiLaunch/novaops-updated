import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const normalizeInventory = (i: InventoryItem) => ({
  ...i,
  sku: i.sku ?? '',
  low: i.low ?? i.min_stock ?? 5,
  cost: i.cost ?? 0,
  price: i.price ?? 0,
  stock: i.stock ?? 0,
  category: i.category ?? 'Parts',
  itemType: i.item_type ?? i.itemType ?? 'product',
  description: i.description ?? '',
})

export const useInventoryStore = defineStore('inventory', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const inventory = ref<InventoryItem[]>([])

  const createInventoryItem = async (item: InventoryItem) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('inventory').insert({
      profile_id: auth.user.id,
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'Parts',
      stock: item.itemType === 'service' ? 9999 : (item.stock || 0),
      low: item.itemType === 'service' ? 0 : (item.low || 5),
      cost: item.cost || 0,
      price: item.price || 0,
      model: item.model || '',
      item_type: item.itemType || 'product',
      description: item.description || '',
    }).select().single()
    if (error) throw error
    const normalized = normalizeInventory(data)
    inventory.value.push(normalized)
    return normalized
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

  return { inventory, createInventoryItem, updateInventoryItem, deleteInventoryItem }
})

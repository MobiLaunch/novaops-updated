import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'

export const useExpensesStore = defineStore('expenses', () => {
  const { $supabase } = useNuxtApp()
  const auth = useAuthStore()
  const expenses = ref<Expense[]>([])

  const createExpense = async (item: Expense) => {
    if (!$supabase) throw new Error('Supabase not configured')
    if (!auth.user) throw new Error('Not authenticated')
    const { data, error } = await ($supabase as any).from('expenses').insert({
      profile_id: auth.user.id,
      description: item.description || '',
      amount: item.amount || 0,
      category: item.category || 'Overhead',
      date: item.date || new Date().toISOString().split('T')[0],
    }).select().single()
    if (error) throw error
    expenses.value.unshift(data)
    return data
  }

  const deleteExpense = async (id: any) => {
    if (!$supabase) throw new Error('Supabase not configured')
    const { error } = await ($supabase as any).from('expenses').delete().eq('id', id)
    if (error) throw error
    expenses.value = expenses.value.filter((e: any) => e.id !== id)
  }

  return { expenses, createExpense, deleteExpense }
})

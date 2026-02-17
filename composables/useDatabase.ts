export const useDatabase = () => {
  const { $supabase } = useNuxtApp()
  const hasSupabase = !!($supabase && ($supabase as any).auth)

  const local = {
    get: (key: string) => {
      try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
    },
    set: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value))
  }

  const getAll = async (table: string) => {
    if (hasSupabase) {
      const { data, error } = await ($supabase as any).from(table).select('*')
      if (error) throw error
      return data
    }
    return local.get(table)
  }

  const insert = async (table: string, record: any) => {
    if (hasSupabase) {
      const { data, error } = await ($supabase as any).from(table).insert(record).select().single()
      if (error) throw error
      return data
    }
    const items = local.get(table)
    record.id = Date.now()
    items.push(record)
    local.set(table, items)
    return record
  }

  const update = async (table: string, id: any, updates: any) => {
    if (hasSupabase) {
      const { data, error } = await ($supabase as any).from(table).update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const items = local.get(table)
    const index = items.findIndex((i: any) => i.id === id)
    if (index !== -1) items[index] = { ...items[index], ...updates }
    local.set(table, items)
    return items[index]
  }

  const remove = async (table: string, id: any) => {
    if (hasSupabase) {
      const { error } = await ($supabase as any).from(table).delete().eq('id', id)
      if (error) throw error
      return true
    }
    const items = local.get(table).filter((i: any) => i.id !== id)
    local.set(table, items)
    return true
  }

  return { getAll, insert, update, remove }
}

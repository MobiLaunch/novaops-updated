export const useInventory = () => {
  const db = useDatabase()

  return {
    getInventory: ()=>db.getAll('inventory'),
    addItem:(i:any)=>db.insert('inventory',i),
    updateItem:(id:any,i:any)=>db.update('inventory',id,i),
    removeItem:(id:any)=>db.remove('inventory',id)
  }
}
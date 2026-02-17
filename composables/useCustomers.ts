export const useCustomers = () => {
  const db = useDatabase()

  return {
    getCustomers: ()=>db.getAll('customers'),
    createCustomer:(c:any)=>db.insert('customers',c),
    updateCustomer:(id:any,c:any)=>db.update('customers',id,c),
    deleteCustomer:(id:any)=>db.remove('customers',id)
  }
}
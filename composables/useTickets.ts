export const useTickets = () => {
  const db = useDatabase()

  const getTickets = () => db.getAll('tickets')
  const createTicket = (ticket:any)=> db.insert('tickets', ticket)
  const updateTicket = (id:any,data:any)=> db.update('tickets',id,data)
  const deleteTicket = (id:any)=> db.remove('tickets',id)

  return { getTickets, createTicket, updateTicket, deleteTicket }
}
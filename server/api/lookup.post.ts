import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ticketId, verification } = body

  if (!ticketId || !verification) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and verification required.' })
  }

  // We use the Service Role key here to safely bypass RLS purely for this backend check
  const supabase = await serverSupabaseServiceRole(event)

  // 1. Fetch the ticket AND the associated customer info to verify
  // *Note: Adjust 'customers' and 'phone' to match your actual customer table schema*
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      id, device, deviceModel, issue, status, price, tracking, warrantyDays, created_at,
      customers!inner ( phone, email ) 
    `)
    .eq('id', ticketId)
    .single()

  if (error || !ticket) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found.' })
  }

  // 2. Verify the user input matches the customer's phone or email
  const customerPhone = ticket.customers?.phone || ''
  const customerEmail = ticket.customers?.email || ''
  
  const isVerified = 
    verification.trim() === customerPhone.trim() || 
    verification.trim().toLowerCase() === customerEmail.toLowerCase()

  if (!isVerified) {
    // We throw a generic 404 instead of 401 so attackers don't know if the Ticket ID actually exists
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found or details incorrect.' })
  }

  // 3. Strip out the customer object before sending to frontend so PII isn't leaked
  const { customers, ...safeTicketData } = ticket

  return safeTicketData
})
/** Ticket / appointment status colors and Vuetify Chip colors */

export const TICKET_STATUS_HEX: Record<string, string> = {
  Open: '#3b82f6',
  'In Progress': '#f59e0b',
  'Waiting for Parts': '#f97316',
  Completed: '#10b981',
  Delivered: '#64748b',
  Closed: '#6366f1',
}

export function ticketStatusHex(status?: string) {
  return TICKET_STATUS_HEX[status || ''] || '#64748b'
}

export function ticketStatusSeverity(status?: string) {
  const map: Record<string, string> = {
    Open: 'info',
    'In Progress': 'warning',
    'Waiting for Parts': 'warning',
    Completed: 'success',
    Delivered: 'secondary',
    Closed: 'secondary',
  }
  return map[status || ''] || 'secondary'
}

export function prioritySeverity(priority?: string) {
  const map: Record<string, string> = {
    low: 'secondary',
    normal: 'info',
    high: 'error',
  }
  return map[priority || 'normal'] || 'info'
}

export function housecallStatusSeverity(status?: string) {
  const map: Record<string, string> = {
    Scheduled: 'info',
    'In Progress': 'warning',
    Completed: 'success',
    Cancelled: 'error',
  }
  return map[status || ''] || 'secondary'
}

export function vendorStatusSeverity(status?: string) {
  const map: Record<string, string> = {
    'Preparing to Ship': 'secondary',
    'Shipped to Vendor': 'info',
    'In Repair': 'warning',
    'Shipped Back': 'info',
    Received: 'success',
    'Returned to Customer': 'success',
    Cancelled: 'error',
  }
  return map[status || ''] || 'secondary'
}

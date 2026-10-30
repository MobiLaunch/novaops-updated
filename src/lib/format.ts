export const formatCurrency = (amount: number, currency: string = '$') => {
  const n = amount || 0
  return `${n < 0 ? '-' : ''}${currency}${Math.abs(n).toFixed(2)}`
}

export const formatDate = (d?: string | Date) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d.includes('T') ? d : d + 'T00:00:00') : d
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const AVATAR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']

export const avatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

export const avatarInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export const ticketStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Open: 'info',
    'In Progress': 'warning',
    'Waiting for Parts': 'error',
    Completed: 'success',
    Delivered: 'secondary',
  }
  return map[status] || 'secondary'
}

export type BadgeTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger'

/** Maps a ticket status to an Arc Badge tone. */
export const statusTone = (status: string): BadgeTone => {
  const map: Record<string, BadgeTone> = {
    Open: 'info',
    'In Progress': 'warning',
    'Waiting for Parts': 'danger',
    Completed: 'success',
    Delivered: 'neutral',
  }
  return map[status] || 'neutral'
}

export const housecallTone = (s?: string): BadgeTone =>
  ({ Scheduled: 'info', 'In Progress': 'warning', Completed: 'success', Cancelled: 'danger' } as Record<string, BadgeTone>)[s || ''] || 'neutral'

export const vendorTone = (s?: string): BadgeTone =>
  ({ 'Preparing to Ship': 'neutral', 'Shipped to Vendor': 'info', 'In Repair': 'warning', 'Shipped Back': 'info', Received: 'success', 'Returned to Customer': 'success', Cancelled: 'danger' } as Record<string, BadgeTone>)[s || ''] || 'neutral'

export const priorityTone = (p?: string): BadgeTone => (p === 'high' ? 'danger' : p === 'low' ? 'neutral' : 'info')

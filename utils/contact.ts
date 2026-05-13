/**
 * Opens the system mail / phone client (works on macOS Safari and other browsers).
 */
export function openMailto(to: string, subject = '', body = '') {
  const q = new URLSearchParams()
  if (subject) q.set('subject', subject)
  if (body) q.set('body', body)
  const qs = q.toString()
  window.location.href = qs ? `mailto:${to}?${qs}` : `mailto:${to}`
}

export function openCustomerContact(c: { email?: string; phone?: string }) {
  const email = c.email?.trim()
  if (email) {
    openMailto(email)
    return true
  }
  const raw = c.phone?.replace(/[^\d+]/g, '') ?? ''
  if (raw) {
    window.location.href = `tel:${raw}`
    return true
  }
  return false
}

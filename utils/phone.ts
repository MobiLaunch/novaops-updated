/**
 * Auto-format a US phone number as (555) 123-4567
 * Accepts partial input and formats progressively.
 */
export function formatPhoneNumber(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/\D/g, '')

  // Limit to 10 digits
  const trimmed = digits.slice(0, 10)

  if (trimmed.length === 0) return ''
  if (trimmed.length <= 3) return `(${trimmed}`
  if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`
  return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`
}

/**
 * Vue directive-style handler for phone input formatting.
 * Use: @input="onPhoneInput" on a v-text-field with v-model
 */
export function formatPhoneOnInput(currentValue: string): string {
  return formatPhoneNumber(currentValue)
}

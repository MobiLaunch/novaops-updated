import { defineEventHandler, getQuery, createError } from 'h3'
import { Client, Environment } from 'square'

export default defineEventHandler(async (event) => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN

  if (!accessToken) {
    throw createError({ statusCode: 500, statusMessage: 'Square not configured' })
  }

  const { checkoutId } = getQuery(event)
  if (!checkoutId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing checkoutId' })
  }

  const client = new Client({
    accessToken,
    environment: Environment.Production,
  })

  try {
    const { result } = await client.terminalApi.getTerminalCheckout(checkoutId as string)
    const checkout = JSON.parse(JSON.stringify(result.checkout, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))
    return { status: checkout.status, checkoutId: checkout.id }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Status check failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

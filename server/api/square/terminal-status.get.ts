import { defineEventHandler, getQuery, createError } from 'h3'
import { getSquareClient, serializeBigInt } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const { checkoutId } = getQuery(event)
  if (!checkoutId) throw createError({ statusCode: 400, statusMessage: 'Missing checkoutId' })

  try {
    const { client } = await getSquareClient()
    const { result } = await client.terminalApi.getTerminalCheckout(checkoutId as string)
    const checkout = serializeBigInt(result.checkout)
    return { status: checkout.status, checkoutId: checkout.id }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Status check failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

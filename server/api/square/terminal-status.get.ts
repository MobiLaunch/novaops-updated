import { defineEventHandler, getQuery, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const { checkoutId } = getQuery(event)
  if (!checkoutId) throw createError({ statusCode: 400, statusMessage: 'Missing checkoutId' })

  try {
    const { accessToken } = getSquareCredentials()
    const data = await squareFetch(`/terminals/checkouts/${checkoutId}`, accessToken)
    return { status: data.checkout?.status, checkoutId: data.checkout?.id }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Status check failed' })
  }
})

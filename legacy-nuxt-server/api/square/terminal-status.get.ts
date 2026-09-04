/**
 * GET /api/square/terminal-status
 * FIX: Removed top-level imports for h3 and squareClient (dynamic import inside handler).
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const checkoutId = query.checkoutId as string
  if (!checkoutId) throw createError({ statusCode: 400, statusMessage: 'Missing checkoutId' })

  try {
    const { accessToken } = getServerSquareCredentials(event)
    const data = await serverSquareFetch(`/terminals/checkouts/${checkoutId}`, accessToken)
    return { status: data.checkout?.status, checkoutId: data.checkout?.id }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Status check failed' })
  }
})

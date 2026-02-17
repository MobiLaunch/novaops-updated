import { defineEventHandler, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async () => {
  try {
    const { accessToken, locationId } = getSquareCredentials()
    const data = await squareFetch(`/locations/${locationId}`, accessToken)
    return { success: true, locationName: data.location?.name, status: 'Connected' }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Connection failed' })
  }
})

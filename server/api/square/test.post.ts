import { defineEventHandler, createError } from 'h3'
import { getSquareClient, serializeBigInt } from '~/server/utils/squareClient'

export default defineEventHandler(async () => {
  try {
    const { client, locationId } = await getSquareClient()
    const response = await client.locationsApi.retrieveLocation(locationId)
    const result = serializeBigInt(response.result)
    return { success: true, locationName: result.location?.name, status: 'Connected' }
  } catch (error: any) {
    const msg = error.errors?.[0]?.detail || error.message || 'Connection failed'
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})

import { defineEventHandler, getQuery, createError } from 'h3'
import { getSquareCredentials, squareFetch } from '~/server/utils/squareClient'

export default defineEventHandler(async (event) => {
  const { deviceCodeId } = getQuery(event)
  if (!deviceCodeId) throw createError({ statusCode: 400, statusMessage: 'Missing deviceCodeId' })

  try {
    const { accessToken } = getSquareCredentials()
    const data = await squareFetch(`/devices/codes/${deviceCodeId}`, accessToken)

    return {
      status: data.device_code?.status,       // UNPAIRED, PAIRED, EXPIRED
      deviceId: data.device_code?.device_id,  // populated once PAIRED
      pairingCode: data.device_code?.code,
    }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Failed to check device status' })
  }
})

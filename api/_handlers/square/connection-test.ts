import { wrap, createError } from "../../_lib/nitro.js";
import { getServerSquareCredentials, serverSquareFetch } from "../../_lib/square.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/square/connection-test
 * FIX: Removed top-level imports for h3 (Nitro auto-imports) and squareClient
 * (moved to dynamic import inside handler to prevent TDZ errors).
 */


export default wrap(async (event: any) => {
  try {
    const { accessToken, locationId } = getServerSquareCredentials(event)
    const data = await serverSquareFetch(`/locations/${locationId}`, accessToken, { event })
    return { success: true, locationName: data.location?.name, status: 'Connected' }
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Connection failed' })
  }
})

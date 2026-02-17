// Shared Square client factory used by all API routes
export async function getSquareClient() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!accessToken || !locationId) {
    throw new Error('SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID must be set in Vercel environment variables.')
  }

  const squarePkg = await import('square')
  // Handle CJS default export wrapping
  const square = (squarePkg as any).default ?? squarePkg
  const SquareClient = square.Client ?? square.SquareClient

  const client = new SquareClient({
    accessToken,
    // Use string directly — avoids the Environment enum resolution issue
    environment: 'production',
  })

  return { client, locationId, accessToken }
}

export function serializeBigInt(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ))
}

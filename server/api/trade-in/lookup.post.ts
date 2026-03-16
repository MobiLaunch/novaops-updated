/**
 * POST /api/trade-in/lookup
 *
 * Server-side price lookup for trade-in evaluations.
 * Runs Claude with web_search on the server to avoid CORS restrictions
 * that block direct browser → api.anthropic.com calls.
 *
 * Lookup cascade (tries each until one succeeds):
 *   1. IMEI    → IMEI.info free lookup → resolves brand/model/storage → price search
 *   2. Model # → exact model number search (e.g. "MQ3D3LL/A") → price search
 *   3. Brand + Model name → general used market price search
 *
 * Body: { brand?, model?, storage?, imei?, model_number? }
 *
 * Returns: {
 *   ok: boolean
 *   resolved_brand?: string    — filled in if IMEI/model# resolved it
 *   resolved_model?: string
 *   resolved_storage?: string
 *   ebay_avg: number
 *   swappa_avg: number
 *   median: number
 *   source_note: string
 *   lookup_method: 'imei' | 'model_number' | 'name' | 'manual'
 * }
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

// Validate IMEI check digit (Luhn algorithm)
function isValidImei(imei: string): boolean {
  const digits = imei.replace(/\D/g, '')
  if (digits.length !== 15) return false
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let d = parseInt(digits[i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

async function callClaude(system: string, userMessage: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  // Extract the final text block (may come after tool_use blocks)
  const textBlock = data.content?.findLast((b: any) => b.type === 'text')
  return textBlock?.text || ''
}

function parseJsonFromText(text: string): any {
  const clean = text.replace(/```json|```/g, '').trim()
  // Find the outermost JSON object
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in response')
  return JSON.parse(clean.slice(start, end + 1))
}

// ── IMEI lookup via IMEI.info (free, no key required) ─────────────
async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    // IMEI.info provides a basic free endpoint
    const res = await fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'NovaOps/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.DeviceName && data?.BrandName) {
      return {
        brand: String(data.BrandName),
        model: String(data.DeviceName),
        storage: data.storage || undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

// ── Price search via Claude + web_search ──────────────────────────
async function searchPrice(query: string): Promise<{ ebay_avg: number; swappa_avg: number; median: number; source_note: string } | null> {
  const system = `You are a device pricing expert. Search eBay SOLD listings and Swappa for current used market prices.
Respond ONLY with a valid JSON object — no markdown fences, no explanation, no preamble:
{
  "ebay_avg": <number or 0>,
  "swappa_avg": <number or 0>,
  "median": <number or 0>,
  "source_note": "<one sentence describing data, include date range if found>"
}
If you genuinely cannot find any pricing data after searching, return {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"No pricing data found"}.`

  try {
    const text = await callClaude(system, query)
    const parsed = parseJsonFromText(text)
    if (typeof parsed.median === 'number') return parsed
    return null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    brand?: string
    model?: string
    storage?: string
    imei?: string
    model_number?: string
  }

  const { brand, model, storage, imei, model_number } = body

  let resolvedBrand = brand?.trim() || ''
  let resolvedModel = model?.trim() || ''
  let resolvedStorage = storage?.trim() || ''
  let lookupMethod: string = 'name'

  // ── 1. IMEI lookup ─────────────────────────────────────────────
  if (imei) {
    const cleaned = imei.replace(/\D/g, '')
    if (isValidImei(cleaned)) {
      const imeiResult = await lookupImei(cleaned)
      if (imeiResult) {
        resolvedBrand   = imeiResult.brand
        resolvedModel   = imeiResult.model
        resolvedStorage = imeiResult.storage || resolvedStorage
        lookupMethod    = 'imei'
      }
    }
  }

  // ── 2. Model number fallback ────────────────────────────────────
  // If IMEI didn't resolve or wasn't provided, try model number
  if (lookupMethod !== 'imei' && model_number?.trim()) {
    const mn = model_number.trim()
    // Use Claude to resolve model number → device name, then we'll price it
    const resolveSystem = `You are a device identification expert.
Given a device model number or part number, identify the exact device.
Respond ONLY with JSON: {"brand":"<brand>","model":"<full model name>","storage":"<storage if known or empty string>"}
If you cannot identify the device, respond: {"brand":"","model":"","storage":""}`
    try {
      const text = await callClaude(resolveSystem, `Device model number: ${mn}`)
      const resolved = parseJsonFromText(text)
      if (resolved.brand && resolved.model) {
        resolvedBrand   = resolved.brand
        resolvedModel   = resolved.model
        resolvedStorage = resolved.storage || resolvedStorage
        lookupMethod    = 'model_number'
      }
    } catch { /* fall through to name search */ }
  }

  // ── 3. Price search ─────────────────────────────────────────────
  if (!resolvedBrand && !resolvedModel) {
    return {
      ok: false,
      error: 'Not enough device information to look up pricing.',
      lookup_method: 'manual',
    }
  }

  const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage, 'used price USD']
    .filter(Boolean)
    .join(' ')

  const pricing = await searchPrice(priceQuery)

  if (!pricing || pricing.median === 0) {
    return {
      ok: false,
      error: `Could not find pricing for "${priceQuery}". Try adding a model number or IMEI, or enter the market price manually.`,
      lookup_method: lookupMethod,
      resolved_brand:   resolvedBrand   || undefined,
      resolved_model:   resolvedModel   || undefined,
      resolved_storage: resolvedStorage || undefined,
    }
  }

  return {
    ok: true,
    resolved_brand:   resolvedBrand   || undefined,
    resolved_model:   resolvedModel   || undefined,
    resolved_storage: resolvedStorage || undefined,
    ebay_avg:     pricing.ebay_avg,
    swappa_avg:   pricing.swappa_avg,
    median:       pricing.median,
    source_note:  pricing.source_note,
    lookup_method: lookupMethod,
  }
})

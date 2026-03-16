/**
 * POST /api/trade-in/lookup
 *
 * Server-side device price lookup using Claude + web_search.
 *
 * VERCEL REQUIREMENTS:
 *   - Set ANTHROPIC_API_KEY in Vercel → Project Settings → Environment Variables
 *   - This function has a 60s timeout configured in vercel.json (required because
 *     Claude's web_search tool typically takes 10-20s to return results)
 *   - Vercel Hobby plan caps functions at 10s — upgrade to Pro for this to work,
 *     OR use the manual price override field instead
 *
 * Lookup cascade:
 *   1. IMEI  → IMEI.info (free, no key) → resolves device → price search
 *   2. Model # → Claude identifies device → price search
 *   3. Brand + model name → price search directly
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// claude-sonnet-4-5 supports web_search and is fast enough for this use case
const CLAUDE_MODEL = 'claude-sonnet-4-5'

function getApiKey(): string {
  return (
    process.env.ANTHROPIC_API_KEY ||
    process.env.NUXT_ANTHROPIC_API_KEY ||
    (useRuntimeConfig().anthropicApiKey as string) ||
    ''
  )
}

function isValidImei(digits: string): boolean {
  if (digits.length !== 15) return false
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let d = parseInt(digits[i], 10)
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

function findLastTextBlock(content: any[]): string {
  for (let i = content.length - 1; i >= 0; i--) {
    if (content[i]?.type === 'text' && content[i]?.text) return content[i].text as string
  }
  return ''
}

function extractJson(text: string): any {
  // Strip markdown fences if present
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Find the outermost JSON object
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON found in: ${clean.slice(0, 100)}`)
  return JSON.parse(clean.slice(start, end + 1))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

// ── Claude API call ───────────────────────────────────────────────

async function callClaude(system: string, userMessage: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. ' +
      'Add it in Vercel → Project → Settings → Environment Variables.'
    )
  }

  console.log('[trade-in/lookup] Calling Claude:', userMessage.slice(0, 80))

  const res = await withTimeout(
    fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    }),
    50000,
    'Anthropic API'
  )

  const rawBody = await res.text()
  console.log('[trade-in/lookup] Response status:', res.status)

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid Anthropic API key — check ANTHROPIC_API_KEY in Vercel.')
    if (res.status === 403) throw new Error('Anthropic API key does not have permission to use web_search.')
    if (res.status === 429) throw new Error('Anthropic rate limit hit — try again in a moment.')
    if (res.status === 400) {
      // Often means wrong model string or invalid tool definition
      const detail = rawBody.slice(0, 300)
      throw new Error(`Anthropic 400 Bad Request: ${detail}`)
    }
    throw new Error(`Anthropic API error ${res.status}: ${rawBody.slice(0, 200)}`)
  }

  const data = JSON.parse(rawBody)
  console.log('[trade-in/lookup] Content blocks:', data.content?.map((b: any) => b.type).join(', '))

  const text = findLastTextBlock(data.content || [])
  if (!text) {
    console.log('[trade-in/lookup] Full response:', JSON.stringify(data).slice(0, 500))
    throw new Error('Claude returned no text block in response')
  }

  console.log('[trade-in/lookup] Text response:', text.slice(0, 200))
  return text
}

// ── IMEI.info lookup ──────────────────────────────────────────────

async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    const res = await withTimeout(
      fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
        headers: { Accept: 'application/json', 'User-Agent': 'NovaOps/1.0' },
      }),
      6000,
      'IMEI.info'
    )
    if (!res.ok) { console.log('[trade-in/lookup] IMEI.info status:', res.status); return null }
    const data = await res.json()
    console.log('[trade-in/lookup] IMEI.info response keys:', Object.keys(data).join(', '))
    if (data?.DeviceName && data?.BrandName) {
      return { brand: String(data.BrandName), model: String(data.DeviceName), storage: data.Storage || undefined }
    }
    return null
  } catch (err: any) {
    console.log('[trade-in/lookup] IMEI.info error:', err.message)
    return null
  }
}

// ── Price search ──────────────────────────────────────────────────

const PRICE_SYSTEM = `You are a device trade-in pricing expert. Use web search to find current used market prices.
Search specifically for eBay SOLD/COMPLETED listings and Swappa listings for the device.
Return ONLY a raw JSON object — absolutely no markdown, no code fences, no text before or after:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence describing what you found>"}
- ebay_avg: average of recent eBay sold/completed listings in USD (0 if not found)
- swappa_avg: average of recent Swappa listings in USD (0 if not found)  
- median: your best estimate of fair market value based on all sources found
- Numbers only, no $ symbol
- If no data found at all: {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"No pricing data found"}`

async function searchPrice(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  const text = await callClaude(
    PRICE_SYSTEM,
    `Search for current used market price: ${query}`
  )
  const parsed = extractJson(text)
  if (typeof parsed.median !== 'number') {
    console.log('[trade-in/lookup] Unexpected JSON shape:', JSON.stringify(parsed))
    return null
  }
  return parsed
}

// ── Main handler ──────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const body = await readBody(event) as {
      brand?: string; model?: string; storage?: string
      imei?: string; model_number?: string
    }

    console.log('[trade-in/lookup] Request body:', JSON.stringify(body))

    let resolvedBrand   = (body.brand   || '').trim()
    let resolvedModel   = (body.model   || '').trim()
    let resolvedStorage = (body.storage || '').trim()
    let lookupMethod    = 'name'

    // ── 1. IMEI ───────────────────────────────────────────────────
    if (body.imei) {
      const digits = body.imei.replace(/\D/g, '')
      console.log('[trade-in/lookup] IMEI digits length:', digits.length, 'valid:', isValidImei(digits))
      if (isValidImei(digits)) {
        const result = await lookupImei(digits)
        if (result) {
          resolvedBrand   = result.brand
          resolvedModel   = result.model
          resolvedStorage = result.storage || resolvedStorage
          lookupMethod    = 'imei'
          console.log('[trade-in/lookup] IMEI resolved to:', resolvedBrand, resolvedModel)
        }
      }
    }

    // ── 2. Model number ───────────────────────────────────────────
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      const mn = body.model_number.trim()
      try {
        const text = await callClaude(
          `Identify the exact consumer device from its model/part number. Return ONLY raw JSON, no markdown:
{"brand":"<manufacturer>","model":"<full marketing name>","storage":"<capacity or empty>"}
If unrecognized: {"brand":"","model":"","storage":""}`,
          `Device model number: ${mn}`
        )
        const resolved = extractJson(text)
        if (resolved.brand && resolved.model) {
          resolvedBrand   = resolved.brand
          resolvedModel   = resolved.model
          resolvedStorage = resolved.storage || resolvedStorage
          lookupMethod    = 'model_number'
          console.log('[trade-in/lookup] Model# resolved to:', resolvedBrand, resolvedModel)
        }
      } catch (err: any) {
        console.log('[trade-in/lookup] Model# resolution error:', err.message)
        if (err.message?.includes('API key') || err.message?.includes('permission')) throw err
        // fall through to name search
      }
    }

    // ── 3. Need at least brand or model ──────────────────────────
    if (!resolvedBrand && !resolvedModel) {
      return { ok: false, error: 'Please enter a brand and model, IMEI, or model number.', lookup_method: 'manual' }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    console.log('[trade-in/lookup] Price query:', priceQuery)

    const pricing = await searchPrice(priceQuery)
    const elapsed = Date.now() - startTime
    console.log(`[trade-in/lookup] Completed in ${elapsed}ms. Median: ${pricing?.median}`)

    if (!pricing || pricing.median === 0) {
      return {
        ok: false,
        error: `No pricing data found for "${priceQuery}". Try adding an IMEI or model number, or enter the price manually.`,
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
      ebay_avg:      pricing.ebay_avg,
      swappa_avg:    pricing.swappa_avg,
      median:        pricing.median,
      source_note:   pricing.source_note,
      lookup_method: lookupMethod,
    }

  } catch (err: any) {
    console.error('[trade-in/lookup] Fatal error:', err.message)
    return {
      ok: false,
      error: err.message || 'Lookup failed — check Vercel function logs for details.',
      lookup_method: 'manual',
    }
  }
})

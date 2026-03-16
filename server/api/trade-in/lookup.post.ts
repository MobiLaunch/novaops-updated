/**
 * POST /api/trade-in/lookup
 *
 * Server-side device price lookup. Runs on Nitro/Vercel — no CORS issues.
 *
 * Env var: ANTHROPIC_API_KEY  (set directly in Vercel — no NUXT_ prefix needed
 *          for process.env access in server routes)
 *
 * Cascade:
 *   1. IMEI    → IMEI.info free API → resolves exact device → price search
 *   2. Model # → Claude identifies device → price search
 *   3. Brand + model name → price search
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL  = 'claude-sonnet-4-20250514'

// ── Helpers ───────────────────────────────────────────────────────

function getApiKey(): string {
  // Accept the key under either name so devs can use either convention
  return (
    process.env.ANTHROPIC_API_KEY ||
    process.env.NUXT_ANTHROPIC_API_KEY ||
    useRuntimeConfig().anthropicApiKey as string ||
    ''
  )
}

// Luhn check digit validation for IMEI
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

// findLast polyfill — Array.prototype.findLast is Node 18+ only and
// not always available in Nitro's runtime. Use a simple reverse loop.
function findLastText(content: any[]): string {
  for (let i = content.length - 1; i >= 0; i--) {
    if (content[i]?.type === 'text' && content[i]?.text) {
      return content[i].text as string
    }
  }
  return ''
}

function parseJson(text: string): any {
  const clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object in response')
  return JSON.parse(clean.slice(start, end + 1))
}

// Manual timeout wrapper — AbortSignal.timeout is Node 18.0+ but not
// universally polyfilled by Nitro on all Vercel runtimes
function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// ── Claude caller ─────────────────────────────────────────────────

async function callClaude(system: string, userMessage: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.')

  const res = await fetchWithTimeout(
    ANTHROPIC_API,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    },
    25000  // 25s — web_search can be slow
  )

  if (!res.ok) {
    const body = await res.text()
    // Surface a clear message for the most common failure modes
    if (res.status === 401) throw new Error('Invalid Anthropic API key. Check ANTHROPIC_API_KEY in Vercel.')
    if (res.status === 429) throw new Error('Anthropic rate limit hit. Try again in a moment.')
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = findLastText(data.content || [])
  if (!text) throw new Error('Claude returned no text content')
  return text
}

// ── IMEI.info lookup ──────────────────────────────────────────────

async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.imei.info/api/?imei=${imei}&format=json`,
      { headers: { Accept: 'application/json', 'User-Agent': 'NovaOps/1.0' } },
      6000
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.DeviceName && data?.BrandName) {
      return { brand: String(data.BrandName), model: String(data.DeviceName), storage: data.Storage || undefined }
    }
    return null
  } catch {
    return null
  }
}

// ── Price search ──────────────────────────────────────────────────

const PRICE_SYSTEM = `You are a device trade-in pricing expert. Search eBay completed/sold listings and Swappa to find real current used market prices.
Be specific — search for the exact device model and storage size provided.
Return ONLY a raw JSON object with no markdown, no code fences, no explanation before or after:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence: what you found and approximate date range>"}
Rules:
- ebay_avg: average of recent eBay SOLD listings (not asking price)
- swappa_avg: average of recent Swappa listings (0 if not found)
- median: your best estimate of fair market value based on what you found
- All values in USD as plain numbers (no $ symbol)
- If truly no data found: {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"No pricing data found for this device"}`

async function searchPrice(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  try {
    const text = await callClaude(PRICE_SYSTEM, `Find current used market price for: ${query}`)
    const parsed = parseJson(text)
    if (typeof parsed.median !== 'number') return null
    return parsed
  } catch (err: any) {
    // Re-throw API key / auth errors so the client sees them clearly
    if (err.message?.includes('API key') || err.message?.includes('rate limit')) throw err
    return null
  }
}

// ── Main handler ──────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as {
      brand?: string; model?: string; storage?: string
      imei?: string; model_number?: string
    }

    let resolvedBrand   = (body.brand   || '').trim()
    let resolvedModel   = (body.model   || '').trim()
    let resolvedStorage = (body.storage || '').trim()
    let lookupMethod    = 'name'

    // ── Step 1: IMEI ──────────────────────────────────────────────
    if (body.imei) {
      const digits = body.imei.replace(/\D/g, '')
      if (isValidImei(digits)) {
        const result = await lookupImei(digits)
        if (result) {
          resolvedBrand   = result.brand
          resolvedModel   = result.model
          resolvedStorage = result.storage || resolvedStorage
          lookupMethod    = 'imei'
        }
      }
    }

    // ── Step 2: Model number ──────────────────────────────────────
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      const mn = body.model_number.trim()
      try {
        const text = await callClaude(
          `You are a device identification expert. Given a device model number or part number (e.g. MQ3D3LL/A, SM-G998B, A2111), identify the exact consumer device.
Respond ONLY with raw JSON, no markdown:
{"brand":"<brand>","model":"<full model name including storage if encoded>","storage":"<storage capacity or empty string>"}
If unrecognized: {"brand":"","model":"","storage":""}`,
          `Device model number: ${mn}`
        )
        const resolved = parseJson(text)
        if (resolved.brand && resolved.model) {
          resolvedBrand   = resolved.brand
          resolvedModel   = resolved.model
          resolvedStorage = resolved.storage || resolvedStorage
          lookupMethod    = 'model_number'
        }
      } catch (err: any) {
        if (err.message?.includes('API key')) throw err
        // fall through to name search
      }
    }

    // ── Step 3: Need something to search ─────────────────────────
    if (!resolvedBrand && !resolvedModel) {
      return {
        ok: false,
        error: 'Please enter a brand and model, IMEI, or model number.',
        lookup_method: 'manual',
      }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage]
      .filter(Boolean).join(' ')

    const pricing = await searchPrice(priceQuery)

    if (!pricing || pricing.median === 0) {
      return {
        ok: false,
        error: `Could not find used market pricing for "${priceQuery}". Try adding an IMEI or model number, or enter the price manually.`,
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
    // Return a structured error rather than a 500 so the client shows
    // a useful message instead of a generic network error
    return {
      ok: false,
      error: err.message || 'Lookup failed. Check server logs.',
      lookup_method: 'manual',
    }
  }
})

/**
 * POST /api/trade-in/lookup
 *
 * Device price lookup using Gemini. Two-tier approach:
 *   1. Try Gemini with Google Search grounding (real-time prices)
 *   2. Fall back to Gemini without grounding (training data prices — still useful)
 *
 * SETUP: Add GEMINI_API_KEY to Vercel environment variables.
 * Get a free key at https://aistudio.google.com/app/apikey
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL       = 'gemini-2.0-flash'

function getApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    (useRuntimeConfig().geminiApiKey as string) ||
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

function extractJson(text: string): any {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON in: ${clean.slice(0, 100)}`)
  return JSON.parse(clean.slice(start, end + 1))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Core Gemini call ──────────────────────────────────────────────

async function callGemini(prompt: string, useSearch: boolean): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
      'Get a free key at https://aistudio.google.com/app/apikey ' +
      'and add it to Vercel → Project → Settings → Environment Variables.'
    )
  }

  const url  = `${GEMINI_BASE}/${MODEL}:generateContent?key=${apiKey}`
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  }
  if (useSearch) body.tools = [{ google_search: {} }]

  const res      = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const rawBody  = await res.text()

  if (!res.ok) {
    let msg = rawBody.slice(0, 300)
    try { msg = JSON.parse(rawBody)?.error?.message || msg } catch {}
    const err: any = new Error(msg)
    err.status = res.status
    throw err
  }

  const data = JSON.parse(rawBody)
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Gemini with retry + search fallback ───────────────────────────
// Strategy:
//   - Try with Google Search grounding first (real-time data)
//   - If 429 (rate limit): wait 2s, retry once without grounding
//   - If still failing: fall back to Gemini's training knowledge
//     which is surprisingly accurate for major device prices

async function callGeminiWithFallback(prompt: string, searchPrompt: string): Promise<{ text: string; usedSearch: boolean }> {
  // Attempt 1: with grounding
  try {
    const text = await callGemini(searchPrompt, true)
    if (text) return { text, usedSearch: true }
  } catch (err: any) {
    console.log('[lookup] Grounded call failed:', err.status, err.message?.slice(0, 80))
    // 429 = rate limit, 400 can mean grounding not available for this key/region
    if (err.status !== 429 && err.status !== 400 && err.status !== 403) throw err
    // Wait briefly then try fallback
    if (err.status === 429) await sleep(2000)
  }

  // Attempt 2: without grounding (uses Gemini's training data)
  console.log('[lookup] Falling back to non-grounded Gemini')
  const text = await callGemini(prompt, false)
  return { text, usedSearch: false }
}

// ── IMEI.info ─────────────────────────────────────────────────────

async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    const res = await fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'NovaOps/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.DeviceName && data?.BrandName) {
      return { brand: String(data.BrandName), model: String(data.DeviceName), storage: data.Storage || undefined }
    }
    return null
  } catch { return null }
}

// ── Price search ──────────────────────────────────────────────────

const PRICE_PROMPT = (query: string) =>
`What is the current used market price for: ${query}

Based on recent eBay sold listings and Swappa marketplace data, provide realistic pricing.
Return ONLY raw JSON — no markdown, no explanation:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence>"}
Numbers in USD, no $ symbol. If unknown: {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"No data available"}`

const PRICE_SEARCH_PROMPT = (query: string) =>
`Search eBay SOLD/COMPLETED listings and Swappa for the current used price of: ${query}

Return ONLY raw JSON — no markdown, no code fences, no text before or after:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence with date range>"}
Numbers in USD only, no $ symbol.`

async function searchPrice(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string; used_search: boolean
} | null> {
  const { text, usedSearch } = await callGeminiWithFallback(
    PRICE_PROMPT(query),
    PRICE_SEARCH_PROMPT(query)
  )
  if (!text) return null
  const parsed = extractJson(text)
  if (typeof parsed.median !== 'number') return null
  return { ...parsed, used_search: usedSearch }
}

// ── Main handler ──────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const t0 = Date.now()
  try {
    const body = await readBody(event) as {
      brand?: string; model?: string; storage?: string
      imei?: string; model_number?: string
    }

    let resolvedBrand   = (body.brand   || '').trim()
    let resolvedModel   = (body.model   || '').trim()
    let resolvedStorage = (body.storage || '').trim()
    let lookupMethod    = 'name'

    // 1. IMEI
    if (body.imei) {
      const digits = body.imei.replace(/\D/g, '')
      if (isValidImei(digits)) {
        const r = await lookupImei(digits)
        if (r) { resolvedBrand = r.brand; resolvedModel = r.model; resolvedStorage = r.storage || resolvedStorage; lookupMethod = 'imei' }
      }
    }

    // 2. Model number
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      try {
        const { text } = await callGeminiWithFallback(
          `Identify the device from model number: ${body.model_number.trim()}. Return ONLY JSON: {"brand":"","model":"","storage":""}`,
          `What device has model number ${body.model_number.trim()}? Return ONLY JSON: {"brand":"<maker>","model":"<name>","storage":"<capacity or empty>"}`
        )
        const r = extractJson(text)
        if (r.brand && r.model) { resolvedBrand = r.brand; resolvedModel = r.model; resolvedStorage = r.storage || resolvedStorage; lookupMethod = 'model_number' }
      } catch (err: any) {
        if (err.message?.includes('API key')) throw err
      }
    }

    if (!resolvedBrand && !resolvedModel) {
      return { ok: false, error: 'Please enter a brand and model, IMEI, or model number.', lookup_method: 'manual' }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    const pricing = await searchPrice(priceQuery)

    console.log(`[lookup] Done in ${Date.now() - t0}ms. search=${pricing?.used_search} median=${pricing?.median}`)

    if (!pricing || pricing.median === 0) {
      return {
        ok: false,
        error: `No pricing data found for "${priceQuery}". Enter the market price manually.`,
        lookup_method: lookupMethod,
        resolved_brand: resolvedBrand || undefined,
        resolved_model: resolvedModel || undefined,
        resolved_storage: resolvedStorage || undefined,
      }
    }

    return {
      ok: true,
      resolved_brand: resolvedBrand || undefined,
      resolved_model: resolvedModel || undefined,
      resolved_storage: resolvedStorage || undefined,
      ebay_avg:      pricing.ebay_avg,
      swappa_avg:    pricing.swappa_avg,
      median:        pricing.median,
      source_note:   pricing.used_search ? pricing.source_note : `${pricing.source_note} (estimated from training data — search grounding unavailable)`,
      lookup_method: lookupMethod,
    }

  } catch (err: any) {
    console.error('[lookup] Fatal:', err.message)
    return { ok: false, error: err.message || 'Lookup failed — check Vercel function logs.', lookup_method: 'manual' }
  }
})

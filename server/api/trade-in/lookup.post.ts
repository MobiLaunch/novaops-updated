/**
 * POST /api/trade-in/lookup
 *
 * Server-side device price lookup using Google Gemini with Search grounding.
 *
 * WHY GEMINI:
 *   - Google Search grounding is built-in — no separate tool setup needed
 *   - Free tier (gemini-2.0-flash) handles this within Vercel's default 10s timeout
 *   - Responds in 3-8s vs Claude's 15-25s with web_search
 *   - No CORS issues (runs server-side)
 *
 * SETUP:
 *   1. Go to https://aistudio.google.com/app/apikey
 *   2. Create a free API key (no billing required for Gemini 2.0 Flash)
 *   3. Add GEMINI_API_KEY to Vercel → Project → Settings → Environment Variables
 *
 * Lookup cascade:
 *   1. IMEI  → IMEI.info free API → resolves brand/model → price search
 *   2. Model # → Gemini identifies device → price search
 *   3. Brand + model name → price search directly
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL    = 'gemini-2.0-flash'

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
  if (start === -1 || end === -1) throw new Error(`No JSON found in: ${clean.slice(0, 120)}`)
  return JSON.parse(clean.slice(start, end + 1))
}

// ── Gemini caller ─────────────────────────────────────────────────
// useSearch=true  → Google Search grounding (real-time web data, for pricing)
// useSearch=false → plain generation (for model number identification)

async function callGemini(prompt: string, useSearch: boolean): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. ' +
      'Get a free key at https://aistudio.google.com/app/apikey ' +
      'then add it to Vercel → Project Settings → Environment Variables.'
    )
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  }

  if (useSearch) {
    body.tools = [{ google_search: {} }]
  }

  console.log(`[trade-in/lookup] Gemini (search=${useSearch}):`, prompt.slice(0, 100))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const rawBody = await res.text()
  console.log('[trade-in/lookup] Gemini status:', res.status)

  if (!res.ok) {
    let msg = rawBody.slice(0, 300)
    try { msg = JSON.parse(rawBody)?.error?.message || msg } catch {}
    if (res.status === 403) throw new Error('Invalid Gemini API key — check GEMINI_API_KEY in Vercel.')
    if (res.status === 429) throw new Error('Gemini rate limit — free tier is 15 req/min. Try again shortly.')
    throw new Error(`Gemini ${res.status}: ${msg}`)
  }

  const data = JSON.parse(rawBody)
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (!text) {
    console.log('[trade-in/lookup] Empty Gemini response:', JSON.stringify(data).slice(0, 400))
    throw new Error('Gemini returned an empty response')
  }

  console.log('[trade-in/lookup] Gemini response:', text.slice(0, 200))
  return text
}

// ── IMEI.info lookup ──────────────────────────────────────────────

async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    const res = await fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'NovaOps/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    console.log('[trade-in/lookup] IMEI.info keys:', Object.keys(data).join(', '))
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

async function searchPrice(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  const prompt =
`Search for the current used market price of: ${query}

Find recent eBay SOLD/COMPLETED listings and Swappa listings for this exact device.
Return ONLY a raw JSON object — no markdown, no code fences, no text before or after:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence describing what you found>"}

Rules:
- ebay_avg: average of recent eBay sold listings in USD (0 if not found)
- swappa_avg: average of Swappa listings in USD (0 if not found)
- median: best estimate of fair used market value in USD
- Numbers only — no $ symbol, no commas
- If truly no data: {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"No pricing data found"}`

  const text = await callGemini(prompt, true)
  const parsed = extractJson(text)
  if (typeof parsed.median !== 'number') {
    console.log('[trade-in/lookup] Unexpected JSON:', JSON.stringify(parsed))
    return null
  }
  return parsed
}

// ── Main handler ──────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const t0 = Date.now()

  try {
    const body = await readBody(event) as {
      brand?: string; model?: string; storage?: string
      imei?: string; model_number?: string
    }

    console.log('[trade-in/lookup] Body:', JSON.stringify(body))

    let resolvedBrand   = (body.brand   || '').trim()
    let resolvedModel   = (body.model   || '').trim()
    let resolvedStorage = (body.storage || '').trim()
    let lookupMethod    = 'name'

    // ── 1. IMEI ───────────────────────────────────────────────────
    if (body.imei) {
      const digits = body.imei.replace(/\D/g, '')
      if (isValidImei(digits)) {
        const result = await lookupImei(digits)
        if (result) {
          resolvedBrand = result.brand; resolvedModel = result.model
          resolvedStorage = result.storage || resolvedStorage
          lookupMethod = 'imei'
        }
      }
    }

    // ── 2. Model number ───────────────────────────────────────────
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      try {
        const text = await callGemini(
          `Identify the exact consumer device from this model/part number: ${body.model_number.trim()}

Return ONLY raw JSON, no markdown:
{"brand":"<manufacturer>","model":"<full marketing name>","storage":"<capacity or empty string>"}
If unrecognized: {"brand":"","model":"","storage":""}`,
          false
        )
        const r = extractJson(text)
        if (r.brand && r.model) {
          resolvedBrand = r.brand; resolvedModel = r.model
          resolvedStorage = r.storage || resolvedStorage
          lookupMethod = 'model_number'
        }
      } catch (err: any) {
        if (err.message?.includes('API key') || err.message?.includes('rate limit')) throw err
        // fall through to name search
      }
    }

    // ── 3. Need brand or model ────────────────────────────────────
    if (!resolvedBrand && !resolvedModel) {
      return { ok: false, error: 'Please enter a brand and model, IMEI, or model number.', lookup_method: 'manual' }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    const pricing = await searchPrice(priceQuery)

    console.log(`[trade-in/lookup] Done in ${Date.now() - t0}ms — median: ${pricing?.median}`)

    if (!pricing || pricing.median === 0) {
      return {
        ok: false,
        error: `No pricing data found for "${priceQuery}". Try adding an IMEI or model number, or enter the price manually.`,
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
      source_note:   pricing.source_note,
      lookup_method: lookupMethod,
    }

  } catch (err: any) {
    console.error('[trade-in/lookup] Fatal:', err.message)
    return { ok: false, error: err.message || 'Lookup failed — check Vercel function logs.', lookup_method: 'manual' }
  }
})

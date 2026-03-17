/**
 * POST /api/trade-in/lookup
 *
 * Device price lookup — two reliable tiers, no scraping:
 *
 *   Tier 1: PriceCharting API   — free, no key, real sold data. Covers most
 *                                  popular phones/tablets reliably.
 *
 *   Tier 2: Gemini (training)   — kicks in only when PriceCharting has no
 *                                  match (obscure/older devices). Uses training
 *                                  data only — no live grounding, no search tool.
 *                                  Optional: set GEMINI_API_KEY env var.
 *                                  Free key: https://aistudio.google.com/app/apikey
 *
 *   Cache: results are cached in-memory for 6 hours so repeat lookups of the
 *          same device never hit external APIs again.
 *
 * IMEI resolution: imei.info (free, no key)
 * Model # resolution: static lookup table (no network call needed)
 */

const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = 'gemini-2.5-flash'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000  // 6 hours
const BROWSER_UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── In-memory cache ───────────────────────────────────────────────
// Safe on Vercel: each function instance caches independently.
// Avoids hammering PriceCharting for the same device repeatedly.

interface CacheEntry {
  result: PricingResult
  expiresAt: number
}
interface PricingResult {
  ebay_avg: number; swappa_avg: number; median: number
  source_note: string; tier: string
}

const cache = new Map<string, CacheEntry>()

function cacheKey(query: string) {
  return query.toLowerCase().replace(/\s+/g, ' ').trim()
}

function cacheGet(query: string): PricingResult | null {
  const entry = cache.get(cacheKey(query))
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(cacheKey(query)); return null }
  console.log('[lookup] Cache hit:', query)
  return entry.result
}

function cacheSet(query: string, result: PricingResult) {
  cache.set(cacheKey(query), { result, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── Helpers ───────────────────────────────────────────────────────

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

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 100) / 100
}

function extractJson(text: string): any {
  // Strip thinking blocks that Gemini 2.5 may emit before the JSON
  const withoutThinking = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
  const clean = withoutThinking.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found in response: ${clean.slice(0, 120)}`)
  return JSON.parse(clean.slice(start, end + 1))
}

// ── Static model-number → device map ─────────────────────────────

const MODEL_NUMBER_MAP: Record<string, { brand: string; model: string; storage?: string }> = {
  // iPhone 14 series
  'MQ3D3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '128GB' },
  'MPWH3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '256GB' },
  'MQ3E3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '512GB' },
  'MQAC3LL/A': { brand: 'Apple', model: 'iPhone 14 Plus', storage: '128GB' },
  'MQ1F3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '128GB' },
  'MQ1G3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '256GB' },
  'MQ1H3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '512GB' },
  'MQ923LL/A': { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '128GB' },
  'MQAF3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '256GB' },
  // iPhone 15 series
  'MTXN3LL/A': { brand: 'Apple', model: 'iPhone 15', storage: '128GB' },
  'MTXR3LL/A': { brand: 'Apple', model: 'iPhone 15', storage: '256GB' },
  'MTXT3LL/A': { brand: 'Apple', model: 'iPhone 15', storage: '512GB' },
  'MTUW3LL/A': { brand: 'Apple', model: 'iPhone 15 Plus', storage: '128GB' },
  'MTV83LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro', storage: '128GB' },
  'MTV93LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB' },
  'MTVA3LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro', storage: '512GB' },
  'MTVB3LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro', storage: '1TB' },
  'MU7C3LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '256GB' },
  'MU7D3LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '512GB' },
  'MU7E3LL/A':  { brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '1TB' },
  // Samsung Galaxy S22
  'SM-S901B':  { brand: 'Samsung', model: 'Galaxy S22', storage: '128GB' },
  'SM-S901U':  { brand: 'Samsung', model: 'Galaxy S22', storage: '128GB' },
  'SM-S906B':  { brand: 'Samsung', model: 'Galaxy S22+', storage: '128GB' },
  'SM-S908B':  { brand: 'Samsung', model: 'Galaxy S22 Ultra', storage: '128GB' },
  'SM-S908U':  { brand: 'Samsung', model: 'Galaxy S22 Ultra', storage: '128GB' },
  // Samsung Galaxy S23
  'SM-S911B':  { brand: 'Samsung', model: 'Galaxy S23', storage: '128GB' },
  'SM-S911U':  { brand: 'Samsung', model: 'Galaxy S23', storage: '128GB' },
  'SM-S916B':  { brand: 'Samsung', model: 'Galaxy S23+', storage: '256GB' },
  'SM-S918B':  { brand: 'Samsung', model: 'Galaxy S23 Ultra', storage: '256GB' },
  // Samsung Galaxy S24
  'SM-S921B':  { brand: 'Samsung', model: 'Galaxy S24', storage: '128GB' },
  'SM-S926B':  { brand: 'Samsung', model: 'Galaxy S24+', storage: '256GB' },
  'SM-S928B':  { brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: '256GB' },
  // Google Pixel
  'GA03149-US': { brand: 'Google', model: 'Pixel 7', storage: '128GB' },
  'GA03694-US': { brand: 'Google', model: 'Pixel 7 Pro', storage: '128GB' },
  'GQML3':      { brand: 'Google', model: 'Pixel 8', storage: '128GB' },
  'G9BQD':      { brand: 'Google', model: 'Pixel 8 Pro', storage: '128GB' },
}

function resolveModelNumber(mn: string): { brand: string; model: string; storage?: string } | null {
  return MODEL_NUMBER_MAP[mn.trim().toUpperCase()] || null
}

// ── Tier 1: PriceCharting API ─────────────────────────────────────
// Free public API, no key required. Returns used ("loose") prices
// in cents. Covers most major consumer phones reliably.

async function pricechartingLookup(query: string): Promise<PricingResult | null> {
  try {
    const encoded = encodeURIComponent(query)

    // Try phone category first for faster, more accurate match
    let products: any[] = []
    for (const url of [
      `https://www.pricecharting.com/api/products?q=${encoded}&type=phone`,
      `https://www.pricecharting.com/api/products?q=${encoded}`,
    ]) {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(7000),
      })
      if (!res.ok) { console.log('[lookup] PriceCharting search →', res.status); continue }
      const data = await res.json()
      products = data?.products || []
      if (products.length) break
    }

    if (!products.length) { console.log('[lookup] PriceCharting: no products found'); return null }

    const best = products[0]
    console.log('[lookup] PriceCharting match:', best['product-name'], `(id=${best.id})`)

    const detailRes = await fetch(`https://www.pricecharting.com/api/product?id=${best.id}`, {
      headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(7000),
    })
    if (!detailRes.ok) return null
    const detail = await detailRes.json()

    // Prices are in cents; prefer loose (used without box), fall back to complete
    const cents = (detail['loose-price'] > 0 ? detail['loose-price'] : detail['complete-price']) ?? 0
    const usedPrice = typeof cents === 'number' && cents > 0 ? Math.round(cents) / 100 : 0

    if (usedPrice < 5) { console.log('[lookup] PriceCharting: price too low, skipping'); return null }

    console.log('[lookup] PriceCharting price: $' + usedPrice)
    return {
      ebay_avg:    usedPrice,
      swappa_avg:  0,
      median:      usedPrice,
      source_note: `PriceCharting · ${best['product-name']}`,
      tier:        'pricecharting',
    }
  } catch (err: any) {
    console.log('[lookup] PriceCharting error:', err.message)
    return null
  }
}

// ── Tier 2: Gemini training data fallback ─────────────────────────
// Only called when PriceCharting has no match.
// Uses training data only — no web grounding, no search tool.
// thinkingBudget: 0 disables the reasoning preamble so we get
// a clean JSON response without needing to parse around it.

function getGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    (useRuntimeConfig().geminiApiKey as string) ||
    ''
  )
}

async function geminiTrainingFallback(query: string): Promise<PricingResult | null> {
  const apiKey = getGeminiKey()
  if (!apiKey) {
    console.log('[lookup] No Gemini key — skipping Tier 2')
    return null
  }

  const prompt = `What is the typical used resale value (USD) for: ${query}

Return ONLY a raw JSON object with no markdown, no code fences, no explanation:
{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one short sentence>"}

Rules:
- All values must be plain numbers (no $ symbol, no strings)
- median should reflect realistic street price for a used device in good condition
- If you genuinely have no data, return {"ebay_avg":0,"swappa_avg":0,"median":0,"source_note":"unknown"}`

  try {
    const url  = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.1,
        maxOutputTokens: 256,
        // Disable thinking so we get a clean JSON response immediately
        thinkingConfig: { thinkingBudget: 0 },
      },
    }

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(12000),
    })

    const rawBody = await res.text()

    if (!res.ok) {
      let msg = rawBody.slice(0, 200)
      try { msg = JSON.parse(rawBody)?.error?.message || msg } catch {}
      console.log('[lookup] Gemini error:', res.status, msg)
      return null
    }

    const text = JSON.parse(rawBody)?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text) { console.log('[lookup] Gemini: empty response'); return null }

    console.log('[lookup] Gemini raw:', text.slice(0, 120))

    const p = extractJson(text)
    if (typeof p.median !== 'number' || p.median <= 0) {
      console.log('[lookup] Gemini: median missing or zero')
      return null
    }

    return {
      ebay_avg:    typeof p.ebay_avg   === 'number' ? p.ebay_avg   : p.median,
      swappa_avg:  typeof p.swappa_avg === 'number' ? p.swappa_avg : 0,
      median:      p.median,
      source_note: typeof p.source_note === 'string' ? p.source_note : 'Gemini estimate',
      tier:        'gemini-training',
    }
  } catch (err: any) {
    console.log('[lookup] Gemini fallback error:', err.message)
    return null
  }
}

// ── IMEI resolution ───────────────────────────────────────────────

async function lookupImei(imei: string): Promise<{ brand: string; model: string; storage?: string } | null> {
  try {
    const res = await fetch(`https://www.imei.info/api/?imei=${imei}&format=json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'NovaOps/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.DeviceName && data?.BrandName) {
      return { brand: String(data.BrandName), model: String(data.DeviceName), storage: data.Storage || undefined }
    }
    return null
  } catch { return null }
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

    // ── Step 1: IMEI resolution ──────────────────────────────────
    if (body.imei) {
      const digits = body.imei.replace(/\D/g, '')
      if (isValidImei(digits)) {
        const r = await lookupImei(digits)
        if (r) {
          resolvedBrand   = r.brand
          resolvedModel   = r.model
          resolvedStorage = r.storage || resolvedStorage
          lookupMethod    = 'imei'
        }
      }
    }

    // ── Step 2: Model number resolution ─────────────────────────
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      const r = resolveModelNumber(body.model_number.trim())
      if (r) {
        resolvedBrand   = r.brand
        resolvedModel   = r.model
        resolvedStorage = r.storage || resolvedStorage
        lookupMethod    = 'model_number'
      }
    }

    if (!resolvedBrand && !resolvedModel) {
      return {
        ok: false,
        error: 'Please enter a brand and model, IMEI, or model number.',
        lookup_method: 'manual',
      }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    console.log('[lookup] Query:', priceQuery)

    // ── Step 3: Check cache ──────────────────────────────────────
    const cached = cacheGet(priceQuery)
    if (cached) {
      return {
        ok:               true,
        resolved_brand:   resolvedBrand   || undefined,
        resolved_model:   resolvedModel   || undefined,
        resolved_storage: resolvedStorage || undefined,
        ebay_avg:         cached.ebay_avg,
        swappa_avg:       cached.swappa_avg,
        median:           cached.median,
        source_note:      cached.source_note + ' (cached)',
        lookup_method:    lookupMethod,
      }
    }

    // ── Step 4: Tier 1 — PriceCharting ──────────────────────────
    let pricing = await pricechartingLookup(priceQuery)

    // ── Step 5: Tier 2 — Gemini fallback (only if PC missed) ────
    if (!pricing) {
      console.log('[lookup] PriceCharting miss — trying Gemini training fallback')
      pricing = await geminiTrainingFallback(priceQuery)
    }

    console.log(`[lookup] Done in ${Date.now() - t0}ms | tier=${pricing?.tier ?? 'none'} median=$${pricing?.median ?? 'none'}`)

    if (!pricing) {
      return {
        ok:               false,
        error:            `No pricing data found for "${priceQuery}". Enter the market price manually.`,
        lookup_method:    lookupMethod,
        resolved_brand:   resolvedBrand   || undefined,
        resolved_model:   resolvedModel   || undefined,
        resolved_storage: resolvedStorage || undefined,
      }
    }

    // Cache the successful result for 6 hours
    cacheSet(priceQuery, pricing)

    const tierLabel = pricing.tier === 'pricecharting'   ? 'PriceCharting (live)'
                    : pricing.tier === 'gemini-training' ? 'Gemini estimate'
                    : 'market data'

    return {
      ok:               true,
      resolved_brand:   resolvedBrand   || undefined,
      resolved_model:   resolvedModel   || undefined,
      resolved_storage: resolvedStorage || undefined,
      ebay_avg:         pricing.ebay_avg,
      swappa_avg:       pricing.swappa_avg,
      median:           pricing.median,
      source_note:      `${pricing.source_note} · via ${tierLabel}`,
      lookup_method:    lookupMethod,
    }

  } catch (err: any) {
    console.error('[lookup] Fatal:', err.message)
    return { ok: false, error: err.message || 'Lookup failed — check server logs.', lookup_method: 'manual' }
  }
})


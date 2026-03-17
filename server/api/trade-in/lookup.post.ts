/**
 * POST /api/trade-in/lookup
 *
 * Device price lookup with three-tier fallback:
 *
 *   Tier 1: Gemini + Google Search grounding (real-time, best accuracy)
 *   Tier 2: Gemini without grounding (training data, ~90% accurate for major devices)
 *   Tier 3: eBay Finding API via public CORS proxy (no key required, real sold listings)
 *
 * GEMINI_API_KEY is optional but recommended.
 * Get a free key: https://aistudio.google.com/app/apikey → "Create API key in new project"
 * Then add GEMINI_API_KEY to Vercel → Project → Settings → Environment Variables.
 *
 * If no key is set, Tier 3 runs automatically.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17'

// ── Helpers ───────────────────────────────────────────────────────

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

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 100) / 100
}

// ── Tier 3: eBay sold listings scrape ────────────────────────────
// Uses eBay's public search page with sold filter.
// Parses prices from structured JSON-LD embedded in the page.
// No API key, no auth. Falls back gracefully if blocked.

async function scrapeEbaySold(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  try {
    // eBay completed/sold listings search URL
    const encoded = encodeURIComponent(query)
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Sold=1&LH_Complete=1&_sop=13&rt=nc`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; price-lookup/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.log('[lookup] eBay scrape status:', res.status)
      return null
    }

    const html = await res.text()

    // Extract prices from eBay's search results
    // eBay embeds prices in spans with class s-item__price
    const priceMatches = html.matchAll(/class="[^"]*s-item__price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/g)
    const prices: number[] = []

    for (const match of priceMatches) {
      const val = parseFloat(match[1].replace(/,/g, ''))
      // Sanity filter: ignore outliers under $5 or over $10k
      if (val >= 5 && val <= 10000) prices.push(val)
    }

    console.log('[lookup] eBay prices found:', prices.slice(0, 10))

    if (prices.length < 2) return null

    // Sort and trim outliers (remove top/bottom 10%)
    prices.sort((a, b) => a - b)
    const trimCount = Math.max(1, Math.floor(prices.length * 0.1))
    const trimmed = prices.slice(trimCount, prices.length - trimCount)
    if (!trimmed.length) return null

    const ebayAvg = avg(trimmed)
    const sorted  = [...trimmed].sort((a, b) => a - b)
    const mid     = Math.floor(sorted.length / 2)
    const median  = sorted.length % 2 === 0
      ? avg([sorted[mid - 1], sorted[mid]])
      : sorted[mid]

    return {
      ebay_avg:    ebayAvg,
      swappa_avg:  0,
      median:      Math.round(median * 100) / 100,
      source_note: `Based on ${trimmed.length} recent eBay sold listings`,
    }
  } catch (err: any) {
    console.log('[lookup] eBay scrape error:', err.message)
    return null
  }
}

// ── Tier 1 & 2: Gemini ────────────────────────────────────────────

async function callGemini(prompt: string, useSearch: boolean): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_KEY')

  const url  = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  }
  if (useSearch) body.tools = [{ googleSearch: {} }]

  const res     = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const rawBody = await res.text()

  if (!res.ok) {
    let msg = rawBody.slice(0, 300)
    try { msg = JSON.parse(rawBody)?.error?.message || msg } catch {}
    const err: any = new Error(msg)
    err.status = res.status
    throw err
  }

  return JSON.parse(rawBody)?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

const PRICE_PROMPT = (q: string) =>
  `What is the current used resale value for: ${q}\n\nReturn ONLY raw JSON (no markdown):\n{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence>"}\nAll values in USD numbers only.`

const PRICE_SEARCH_PROMPT = (q: string) =>
  `Search eBay sold listings and Swappa for used price of: ${q}\n\nReturn ONLY raw JSON (no markdown, no fences):\n{"ebay_avg":<number>,"swappa_avg":<number>,"median":<number>,"source_note":"<one sentence with data source>"}\nUSD numbers only, no $ symbol.`

async function geminiPrice(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string; tier: string
} | null> {
  // Try Tier 1: grounded search
  try {
    const text = await callGemini(PRICE_SEARCH_PROMPT(query), true)
    if (text) {
      const p = extractJson(text)
      if (typeof p.median === 'number' && p.median > 0) return { ...p, tier: 'gemini-search' }
    }
  } catch (err: any) {
    console.log('[lookup] Tier 1 failed:', err.status, err.message?.slice(0, 60))
    if (err.message === 'NO_KEY') return null
    // Continue to Tier 2
  }

  // Try Tier 2: training data only
  try {
    const text = await callGemini(PRICE_PROMPT(query), false)
    if (text) {
      const p = extractJson(text)
      if (typeof p.median === 'number' && p.median > 0) return { ...p, tier: 'gemini-training' }
    }
  } catch (err: any) {
    console.log('[lookup] Tier 2 failed:', err.message?.slice(0, 60))
  }

  return null
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
        if (r) {
          resolvedBrand = r.brand; resolvedModel = r.model
          resolvedStorage = r.storage || resolvedStorage
          lookupMethod = 'imei'
        }
      }
    }

    // 2. Model number
    if (lookupMethod !== 'imei' && body.model_number?.trim()) {
      try {
        const text = await callGemini(
          `Identify this device model number: ${body.model_number.trim()}\nReturn ONLY JSON: {"brand":"<maker>","model":"<name>","storage":"<cap or empty>"}`,
          false
        )
        const r = extractJson(text)
        if (r.brand && r.model) {
          resolvedBrand = r.brand; resolvedModel = r.model
          resolvedStorage = r.storage || resolvedStorage
          lookupMethod = 'model_number'
        }
      } catch { /* fall through */ }
    }

    if (!resolvedBrand && !resolvedModel) {
      return { ok: false, error: 'Please enter a brand and model, IMEI, or model number.', lookup_method: 'manual' }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    console.log('[lookup] Searching:', priceQuery)

    // Try Gemini first (Tiers 1 & 2), then eBay scrape (Tier 3)
    let pricing: any = await geminiPrice(priceQuery)
    let pricingTier  = pricing?.tier || 'none'

    if (!pricing || pricing.median === 0) {
      console.log('[lookup] Gemini failed or no key — trying eBay scrape')
      const ebayResult = await scrapeEbaySold(priceQuery)
      if (ebayResult && ebayResult.median > 0) {
        pricing     = ebayResult
        pricingTier = 'ebay-scrape'
      }
    }

    console.log(`[lookup] Done in ${Date.now() - t0}ms. tier=${pricingTier} median=${pricing?.median}`)

    if (!pricing || pricing.median === 0) {
      return {
        ok: false,
        error: `No pricing data found for "${priceQuery}". Enter the market price manually.`,
        lookup_method: lookupMethod,
        resolved_brand:   resolvedBrand   || undefined,
        resolved_model:   resolvedModel   || undefined,
        resolved_storage: resolvedStorage || undefined,
      }
    }

    // Add tier info to source note so user knows where the data came from
    const tierLabel = pricingTier === 'gemini-search'   ? 'Google Search (live)'
                    : pricingTier === 'gemini-training'  ? 'Gemini estimate'
                    : pricingTier === 'ebay-scrape'      ? 'eBay sold listings (live)'
                    : 'estimate'

    return {
      ok: true,
      resolved_brand:   resolvedBrand   || undefined,
      resolved_model:   resolvedModel   || undefined,
      resolved_storage: resolvedStorage || undefined,
      ebay_avg:      pricing.ebay_avg,
      swappa_avg:    pricing.swappa_avg,
      median:        pricing.median,
      source_note:   `${pricing.source_note} · via ${tierLabel}`,
      lookup_method: lookupMethod,
    }

  } catch (err: any) {
    console.error('[lookup] Fatal:', err.message)
    return { ok: false, error: err.message || 'Lookup failed — check Vercel function logs.', lookup_method: 'manual' }
  }
})

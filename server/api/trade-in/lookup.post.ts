/**
 * POST /api/trade-in/lookup
 *
 * Device price lookup — no API keys required.
 *
 *   Tier 1: PriceCharting API  (free, no key, real sold data for phones/electronics)
 *   Tier 2: Swappa scrape      (real marketplace listings, HTML parse)
 *   Tier 3: eBay sold scrape   (completed listings, regex price parse)
 *
 * All three run in parallel and results are merged for best accuracy.
 * IMEI resolution uses imei.info (free, no key).
 * Model number resolution uses a static lookup table (no AI needed).
 */

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

function calcMedian(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? avg([s[m - 1], s[m]]) : s[m]
}

function trimOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices
  prices.sort((a, b) => a - b)
  const cut = Math.max(1, Math.floor(prices.length * 0.1))
  return prices.slice(cut, prices.length - cut)
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function fetchHtml(url: string, extraHeaders: Record<string, string> = {}): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        ...extraHeaders,
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) { console.log(`[lookup] fetch ${url} → ${res.status}`); return null }
    return await res.text()
  } catch (err: any) {
    console.log(`[lookup] fetch error ${url}:`, err.message)
    return null
  }
}

// ── Static model-number → device map ─────────────────────────────
// Covers the most common trade-in models. Extend as needed.

const MODEL_NUMBER_MAP: Record<string, { brand: string; model: string; storage?: string }> = {
  // iPhone
  'MQ3D3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '128GB' },
  'MPWH3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '256GB' },
  'MQ3E3LL/A': { brand: 'Apple', model: 'iPhone 14', storage: '512GB' },
  'MQAC3LL/A': { brand: 'Apple', model: 'iPhone 14 Plus', storage: '128GB' },
  'MQ1F3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '128GB' },
  'MQ1G3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '256GB' },
  'MQ1H3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro', storage: '512GB' },
  'MQ923LL/A': { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '128GB' },
  'MQAF3LL/A': { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '256GB' },
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

// ── Tier 1: PriceCharting ─────────────────────────────────────────

async function pricechartingLookup(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  try {
    const encoded = encodeURIComponent(query)
    // Try with phone type first, then without
    let products: any[] = []
    for (const url of [
      `https://www.pricecharting.com/api/products?q=${encoded}&type=phone`,
      `https://www.pricecharting.com/api/products?q=${encoded}`,
    ]) {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) continue
      const data = await res.json()
      products = data?.products || []
      if (products.length) break
    }

    if (!products.length) return null

    const best = products[0]
    console.log('[lookup] PriceCharting match:', best['product-name'])

    const detailRes = await fetch(`https://www.pricecharting.com/api/product?id=${best.id}`, {
      headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    })
    if (!detailRes.ok) return null
    const detail = await detailRes.json()

    // Prices are in cents
    const usedPrice = typeof detail['loose-price'] === 'number' && detail['loose-price'] > 0
      ? detail['loose-price'] / 100
      : typeof detail['complete-price'] === 'number' && detail['complete-price'] > 0
        ? detail['complete-price'] / 100
        : 0

    if (usedPrice < 5) return null

    console.log('[lookup] PriceCharting price:', usedPrice)
    return {
      ebay_avg:    usedPrice,
      swappa_avg:  0,
      median:      usedPrice,
      source_note: `PriceCharting: ${best['product-name']}`,
    }
  } catch (err: any) {
    console.log('[lookup] PriceCharting error:', err.message)
    return null
  }
}

// ── Tier 2: Swappa scrape ─────────────────────────────────────────

async function swappaLookup(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://swappa.com/listing/search?q=${encoded}`
    const html = await fetchHtml(url, { Referer: 'https://swappa.com/' })
    if (!html) return null

    const prices: number[] = []

    // Try JSON-LD structured data first
    for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const obj = JSON.parse(m[1])
        const items: any[] = obj['@graph'] || (Array.isArray(obj) ? obj : [obj])
        for (const item of items) {
          const price = item?.offers?.price ?? item?.price
          const v = typeof price === 'number' ? price : parseFloat(price)
          if (v >= 5 && v <= 10000) prices.push(v)
        }
      } catch {}
    }

    // Fallback: data-price attributes and price spans
    if (prices.length < 2) {
      for (const m of html.matchAll(/data-price="([\d.]+)"/g)) {
        const v = parseFloat(m[1])
        if (v >= 5 && v <= 10000) prices.push(v)
      }
      for (const m of html.matchAll(/class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+(?:\.\d{1,2})?)/gi)) {
        const v = parseFloat(m[1].replace(/,/g, ''))
        if (v >= 5 && v <= 10000) prices.push(v)
      }
    }

    console.log('[lookup] Swappa prices:', prices.slice(0, 8))
    if (prices.length < 2) return null

    const trimmed = trimOutliers(prices)
    if (!trimmed.length) return null

    return {
      ebay_avg:    0,
      swappa_avg:  avg(trimmed),
      median:      calcMedian(trimmed),
      source_note: `Swappa: ${trimmed.length} listings`,
    }
  } catch (err: any) {
    console.log('[lookup] Swappa error:', err.message)
    return null
  }
}

// ── Tier 3: eBay sold listings scrape ────────────────────────────

async function ebayLookup(query: string): Promise<{
  ebay_avg: number; swappa_avg: number; median: number; source_note: string
} | null> {
  try {
    const encoded = encodeURIComponent(query)
    // LH_ItemCondition=3000 = Used
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Sold=1&LH_Complete=1&_sop=13&rt=nc&LH_ItemCondition=3000`
    const html = await fetchHtml(url)
    if (!html) return null

    const prices: number[] = []

    for (const m of html.matchAll(/class="[^"]*s-item__price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/g)) {
      const v = parseFloat(m[1].replace(/,/g, ''))
      if (v >= 5 && v <= 10000) prices.push(v)
    }

    // Wider fallback if sparse
    if (prices.length < 3) {
      for (const m of html.matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)) {
        const v = parseFloat(m[1].replace(/,/g, ''))
        if (v >= 5 && v <= 10000) prices.push(v)
      }
    }

    console.log('[lookup] eBay prices:', prices.slice(0, 8))
    if (prices.length < 2) return null

    const trimmed = trimOutliers(prices)
    if (!trimmed.length) return null

    return {
      ebay_avg:    avg(trimmed),
      swappa_avg:  0,
      median:      calcMedian(trimmed),
      source_note: `eBay sold: ${trimmed.length} listings`,
    }
  } catch (err: any) {
    console.log('[lookup] eBay error:', err.message)
    return null
  }
}

// ── Merge results from all sources ───────────────────────────────

function mergeResults(results: Array<{ ebay_avg: number; swappa_avg: number; median: number; source_note: string } | null>) {
  const valid = results.filter(Boolean) as Array<{ ebay_avg: number; swappa_avg: number; median: number; source_note: string }>
  if (!valid.length) return null

  const ebayResults   = valid.filter(r => r.ebay_avg > 0)
  const swappaResults = valid.filter(r => r.swappa_avg > 0)
  const allMedians    = valid.map(r => r.median).filter(v => v > 0)

  const ebay_avg   = ebayResults.length   ? avg(ebayResults.map(r => r.ebay_avg))     : 0
  const swappa_avg = swappaResults.length ? avg(swappaResults.map(r => r.swappa_avg)) : 0
  const med        = allMedians.length    ? calcMedian(allMedians)                     : 0

  if (med === 0) return null

  const sourceCount = valid.length
  const sources = valid.map(r => r.source_note).join(' · ')

  return {
    ebay_avg,
    swappa_avg,
    median:      Math.round(med * 100) / 100,
    source_note: sources,
    tier:        sourceCount >= 2 ? 'multi-source' : 'single-source',
  }
}

// ── IMEI.info ─────────────────────────────────────────────────────

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

    // 1. IMEI resolution
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

    // 2. Model number resolution (static map, no AI)
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
      return { ok: false, error: 'Please enter a brand and model, IMEI, or model number.', lookup_method: 'manual' }
    }

    const priceQuery = [resolvedBrand, resolvedModel, resolvedStorage].filter(Boolean).join(' ')
    console.log('[lookup] Querying all tiers in parallel:', priceQuery)

    // All three tiers run simultaneously
    const [pcResult, swappaResult, ebayResult] = await Promise.all([
      pricechartingLookup(priceQuery),
      swappaLookup(priceQuery),
      ebayLookup(priceQuery),
    ])

    console.log('[lookup] Results — PC:', pcResult?.median ?? 'null', '| Swappa:', swappaResult?.median ?? 'null', '| eBay:', ebayResult?.median ?? 'null')

    const pricing = mergeResults([pcResult, swappaResult, ebayResult])

    console.log(`[lookup] Done in ${Date.now() - t0}ms | merged median=$${pricing?.median ?? 'none'}`)

    if (!pricing) {
      return {
        ok: false,
        error: `No pricing data found for "${priceQuery}". Enter the market price manually.`,
        lookup_method:    lookupMethod,
        resolved_brand:   resolvedBrand   || undefined,
        resolved_model:   resolvedModel   || undefined,
        resolved_storage: resolvedStorage || undefined,
      }
    }

    const tierLabel = pricing.tier === 'multi-source'
      ? `${[pcResult && 'PriceCharting', swappaResult && 'Swappa', ebayResult && 'eBay'].filter(Boolean).join(' + ')} (live)`
      : 'live market data'

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


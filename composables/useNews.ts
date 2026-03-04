// composables/useNews.ts
// Uses HackerNews Algolia API (https://hn.algolia.com/api) — free, no API key required.
// Fetches trending tech stories for the customer display.

export interface NewsItem {
    id: string
    title: string
    url: string
    domain: string
    points: number
    comments: number
    timeAgo: string
}

const _news = ref<NewsItem[]>([])
const _loading = ref(false)
const _loaded = ref(false)
let _refreshTimer: ReturnType<typeof setInterval> | null = null

export const useNews = () => {
    const fetchNews = async () => {
        _loading.value = true
        try {
            const resp = await fetch(
                'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12'
            )
            const data = await resp.json()

            _news.value = (data.hits || [])
                .filter((h: any) => h.title && h.url)
                .map((h: any) => ({
                    id: h.objectID,
                    title: h.title,
                    url: h.url,
                    domain: extractDomain(h.url),
                    points: h.points || 0,
                    comments: h.num_comments || 0,
                    timeAgo: relativeTime(h.created_at),
                }))

            _loaded.value = true
        } catch (err) {
            console.warn('[useNews] fetch error:', err)
        } finally {
            _loading.value = false
        }
    }

    const startAutoRefresh = (intervalMs = 15 * 60 * 1000) => {
        stopAutoRefresh()
        _refreshTimer = setInterval(fetchNews, intervalMs)
    }

    const stopAutoRefresh = () => {
        if (_refreshTimer) {
            clearInterval(_refreshTimer)
            _refreshTimer = null
        }
    }

    return {
        news: readonly(_news),
        newsLoading: readonly(_loading),
        newsLoaded: readonly(_loaded),
        fetchNews,
        startAutoRefresh,
        stopAutoRefresh,
    }
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return ''
    }
}

function relativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

// composables/useWeather.ts
// Uses Open-Meteo (https://open-meteo.com) — free, no API key required.
// Falls back gracefully if geolocation is denied.

export const useWeather = () => {
  const weather = useState('weather', () => ({
    temp: 0,
    feelsLike: 0,
    description: '',
    icon: '',
    location: '',
    loading: false,
    loaded: false,
    conditionCode: 0,
  }))

  const fetchWeather = async (lat?: number, lon?: number) => {
    weather.value.loading = true

    try {
      if (!lat || !lon) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      }

      let cityName = 'Local Area'
      try {
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const geoData = await geoResp.json()
        cityName =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.village ||
          geoData?.address?.county ||
          'Local Area'
      } catch { /* city name is optional */ }

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weathercode` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`

      const resp = await fetch(url)
      const data = await resp.json()
      const cur  = data.current

      const tempF      = Math.round(cur.temperature_2m)
      const feelsLikeF = Math.round(cur.apparent_temperature)
      const code       = cur.weathercode as number

      weather.value = {
        temp: tempF,
        feelsLike: feelsLikeF,
        description: wmoDescription(code),
        icon: wmoIconKey(code),
        location: cityName,
        loading: false,
        loaded: true,
        conditionCode: code,
      }
    } catch (err) {
      console.warn('[useWeather] fetch error:', err)
      weather.value.loading = false
      weather.value.description = 'Unable to load'
    }
  }

  return { weather, fetchWeather }
}

export function wmoDescription(code: number): string {
  if (code === 0)  return 'Clear skies'
  if (code <= 2)   return 'Partly cloudy'
  if (code === 3)  return 'Overcast'
  if (code <= 48)  return 'Foggy'
  if (code <= 57)  return 'Drizzle'
  if (code <= 67)  return 'Rainy'
  if (code <= 77)  return 'Snowy'
  if (code <= 82)  return 'Showers'
  if (code <= 86)  return 'Snow showers'
  if (code <= 99)  return 'Thunderstorms'
  return 'Unknown'
}

export function wmoIconKey(code: number): string {
  if (code === 0)  return 'sun'
  if (code <= 2)   return 'cloud-sun'
  if (code === 3)  return 'cloud'
  if (code <= 48)  return 'cloud'
  if (code <= 67)  return 'cloud-rain'
  if (code <= 77)  return 'snowflake'
  if (code <= 82)  return 'cloud-drizzle'
  if (code <= 86)  return 'cloud-snow'
  if (code <= 99)  return 'cloud-lightning'
  return 'cloud'
}

export function getContextBanner(tempF: number, weatherCode: number): {
  greeting: string
  suggestion: string
  emoji: string
} {
  const h = new Date().getHours()

  let greeting = 'Good morning'
  if (h >= 12 && h < 17)      greeting = 'Good afternoon'
  else if (h >= 17 && h < 21) greeting = 'Good evening'
  else if (h >= 21 || h < 5)  greeting = 'Working late? Take a break'

  const cold = [
    { text: 'a hot coffee', emoji: '☕' },
    { text: 'hot chocolate', emoji: '🍫' },
    { text: 'a warm bowl of soup', emoji: '🍲' },
  ]
  const mild = [
    { text: 'iced coffee', emoji: '🧋' },
    { text: 'lemonade', emoji: '🍋' },
    { text: 'a smoothie', emoji: '🥤' },
  ]
  const hot = [
    { text: 'cold brew', emoji: '🧊' },
    { text: 'ice cream', emoji: '🍦' },
    { text: 'a hydration drink', emoji: '💧' },
  ]

  let pool = tempF <= 45 ? cold : tempF <= 70 ? mild : hot
  if (weatherCode >= 51 && weatherCode <= 82) pool = [{ text: 'a hot cup of tea', emoji: '🫖' }]
  if (weatherCode >= 71 && weatherCode <= 77) pool = [{ text: 'hot cocoa', emoji: '☕' }]

  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { greeting, suggestion: pick.text, emoji: pick.emoji }
}

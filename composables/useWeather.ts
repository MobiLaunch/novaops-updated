export const useWeather = () => {
  const weather = useState('weather', () => ({
    temp: 0,
    description: '',
    icon: '',
    location: '',
    loading: false,
    loaded: false
  }))

  const fetchWeather = async (lat?: number, lon?: number) => {
    weather.value.loading = true
    
    try {
      // Use browser geolocation if no coords provided
      if (!lat || !lon) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      }

      // Using OpenWeatherMap API (you'll need to add your API key in settings)
      // For demo, we'll use a mock response
      const mockWeather = {
        temp: Math.floor(Math.random() * 30) + 50, // 50-80°F
        description: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 4)],
        icon: 'i-heroicons-sun',
        location: 'Local Area'
      }

      weather.value = {
        ...mockWeather,
        loading: false,
        loaded: true
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
      weather.value.loading = false
      weather.value.description = 'Unable to load'
    }
  }

  return {
    weather,
    fetchWeather
  }
}

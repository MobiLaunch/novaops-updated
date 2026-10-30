import { create } from "zustand";

// Open-Meteo: free, no API key. Falls back gracefully if geolocation is denied.
export interface ForecastDay { day: string; high: number; low: number; icon: string; description: string; code: number }

interface WeatherState {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  location: string;
  loading: boolean;
  loaded: boolean;
  conditionCode: number;
  forecast: ForecastDay[];
  fetchWeather: (lat?: number, lon?: number) => Promise<void>;
}

export function wmoDescription(code: number): string {
  if (code === 0) return "Clear skies";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorms";

  return "Unknown";
}

export function wmoIconKey(code: number): string {
  if (code === 0) return "sun";
  if (code <= 2) return "cloud-sun";
  if (code <= 48) return "cloud";
  if (code <= 67) return "cloud-rain";
  if (code <= 77) return "snowflake";
  if (code <= 82) return "cloud-drizzle";
  if (code <= 86) return "cloud-snow";
  if (code <= 99) return "cloud-lightning";

  return "cloud";
}

export function getGreeting(): string {
  const h = new Date().getHours();

  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  if (h >= 21 || h < 5) return "Working late";

  return "Good morning";
}

export const useWeather = create<WeatherState>((set) => ({
  temp: 0, feelsLike: 0, description: "", icon: "", location: "", loading: false, loaded: false, conditionCode: 0, forecast: [],
  fetchWeather: async (lat, lon) => {
    set({ loading: true });
    try {
      if (!lat || !lon) {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));

        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }

      let location = "Local area";

      try {
        const geo = await (await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { "Accept-Language": "en" } })).json();

        location = geo?.address?.city || geo?.address?.town || geo?.address?.village || geo?.address?.county || location;
      } catch { /* city name is optional */ }

      const data = await (await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=4&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`,
      )).json();
      const code = data.current.weathercode as number;
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const forecast: ForecastDay[] = [];

      for (let i = 1; i < (data.daily?.time?.length || 0); i++) {
        const fc = data.daily.weathercode[i] as number;

        forecast.push({
          day: names[new Date(`${data.daily.time[i]}T12:00:00`).getDay()],
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          icon: wmoIconKey(fc),
          description: wmoDescription(fc),
          code: fc,
        });
      }

      set({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        description: wmoDescription(code),
        icon: wmoIconKey(code),
        location,
        loading: false,
        loaded: true,
        conditionCode: code,
        forecast,
      });
    } catch (err) {
      console.warn("[useWeather] fetch error:", err);
      set({ loading: false, description: "Unable to load" });
    }
  },
}));

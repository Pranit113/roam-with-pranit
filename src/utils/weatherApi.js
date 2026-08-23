/* ─────────────────────────────────────────────────────────────────────────────
   weatherApi.js
   Free Open-Meteo Weather API Integration (No API key required)
   Provides real-time weather & 5-day forecasts by latitude/longitude coordinates.
   ───────────────────────────────────────────────────────────────────────────── */

// Map WMO Weather Code to emoji icon and descriptive label
export function getWeatherDetails(code) {
  if (code === 0)                  return { emoji: '☀️',  label: 'Clear Sky',      bg: '#FFFBEB', color: '#D97706' };
  if ([1, 2, 3].includes(code))    return { emoji: '⛅',  label: 'Partly Cloudy',  bg: '#F0F9FF', color: '#0284C7' };
  if ([45, 48].includes(code))     return { emoji: '🌫️',  label: 'Foggy',          bg: '#F1F5F9', color: '#475569' };
  if ([51, 53, 55].includes(code)) return { emoji: '🌦️',  label: 'Drizzle',        bg: '#EFF6FF', color: '#2563EB' };
  if ([61, 63, 65].includes(code)) return { emoji: '🌧️',  label: 'Rainy',          bg: '#EFF6FF', color: '#1D4ED8' };
  if ([71, 73, 75].includes(code)) return { emoji: '❄️',  label: 'Snowy',          bg: '#F0FDFA', color: '#0D9488' };
  if ([80, 81, 82].includes(code)) return { emoji: '🌧️',  label: 'Heavy Showers',  bg: '#EEF2FF', color: '#4338CA' };
  if ([95, 96, 99].includes(code)) return { emoji: '🌩️',  label: 'Thunderstorm',   bg: '#FAF5FF', color: '#7E22CE' };
  return { emoji: '🌡️', label: 'Fair', bg: '#F8FAFC', color: '#334155' };
}

export async function fetchWeather(lat, lng) {
  if (!lat || !lng) return null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const currentCode = data.current?.weather_code ?? 0;
    const currentInfo = getWeatherDetails(currentCode);

    const daily = (data.daily?.time || []).slice(0, 5).map((date, i) => {
      const code = data.daily?.weather_code?.[i] ?? 0;
      const info = getWeatherDetails(code);
      return {
        date,
        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        maxTemp: Math.round(data.daily?.temperature_2m_max?.[i] ?? 0),
        minTemp: Math.round(data.daily?.temperature_2m_min?.[i] ?? 0),
        emoji: info.emoji,
        label: info.label,
      };
    });

    return {
      current: {
        temp: Math.round(data.current?.temperature_2m ?? 25),
        humidity: data.current?.relative_humidity_2m ?? 60,
        wind: Math.round(data.current?.wind_speed_10m ?? 10),
        emoji: currentInfo.emoji,
        label: currentInfo.label,
        bg: currentInfo.bg,
        color: currentInfo.color,
      },
      forecast: daily,
    };
  } catch (err) {
    console.warn('Weather API fetch failed:', err);
    return null;
  }
}

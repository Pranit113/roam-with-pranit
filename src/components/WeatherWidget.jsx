import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Wind, Droplets, RefreshCw } from 'lucide-react';
import { fetchWeather } from '../utils/weatherApi';

export default function WeatherWidget({ lat, lng, locationName }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchWeather(lat, lng);
    setWeather(data);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lat, lng]);

  if (loading) {
    return (
      <div className="ps-weather-card ps-weather-loading">
        <RefreshCw size={18} className="animate-spin" color="var(--em)" />
        <span>Loading live forecast for {locationName || 'location'}…</span>
      </div>
    );
  }

  if (!weather?.current) {
    return (
      <div className="ps-weather-card ps-weather-fallback">
        <CloudSun size={20} color="var(--t3)" />
        <span>Weather data unavailable for this location</span>
        <button onClick={load} className="ps-btn-ghost-sm">Retry</button>
      </div>
    );
  }

  const curr = weather.current;

  return (
    <motion.div
      className="ps-weather-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: curr.bg, borderColor: `${curr.color}30` }}
    >
      {/* Current weather summary */}
      <div className="ps-weather-top">
        <div className="ps-weather-main">
          <span className="ps-weather-emoji">{curr.emoji}</span>
          <div>
            <div className="ps-weather-temp">{curr.temp}°C</div>
            <div className="ps-weather-label" style={{ color: curr.color }}>{curr.label}</div>
            <div className="ps-weather-loc">{locationName || 'Current Stop'}</div>
          </div>
        </div>
        <div className="ps-weather-meta">
          <div className="ps-weather-meta-item">
            <Droplets size={13} color="var(--t3)" />
            <span>{curr.humidity}%</span>
          </div>
          <div className="ps-weather-meta-item">
            <Wind size={13} color="var(--t3)" />
            <span>{curr.wind} km/h</span>
          </div>
        </div>
      </div>

      {/* 5-day forecast scroll */}
      {weather.forecast?.length > 0 && (
        <div className="ps-weather-forecast-row">
          {weather.forecast.map((day, i) => (
            <div key={i} className="ps-weather-forecast-day">
              <span className="ps-forecast-dayname">{day.dayName}</span>
              <span className="ps-forecast-emoji">{day.emoji}</span>
              <span className="ps-forecast-temps">{day.maxTemp}° <small>{day.minTemp}°</small></span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

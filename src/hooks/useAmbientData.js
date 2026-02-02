import { useState, useEffect, useRef } from 'react';
import SunCalc from 'suncalc';

// WMO weather codes → single ambient word
const weatherCodeToText = {
  0: 'Clear',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  56: 'Drizzle',
  57: 'Drizzle',
  61: 'Rainy',
  63: 'Rainy',
  65: 'Rainy',
  66: 'Rainy',
  67: 'Rainy',
  71: 'Snowy',
  73: 'Snowy',
  75: 'Snowy',
  77: 'Snow Grains',
  80: 'Showers',
  81: 'Showers',
  82: 'Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Hail',
  99: 'Hail',
};

// Moon phase name from SunCalc phase value (0-1)
const getMoonPhaseName = (phase) => {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
};

// Format time as "5:42 AM"
const formatTime = (date, timezone) => {
  if (!date || isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * useAmbientData - fetches weather + computes sun/moon for a given city
 * @param {Object} options
 * @param {number} options.lat - latitude
 * @param {number} options.lng - longitude
 * @param {string} options.timezone - IANA timezone string
 * @param {boolean} options.enabled - only fetch when true (lazy load on expand)
 */
export function useAmbientData({ lat, lng, timezone, enabled }) {
  const [weather, setWeather] = useState(null);
  const [sun, setSun] = useState(null);
  const [moon, setMoon] = useState(null);
  const weatherCacheRef = useRef({ data: null, timestamp: 0 });
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Fetch weather from Open-Meteo (no API key needed)
  useEffect(() => {
    if (!enabled || !lat || !lng) return;

    const fetchWeather = async () => {
      // Check cache
      const now = Date.now();
      if (weatherCacheRef.current.data && now - weatherCacheRef.current.timestamp < CACHE_DURATION) {
        setWeather(weatherCacheRef.current.data);
        return;
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(timezone)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        const weatherData = {
          temperature: Math.round(data.current.temperature_2m),
          condition: weatherCodeToText[data.current.weather_code] || 'Clear',
        };

        weatherCacheRef.current = { data: weatherData, timestamp: now };
        setWeather(weatherData);
      } catch {
        // Graceful: show nothing rather than error
      }
    };

    fetchWeather();
  }, [lat, lng, timezone, enabled]);

  // Compute sun and moon data (SunCalc, pure math, no network)
  useEffect(() => {
    if (!enabled || !lat || !lng) return;

    const computeAstro = () => {
      const now = new Date();
      const times = SunCalc.getTimes(now, lat, lng);
      const sunPos = SunCalc.getPosition(now, lat, lng);

      // Sun progress: 0 = sunrise, 1 = sunset
      const sunriseMs = times.sunrise.getTime();
      const sunsetMs = times.sunset.getTime();
      const nowMs = now.getTime();
      const dayLength = sunsetMs - sunriseMs;
      const sunProgress = dayLength > 0 ? Math.max(0, Math.min(1, (nowMs - sunriseMs) / dayLength)) : 0;
      const isSunUp = nowMs >= sunriseMs && nowMs <= sunsetMs;

      setSun({
        sunrise: times.sunrise,
        sunset: times.sunset,
        sunriseFormatted: formatTime(times.sunrise, timezone),
        sunsetFormatted: formatTime(times.sunset, timezone),
        progress: sunProgress,
        isUp: isSunUp,
        altitude: sunPos.altitude, // radians, >0 means above horizon
      });

      const moonIllum = SunCalc.getMoonIllumination(now);
      setMoon({
        phase: moonIllum.phase,
        fraction: moonIllum.fraction,
        phaseName: getMoonPhaseName(moonIllum.phase),
      });
    };

    computeAstro();
    // Recalculate every 60s (sun/moon move slowly)
    const interval = setInterval(computeAstro, 60000);
    return () => clearInterval(interval);
  }, [lat, lng, timezone, enabled]);

  return { weather, sun, moon };
}

import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY_PREFIX = 'lastfm-stats-cache-';

// Max age for localStorage cache (10 minutes)
const MAX_CACHE_AGE_MS = 10 * 60 * 1000;

// Read cached stats from localStorage for a specific period
function getCachedStats(period) {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + period);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed.cachedAt && Date.now() - parsed.cachedAt > MAX_CACHE_AGE_MS) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

// Write stats to localStorage
function setCachedStats(period, stats) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + period, JSON.stringify({
      data: stats,
      cachedAt: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable
  }
}

// Last.fm stats hook to fetch top artists, albums, and tracks
export function useLastFmStats(initialPeriod = '1month') {
  const [period, setPeriod] = useState(initialPeriod);
  const [stats, setStats] = useState(() => getCachedStats(initialPeriod));
  const [isLoading, setIsLoading] = useState(!getCachedStats(initialPeriod));
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (targetPeriod) => {
    const cached = getCachedStats(targetPeriod);
    if (cached) {
      setStats(cached);
      setIsLoading(false);
      return;
    }

    if (!stats) {
      setIsLoading(true);
    }

    try {
      const cacheBuster = Math.floor(Date.now() / 60000);
      const response = await fetch(
        `/.netlify/functions/get-lastfm-stats?period=${targetPeriod}&_=${cacheBuster}`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const freshStats = {
        topArtists: data.topArtists || [],
        topAlbums: data.topAlbums || [],
        topTracks: data.topTracks || [],
        period: data.period,
      };

      setStats(freshStats);
      setCachedStats(targetPeriod, freshStats);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing stats on error
    } finally {
      setIsLoading(false);
    }
  }, [stats]);

  // Fetch when period changes
  useEffect(() => {
    fetchStats(period);
  }, [period]);

  // Refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchStats(period), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    period,
    setPeriod,
    refresh: () => fetchStats(period),
  };
}

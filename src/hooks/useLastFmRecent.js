import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'lastfm-recent-cache';

// Max age for localStorage cache (5 minutes - shorter since recent tracks change more)
const MAX_CACHE_AGE_MS = 5 * 60 * 1000;

// Read cached recent tracks from localStorage
function getCachedRecent() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
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

// Write recent tracks to localStorage
function setCachedRecent(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      cachedAt: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable
  }
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(isoString) {
  if (!isoString) return 'Now playing';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Last.fm recent tracks hook
export function useLastFmRecent(limit = 50) {
  const [data, setData] = useState(() => getCachedRecent());
  const [isLoading, setIsLoading] = useState(!getCachedRecent());
  const [error, setError] = useState(null);

  const fetchRecent = useCallback(async () => {
    if (!data) {
      setIsLoading(true);
    }

    try {
      const cacheBuster = Math.floor(Date.now() / 60000);
      const response = await fetch(
        `/.netlify/functions/get-lastfm-recent?limit=${limit}&_=${cacheBuster}`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const freshData = {
        tracks: responseData.tracks || [],
        nowPlaying: responseData.nowPlaying || null,
        totalScrobbles: responseData.totalScrobbles || 0,
      };

      setData(freshData);
      setCachedRecent(freshData);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [data, limit]);

  // Fetch on mount
  useEffect(() => {
    fetchRecent();
  }, []);

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchRecent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRecent]);

  return {
    tracks: data?.tracks || [],
    nowPlaying: data?.nowPlaying || null,
    totalScrobbles: data?.totalScrobbles || 0,
    isLoading,
    error,
    refresh: fetchRecent,
  };
}

import { useState, useEffect } from 'react';

const CACHE_KEY = 'github-stats-cache';

// Read cached stats from localStorage
function getCachedStats() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

// Write stats to localStorage
function setCachedStats(stats) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...stats,
      cachedAt: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// GitHub stats hook to fetch weekly commit statistics
// Falls back to last cached stats when the API is unreachable
export function useGitHubStats() {
  const [stats, setStats] = useState(() => getCachedStats());
  const [isLoading, setIsLoading] = useState(!getCachedStats());
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!stats) {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/.netlify/functions/get-github-stats');

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // If the API returned an error field, treat as failure
      if (data.error) {
        throw new Error(data.error);
      }

      const freshStats = {
        added: data.added || 0,
        deleted: data.deleted || 0,
        pushCount: data.pushCount || 0,
        weekStart: data.weekStart,
        lastCommitAt: data.lastCommitAt,
        partial: data.partial || false,
      };

      // Only update cache if we got real data (not all zeros from a partial failure)
      if (!data.partial || freshStats.added > 0 || freshStats.deleted > 0) {
        setStats(freshStats);
        setCachedStats(freshStats);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing stats on error (either fresh or cached)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 30 minutes (aligned with edge cache TTL)
    const interval = setInterval(fetchStats, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

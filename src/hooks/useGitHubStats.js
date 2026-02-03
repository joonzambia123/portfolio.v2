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
        throw new Error('Failed to fetch GitHub stats');
      }

      const data = await response.json();

      const freshStats = {
        added: data.added || 0,
        deleted: data.deleted || 0,
        pushCount: data.pushCount || 0,
        weekStart: data.weekStart,
        lastCommitAt: data.lastCommitAt,
      };

      setStats(freshStats);
      setCachedStats(freshStats);
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

    // Refresh every 2 minutes (aligned with edge cache)
    const interval = setInterval(fetchStats, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

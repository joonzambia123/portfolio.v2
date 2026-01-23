import { useState, useEffect } from 'react';

// GitHub stats hook to fetch weekly commit statistics
export function useGitHubStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    // Only show loading on initial fetch
    if (!stats) {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/.netlify/functions/get-github-stats');

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub stats');
      }

      const data = await response.json();

      setStats({
        added: data.added || 0,
        deleted: data.deleted || 0,
        commits: data.commits || 0,
        privateCommits: data.privateCommits || 0,
        repoCount: data.repoCount || 0,
        weekStart: data.weekStart,
        lastCommitAt: data.lastCommitAt,
      });

      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep existing stats on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 15 minutes (aligned with edge cache)
    const interval = setInterval(fetchStats, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

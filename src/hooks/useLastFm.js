import { useState, useEffect } from 'react';

// Last.fm API hook to fetch recently played track
export function useLastFm() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get recently played track from Last.fm
  const getRecentlyPlayed = async () => {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
    const username = import.meta.env.VITE_LASTFM_USERNAME;

    if (!apiKey || !username) {
      setError('Missing Last.fm credentials in environment variables');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from Last.fm');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Last.fm API error');
      }

      if (data.recenttracks && data.recenttracks.track && data.recenttracks.track.length > 0) {
        const track = Array.isArray(data.recenttracks.track) 
          ? data.recenttracks.track[0] 
          : data.recenttracks.track;

        // Get the largest album art available
        const albumArt = track.image?.find(img => img.size === 'extralarge')?.['#text'] ||
                        track.image?.find(img => img.size === 'large')?.['#text'] ||
                        track.image?.find(img => img.size === 'medium')?.['#text'] ||
                        null;

        // Use medium or large for the vinyl (better quality than small)
        const albumArtSmall = track.image?.find(img => img.size === 'large')?.['#text'] ||
                              track.image?.find(img => img.size === 'medium')?.['#text'] ||
                              track.image?.find(img => img.size === 'small')?.['#text'] ||
                              albumArt;

        setCurrentTrack({
          name: track.name,
          artist: track.artist?.['#text'] || track.artist,
          album: track.album?.['#text'] || 'Unknown Album',
          albumArt: albumArt,
          albumArtSmall: albumArtSmall,
          playedAt: track.date?.uts ? new Date(track.date.uts * 1000).toISOString() : null,
          isNowPlaying: track['@attr']?.nowplaying === 'true',
          url: track.url
        });
      }

      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching from Last.fm:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Fetch on mount and set up polling
  useEffect(() => {
    getRecentlyPlayed();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      getRecentlyPlayed();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentTrack,
    isLoading,
    error,
    refresh: getRecentlyPlayed
  };
}

interface LastFmRecentTrack {
  name: string;
  artist: { '#text': string } | { name: string };
  album: { '#text': string };
  image: Array<{ '#text': string; size: string }>;
  url: string;
  date?: { uts: string };
  '@attr'?: { nowplaying: string };
  loved?: string;
}

interface LastFmUserInfo {
  playcount: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function getImageUrl(images: Array<{ '#text': string; size: string }> | undefined, preferredSize = 'large'): string | null {
  if (!images || images.length === 0) return null;
  const sizes = ['extralarge', 'large', 'medium', 'small'];
  const startIndex = sizes.indexOf(preferredSize);
  for (let i = startIndex; i < sizes.length; i++) {
    const img = images.find(img => img.size === sizes[i]);
    if (img?.['#text']) return img['#text'];
  }
  return null;
}

export default async function handler(request: Request) {
  const apiKey = process.env.VITE_LASTFM_API_KEY || process.env.LASTFM_API_KEY;
  const username = process.env.VITE_LASTFM_USERNAME || process.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    return new Response(
      JSON.stringify({ error: "Missing Last.fm config" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  // Parse limit from query string
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  try {
    const baseUrl = `https://ws.audioscrobbler.com/2.0/?api_key=${apiKey}&user=${username}&format=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Fetch recent tracks and user info in parallel
    const [recentRes, userInfoRes] = await Promise.allSettled([
      fetch(`${baseUrl}&method=user.getrecenttracks&limit=${limit}&extended=1`, { signal: controller.signal }),
      fetch(`${baseUrl}&method=user.getinfo`, { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    // Process recent tracks
    let tracks: Array<{
      name: string;
      artist: string;
      album: string;
      image: string | null;
      url: string;
      playedAt: string | null;
      isNowPlaying: boolean;
      loved: boolean;
    }> = [];
    let nowPlaying: typeof tracks[0] | null = null;

    if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
      const data = await recentRes.value.json();
      const recentTracks: LastFmRecentTrack[] = data.recenttracks?.track || [];

      tracks = recentTracks.map(t => {
        const artistName = typeof t.artist === 'object' && '#text' in t.artist
          ? t.artist['#text']
          : (t.artist as { name: string })?.name || 'Unknown Artist';

        const track = {
          name: t.name,
          artist: artistName,
          album: t.album?.['#text'] || 'Unknown Album',
          image: getImageUrl(t.image),
          url: t.url,
          playedAt: t.date?.uts ? new Date(parseInt(t.date.uts, 10) * 1000).toISOString() : null,
          isNowPlaying: t['@attr']?.nowplaying === 'true',
          loved: t.loved === '1',
        };

        if (track.isNowPlaying) {
          nowPlaying = track;
        }

        return track;
      });
    }

    // Get total scrobble count from user info
    let totalScrobbles = 0;
    if (userInfoRes.status === 'fulfilled' && userInfoRes.value.ok) {
      const data = await userInfoRes.value.json();
      const userInfo: LastFmUserInfo = data.user || {};
      totalScrobbles = parseInt(userInfo.playcount, 10) || 0;
    }

    if (tracks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch recent tracks from Last.fm" }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        tracks,
        nowPlaying,
        totalScrobbles,
      }),
      {
        status: 200,
        headers: {
          ...JSON_HEADERS,
          // Cache for 15 min, serve stale for up to 30 min while revalidating
          "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 502, headers: JSON_HEADERS }
    );
  }
}

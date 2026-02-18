interface LastFmArtist {
  name: string;
  playcount: string;
  url: string;
  image: Array<{ '#text': string; size: string }>;
}

interface LastFmAlbum {
  name: string;
  playcount: string;
  url: string;
  artist: { name: string };
  image: Array<{ '#text': string; size: string }>;
}

interface LastFmTrack {
  name: string;
  playcount: string;
  url: string;
  artist: { name: string };
  duration: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const VALID_PERIODS = ['7day', '1month', '3month', '6month', '12month', 'overall'];

function getImageUrl(images: Array<{ '#text': string; size: string }> | undefined, preferredSize = 'extralarge'): string | null {
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

  // Parse period from query string
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '1month';

  if (!VALID_PERIODS.includes(period)) {
    return new Response(
      JSON.stringify({ error: "Invalid period. Use: 7day, 1month, 3month, 6month, 12month, overall" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    const baseUrl = `https://ws.audioscrobbler.com/2.0/?api_key=${apiKey}&user=${username}&format=json&period=${period}`;

    // Fetch all three endpoints in parallel
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const [artistsRes, albumsRes, tracksRes] = await Promise.allSettled([
      fetch(`${baseUrl}&method=user.gettopartists&limit=10`, { signal: controller.signal }),
      fetch(`${baseUrl}&method=user.gettopalbums&limit=10`, { signal: controller.signal }),
      fetch(`${baseUrl}&method=user.gettoptracks&limit=15`, { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    // Process artists
    let topArtists: Array<{ name: string; playcount: number; url: string; image: string | null }> = [];
    if (artistsRes.status === 'fulfilled' && artistsRes.value.ok) {
      const data = await artistsRes.value.json();
      const artists: LastFmArtist[] = data.topartists?.artist || [];
      topArtists = artists.map(a => ({
        name: a.name,
        playcount: parseInt(a.playcount, 10) || 0,
        url: a.url,
        image: getImageUrl(a.image),
      }));
    }

    // Process albums
    let topAlbums: Array<{ name: string; artist: string; playcount: number; url: string; image: string | null }> = [];
    if (albumsRes.status === 'fulfilled' && albumsRes.value.ok) {
      const data = await albumsRes.value.json();
      const albums: LastFmAlbum[] = data.topalbums?.album || [];
      topAlbums = albums.map(a => ({
        name: a.name,
        artist: a.artist?.name || 'Unknown Artist',
        playcount: parseInt(a.playcount, 10) || 0,
        url: a.url,
        image: getImageUrl(a.image),
      }));
    }

    // Process tracks
    let topTracks: Array<{ name: string; artist: string; playcount: number; url: string; duration: number }> = [];
    if (tracksRes.status === 'fulfilled' && tracksRes.value.ok) {
      const data = await tracksRes.value.json();
      const tracks: LastFmTrack[] = data.toptracks?.track || [];
      topTracks = tracks.map(t => ({
        name: t.name,
        artist: t.artist?.name || 'Unknown Artist',
        playcount: parseInt(t.playcount, 10) || 0,
        url: t.url,
        duration: parseInt(t.duration, 10) || 0,
      }));
    }

    // Check if we got partial data
    const isPartial = topArtists.length === 0 && topAlbums.length === 0 && topTracks.length === 0;

    if (isPartial) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from Last.fm" }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        topArtists,
        topAlbums,
        topTracks,
        period,
      }),
      {
        status: 200,
        headers: {
          ...JSON_HEADERS,
          // Cache for 1 hour, serve stale for up to 2 hours while revalidating
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
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

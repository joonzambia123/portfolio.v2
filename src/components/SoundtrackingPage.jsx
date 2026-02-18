import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLastFmStats } from '../hooks/useLastFmStats'
import { useLastFmRecent, formatRelativeTime } from '../hooks/useLastFmRecent'

const PERIODS = [
  { value: '7day', label: '7 days' },
  { value: '1month', label: '30 days' },
  { value: '3month', label: '3 months' },
  { value: '6month', label: '6 months' },
  { value: '12month', label: '12 months' },
  { value: 'overall', label: 'All time' },
]

// Period selector tabs
const PeriodTabs = ({ value, onChange }) => (
  <div className="flex gap-[6px] flex-wrap">
    {PERIODS.map(({ value: v, label }) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className="font-graphik text-[12px] px-[10px] py-[5px] rounded-[8px] transition-all duration-150"
        style={{
          color: value === v ? '#1a1a1a' : '#888',
          background: value === v
            ? 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
            : 'transparent',
          border: value === v ? '1px solid rgba(235, 238, 245, 0.85)' : '1px solid transparent',
          boxShadow: value === v
            ? '0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02)'
            : 'none',
        }}
      >
        {label}
      </button>
    ))}
  </div>
)

// Placeholder for missing album art
const AlbumArtPlaceholder = ({ size = 48 }) => (
  <div
    className="flex items-center justify-center rounded-[6px]"
    style={{
      width: size,
      height: size,
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    }}
  >
    <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V5l12-2v13"
        stroke="#ccc"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="3" stroke="#ccc" strokeWidth="1.5" />
      <circle cx="18" cy="16" r="3" stroke="#ccc" strokeWidth="1.5" />
    </svg>
  </div>
)

// Top Artists section
const TopArtists = ({ artists, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-[12px]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-[12px] animate-pulse">
            <div className="w-[20px] text-[12px] text-[#ccc]">{i + 1}</div>
            <div className="w-[48px] h-[48px] rounded-[6px] bg-[#f0f0f0]" />
            <div className="flex-1">
              <div className="h-[14px] w-[120px] bg-[#f0f0f0] rounded mb-[4px]" />
              <div className="h-[12px] w-[60px] bg-[#f5f5f5] rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!artists || artists.length === 0) {
    return <p className="text-[#888] text-[14px]">No data available</p>
  }

  const maxPlaycount = artists[0]?.playcount || 1

  return (
    <div className="space-y-[10px]">
      {artists.map((artist, i) => (
        <a
          key={artist.name}
          href={artist.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[12px] group"
        >
          <div className="w-[20px] text-[12px] text-[#999] font-graphik">{i + 1}</div>
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="w-[48px] h-[48px] rounded-[6px] object-cover"
            />
          ) : (
            <AlbumArtPlaceholder size={48} />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-graphik text-[14px] text-[#1a1a1a] truncate group-hover:text-[#2480ED] transition-colors">
              {artist.name}
            </p>
            <div className="flex items-center gap-[8px] mt-[4px]">
              <div
                className="h-[4px] rounded-full"
                style={{
                  width: `${(artist.playcount / maxPlaycount) * 100}%`,
                  minWidth: '20px',
                  maxWidth: '120px',
                  background: 'linear-gradient(90deg, #e8e8e8 0%, #d8d8d8 100%)',
                }}
              />
              <span className="text-[11px] text-[#999] font-graphik whitespace-nowrap">
                {artist.playcount.toLocaleString()} plays
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// Top Albums section
const TopAlbums = ({ albums, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[12px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-[8px] bg-[#f0f0f0] mb-[8px]" />
            <div className="h-[14px] w-[80%] bg-[#f0f0f0] rounded mb-[4px]" />
            <div className="h-[12px] w-[60%] bg-[#f5f5f5] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!albums || albums.length === 0) {
    return <p className="text-[#888] text-[14px]">No data available</p>
  }

  return (
    <div className="grid grid-cols-2 gap-[12px]">
      {albums.slice(0, 6).map((album) => (
        <a
          key={`${album.artist}-${album.name}`}
          href={album.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          {album.image ? (
            <img
              src={album.image}
              alt={album.name}
              className="w-full aspect-square rounded-[8px] object-cover mb-[8px] group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full aspect-square mb-[8px]">
              <AlbumArtPlaceholder size="100%" />
            </div>
          )}
          <p className="font-graphik text-[13px] text-[#1a1a1a] truncate group-hover:text-[#2480ED] transition-colors">
            {album.name}
          </p>
          <p className="font-graphik text-[12px] text-[#888] truncate">
            {album.artist}
          </p>
          <p className="font-graphik text-[11px] text-[#999] mt-[2px]">
            {album.playcount.toLocaleString()} plays
          </p>
        </a>
      ))}
    </div>
  )
}

// Top Tracks section
const TopTracks = ({ tracks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-[8px]">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-[12px] animate-pulse py-[6px]">
            <div className="w-[20px] text-[12px] text-[#ccc]">{i + 1}</div>
            <div className="flex-1">
              <div className="h-[14px] w-[150px] bg-[#f0f0f0] rounded mb-[4px]" />
              <div className="h-[12px] w-[100px] bg-[#f5f5f5] rounded" />
            </div>
            <div className="h-[12px] w-[50px] bg-[#f5f5f5] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!tracks || tracks.length === 0) {
    return <p className="text-[#888] text-[14px]">No data available</p>
  }

  return (
    <div className="space-y-[2px]">
      {tracks.map((track, i) => (
        <a
          key={`${track.artist}-${track.name}`}
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[12px] py-[8px] px-[8px] -mx-[8px] rounded-[8px] group hover:bg-[#fafafa] transition-colors"
        >
          <div className="w-[20px] text-[12px] text-[#999] font-graphik">{i + 1}</div>
          <div className="flex-1 min-w-0">
            <p className="font-graphik text-[14px] text-[#1a1a1a] truncate group-hover:text-[#2480ED] transition-colors">
              {track.name}
            </p>
            <p className="font-graphik text-[12px] text-[#888] truncate">
              {track.artist}
            </p>
          </div>
          <span className="text-[12px] text-[#999] font-graphik whitespace-nowrap">
            {track.playcount.toLocaleString()}
          </span>
        </a>
      ))}
    </div>
  )
}

// Recent Tracks section
const RecentTracks = ({ tracks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-[8px]">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-[12px] animate-pulse py-[6px]">
            <div className="w-[40px] h-[40px] rounded-[6px] bg-[#f0f0f0]" />
            <div className="flex-1">
              <div className="h-[14px] w-[140px] bg-[#f0f0f0] rounded mb-[4px]" />
              <div className="h-[12px] w-[100px] bg-[#f5f5f5] rounded" />
            </div>
            <div className="h-[12px] w-[40px] bg-[#f5f5f5] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!tracks || tracks.length === 0) {
    return <p className="text-[#888] text-[14px]">No recent tracks</p>
  }

  return (
    <div className="space-y-[2px]">
      {tracks.map((track, i) => (
        <a
          key={`${track.playedAt || 'now'}-${track.name}-${i}`}
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[12px] py-[8px] px-[8px] -mx-[8px] rounded-[8px] group hover:bg-[#fafafa] transition-colors"
        >
          {track.image ? (
            <img
              src={track.image}
              alt={track.album}
              className="w-[40px] h-[40px] rounded-[6px] object-cover"
            />
          ) : (
            <AlbumArtPlaceholder size={40} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[6px]">
              <p className="font-graphik text-[14px] text-[#1a1a1a] truncate group-hover:text-[#2480ED] transition-colors">
                {track.name}
              </p>
              {track.isNowPlaying && (
                <span className="flex items-center gap-[4px] text-[10px] text-[#22c55e] font-graphik uppercase tracking-wide">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="font-graphik text-[12px] text-[#888] truncate">
              {track.artist}
            </p>
          </div>
          <span className="text-[11px] text-[#999] font-graphik whitespace-nowrap">
            {formatRelativeTime(track.playedAt)}
          </span>
        </a>
      ))}
    </div>
  )
}

// Main page component
export default function SoundtrackingPage({ isVisible = true }) {
  const { stats, isLoading: statsLoading, period, setPeriod } = useLastFmStats('1month')
  const { tracks: recentTracks, totalScrobbles, isLoading: recentLoading } = useLastFmRecent()
  const [hasBeenSeen, setHasBeenSeen] = useState(false)

  useEffect(() => {
    if (isVisible && !hasBeenSeen) {
      setHasBeenSeen(true)
    }
  }, [isVisible, hasBeenSeen])

  return (
    <div
      className="w-full min-h-screen pt-[100px] pb-[80px] px-[24px]"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: hasBeenSeen ? 'none' : 'opacity 400ms ease',
      }}
    >
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-[40px]">
          <div className="flex items-center gap-[12px] mb-[8px]">
            <Link
              to="/"
              className="font-graphik text-[14px] text-[#888] hover:text-[#5b5b5e] transition-colors"
            >
              Home
            </Link>
            <span className="text-[#ccc]">/</span>
            <span className="font-graphik text-[14px] text-[#1a1a1a]">Soundtracking</span>
          </div>
          <h1
            className="text-[28px] text-[#1a1a1a] mb-[8px]"
            style={{ fontFamily: "'Calluna', Georgia, serif" }}
          >
            Soundtracking
          </h1>
          <p className="font-graphik text-[14px] text-[#888] leading-[22px]">
            What I've been listening to, tracked via{' '}
            <a
              href="https://www.last.fm/user/joonzambia123"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2480ED]"
              style={{ textDecoration: 'underline dotted', textDecorationThickness: '2px', textUnderlineOffset: '3px' }}
            >
              Last.fm
            </a>
            .{' '}
            {totalScrobbles > 0 && (
              <span className="text-[#5b5b5e]">
                {totalScrobbles.toLocaleString()} scrobbles and counting.
              </span>
            )}
          </p>
        </div>

        {/* Period filter */}
        <div className="mb-[32px]">
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px] mb-[48px]">
          {/* Top Artists */}
          <div>
            <h2 className="font-graphik text-[11px] text-[#888] uppercase tracking-wide mb-[16px]">
              Top Artists
            </h2>
            <TopArtists artists={stats?.topArtists} isLoading={statsLoading} />
          </div>

          {/* Top Albums */}
          <div>
            <h2 className="font-graphik text-[11px] text-[#888] uppercase tracking-wide mb-[16px]">
              Top Albums
            </h2>
            <TopAlbums albums={stats?.topAlbums} isLoading={statsLoading} />
          </div>
        </div>

        {/* Top Tracks */}
        <div className="mb-[48px]">
          <h2 className="font-graphik text-[11px] text-[#888] uppercase tracking-wide mb-[16px]">
            Top Tracks
          </h2>
          <TopTracks tracks={stats?.topTracks} isLoading={statsLoading} />
        </div>

        {/* Recent Listening History */}
        <div>
          <h2 className="font-graphik text-[11px] text-[#888] uppercase tracking-wide mb-[16px]">
            Recent Listening
          </h2>
          <RecentTracks tracks={recentTracks} isLoading={recentLoading} />
        </div>
      </div>
    </div>
  )
}

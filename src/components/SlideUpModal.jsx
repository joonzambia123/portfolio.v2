import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

const SlideUpModal = ({ isOpen, onClose, type, anchorRef, children }) => {
  const [position, setPosition] = useState({ left: 0 });
  const popoverRef = useRef(null);

  // Calculate position based on anchor button
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      setPosition({ left: buttonCenterX });
    }
  }, [isOpen, anchorRef, type]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        const bottomPill = e.target.closest('.bottom-pill-container');
        if (!bottomPill) {
          onClose();
        }
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Get modal title based on type
  const getTitle = () => {
    switch (type) {
      case 'music': return 'Now Playing';
      case 'activity': return 'Activity';
      case 'shortcuts': return 'Keyboard Shortcuts';
      case 'contact': return 'Get in Touch';
      default: return '';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={popoverRef}
          key={type}
          className="fixed z-[200]"
          style={{
            bottom: 'calc(50px + 64px + 10px)',
            left: position.left,
            x: '-50%'
          }}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
        >
          <div className="bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden border border-black/[0.04]">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-black/[0.06]">
              <div className="flex items-center justify-between gap-8">
                <h2 className="font-graphik text-[15px] font-medium text-[#1a1a1a]">
                  {getTitle()}
                </h2>
                <button
                  onClick={onClose}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3L9 9" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Music modal with current track and recent tracks list
export const MusicModalContent = ({ currentTrack }) => {
  // Placeholder recent tracks for testing (will be replaced with real API data)
  const recentTracks = [
    { name: 'Born Slippy .NUXX', artist: 'Underworld', albumArt: null, isNowPlaying: true },
    { name: 'Windowlicker', artist: 'Aphex Twin', albumArt: null },
    { name: 'Around the World', artist: 'Daft Punk', albumArt: null },
    { name: 'Teardrop', artist: 'Massive Attack', albumArt: null },
    { name: 'Glory Box', artist: 'Portishead', albumArt: null },
    { name: 'Unfinished Sympathy', artist: 'Massive Attack', albumArt: null },
    { name: 'Bittersweet Symphony', artist: 'The Verve', albumArt: null },
    { name: 'Karma Police', artist: 'Radiohead', albumArt: null },
    { name: 'Paranoid Android', artist: 'Radiohead', albumArt: null },
    { name: 'Everything In Its Right Place', artist: 'Radiohead', albumArt: null },
  ];

  // Use current track if available, otherwise use first placeholder
  const nowPlaying = currentTrack || recentTracks[0];

  return (
    <div className="w-[340px]">
      {/* Now Playing Section */}
      <div className="flex items-center gap-4 p-4 rounded-[12px] bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] border border-black/[0.04] mb-4">
        {/* Album Art */}
        <div className="w-16 h-16 rounded-[8px] bg-gradient-to-br from-[#e0e0e0] to-[#d0d0d0] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          {nowPlaying.albumArt || nowPlaying.albumArtSmall ? (
            <img
              src={nowPlaying.albumArt || nowPlaying.albumArtSmall}
              alt={nowPlaying.album || nowPlaying.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="#bbb" strokeWidth="1.5"/>
              <circle cx="18" cy="16" r="3" stroke="#bbb" strokeWidth="1.5"/>
            </svg>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {nowPlaying.isNowPlaying && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"/>
                <span className="font-graphik text-[11px] text-[#22c55e] uppercase tracking-wide">Live</span>
              </div>
            )}
          </div>
          <p className="font-graphik text-[15px] text-[#1a1a1a] font-medium truncate">{nowPlaying.name}</p>
          <p className="font-graphik text-[13px] text-[#888] truncate">{nowPlaying.artist}</p>
        </div>
      </div>

      {/* Recent Tracks List */}
      <div className="space-y-1">
        <p className="font-graphik text-[11px] text-[#999] uppercase tracking-wide px-1 mb-2">Recently Played</p>
        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ddd transparent' }}>
          {recentTracks.slice(1).map((track, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-[#f5f5f5] transition-colors cursor-pointer group"
            >
              {/* Small album art */}
              <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-[#e8e8e8] to-[#ddd] flex items-center justify-center overflow-hidden flex-shrink-0">
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.name} className="w-full h-full object-cover"/>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18V5l12-2v13" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="#ccc" strokeWidth="1.5"/>
                    <circle cx="18" cy="16" r="3" stroke="#ccc" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-graphik text-[13px] text-[#1a1a1a] truncate group-hover:text-[#0066cc] transition-colors">{track.name}</p>
                <p className="font-graphik text-[11px] text-[#999] truncate">{track.artist}</p>
              </div>

              {/* Play indicator on hover */}
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last.fm link */}
      <a
        href="https://www.last.fm/user/joonzambia123"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-black/[0.04] font-graphik text-[12px] text-[#999] hover:text-[#666] transition-colors"
      >
        <span>View on Last.fm</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  );
};

export const ActivityModalContent = () => (
  <div className="w-[340px] space-y-4">
    {/* Code changes widget */}
    <div className="p-4 rounded-[12px] bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] border border-black/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-graphik text-[11px] text-[#999] uppercase tracking-wide">This Week</span>
        <span className="font-graphik text-[11px] text-[#ccc]">Refreshes daily</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-graphik text-[22px] font-medium text-[#22c55e]">+1,247</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-graphik text-[22px] font-medium text-[#ef4444]">-389</span>
        </div>
      </div>
      <p className="font-graphik text-[12px] text-[#888] mt-2">lines changed across 23 commits</p>
    </div>

    {/* Activity items */}
    <div className="space-y-2">
      {[
        { action: 'Updated', item: 'Homepage hero section', time: '2 hours ago', icon: '✏️' },
        { action: 'Deployed', item: 'Portfolio v2.3', time: '5 hours ago', icon: '🚀' },
        { action: 'Committed', item: 'Video optimization fixes', time: '1 day ago', icon: '📝' },
        { action: 'Designed', item: 'New modal components', time: '2 days ago', icon: '🎨' },
      ].map((activity, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors">
          <div className="w-8 h-8 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-sm">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-graphik text-[13px] text-[#1a1a1a]">
              <span className="text-[#888]">{activity.action}</span> {activity.item}
            </p>
            <p className="font-graphik text-[11px] text-[#999] mt-0.5">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>

    {/* View all link */}
    <button className="w-full py-2.5 rounded-[8px] bg-[#f5f5f5] hover:bg-[#eee] transition-colors font-graphik text-[13px] text-[#666]">
      View all activity
    </button>
  </div>
);

export const ShortcutsModalContent = ({ isMac }) => (
  <div className="w-[300px] space-y-2">
    {[
      { keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'], action: 'Quick actions' },
      { keys: isMac ? ['⌘', '/'] : ['Ctrl', '/'], action: 'Search' },
      { keys: ['←', '→'], action: 'Navigate videos' },
      { keys: ['Space'], action: 'Play/Pause music' },
      { keys: ['Esc'], action: 'Close modal' },
      { keys: isMac ? ['⌘', 'D'] : ['Ctrl', 'D'], action: 'Toggle dark mode' },
    ].map((shortcut, i) => (
      <div key={i} className="flex items-center justify-between py-2 px-1">
        <span className="font-graphik text-[13px] text-[#666]">{shortcut.action}</span>
        <div className="flex gap-1">
          {shortcut.keys.map((key, j) => (
            <kbd
              key={j}
              className="min-w-[24px] h-6 px-1.5 rounded-[5px] bg-[#f0f0f0] border border-[#ddd] border-b-2 font-graphik text-[11px] text-[#555] flex items-center justify-center"
            >
              {key}
            </kbd>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ContactModalContent = () => (
  <div className="w-[320px] space-y-4">
    {/* Contact methods */}
    <div className="space-y-2">
      {[
        { label: 'Email', value: 'hello@joonseo.com', icon: '✉️', href: 'mailto:hello@joonseo.com' },
        { label: 'Twitter', value: '@joonseo', icon: '𝕏', href: 'https://twitter.com/joonseo' },
        { label: 'LinkedIn', value: 'in/joonseo', icon: '💼', href: 'https://linkedin.com/in/joonseo' },
        { label: 'GitHub', value: 'joonseo', icon: '🐙', href: 'https://github.com/joonseo' },
      ].map((contact, i) => (
        <a
          key={i}
          href={contact.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-[10px] bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-sm">
            {contact.icon}
          </div>
          <div className="flex-1">
            <p className="font-graphik text-[11px] text-[#999] uppercase tracking-wide">{contact.label}</p>
            <p className="font-graphik text-[13px] text-[#1a1a1a] group-hover:text-[#0066cc] transition-colors">{contact.value}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#ccc] group-hover:text-[#999] transition-colors">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      ))}
    </div>

    {/* Availability status */}
    <div className="p-3 rounded-[10px] bg-[#f0fdf4] border border-[#bbf7d0]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"/>
        <p className="font-graphik text-[13px] text-[#166534]">Available for new projects</p>
      </div>
    </div>
  </div>
);

export default SlideUpModal;

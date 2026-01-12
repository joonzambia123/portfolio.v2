import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useSounds } from '../hooks/useSounds';

const SlideUpModal = ({ isOpen, onClose, type, anchorRef, darkMode = false, children }) => {
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

  // Contact modal has a different design (no header)
  const isContactModal = type === 'contact';

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
          initial={{ opacity: 0, y: 32, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(2px)' }}
          transition={{
            type: 'tween',
            duration: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {isContactModal ? (
            // Contact modal - skeuomorphic design
            <div className="contact-modal-outer rounded-[18px] flex justify-center">
              {children}
            </div>
          ) : (
            // Default modal with header
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
          )}
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

export const ContactModalContent = ({ darkMode = false }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { playHover, playClick } = useSounds();

  const handleCopyEmail = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText('changjoonseo126@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const contactItems = [
    {
      title: 'Email',
      description: 'changjoonseo126@gmail.com',
      buttonText: copiedEmail ? 'Copied!' : 'Copy',
      onClick: handleCopyEmail,
    },
    {
      title: 'Instagram',
      description: 'Most active here',
      buttonText: 'DM me',
      href: 'https://instagram.com/joonzambia',
    },
    {
      title: 'LinkedIn',
      description: 'Attempting to be an adult',
      buttonText: 'Connect',
      href: 'https://linkedin.com/in/joonseo-chang',
    },
    {
      title: 'Twitter',
      description: 'Peer pressure is real kids',
      buttonText: 'Chirp',
      href: 'https://twitter.com/joonzambia',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Inner card with contact rows - skeuomorphic white card */}
      <div className="contact-modal-inner w-[306px] py-[15px] flex flex-col items-center gap-[10px]">
        {contactItems.map((item, index) => (
          <div key={item.title} className="contents">
            {/* Contact row */}
            <div className="w-full flex items-center justify-between px-[12px]">
              <div className="flex flex-col">
                <span className="font-graphik text-[14px] leading-[25px] text-[#333333]">
                  {item.title}
                </span>
                <span className="font-graphik text-[14px] leading-[25px] text-[#B7B7B9]">
                  {item.description}
                </span>
              </div>
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  onMouseEnter={playHover}
                  className="contact-button px-[10px] py-[4px] rounded-[8px] flex items-center justify-center"
                >
                  <span className="font-graphik text-[14px] leading-[25px] text-[#5B5B5E]">
                    {item.buttonText}
                  </span>
                </button>
              ) : (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playClick}
                  onMouseEnter={playHover}
                  className="contact-button px-[10px] py-[4px] rounded-[8px] flex items-center justify-center"
                >
                  <span className="font-graphik text-[14px] leading-[25px] text-[#5B5B5E]">
                    {item.buttonText}
                  </span>
                </a>
              )}
            </div>
            {/* Divider (not after last item) */}
            {index < contactItems.length - 1 && (
              <div className="w-full h-[1px] bg-[#EBEEF5]" />
            )}
          </div>
        ))}
      </div>

      {/* Footer text - sits on grey background */}
      <div className="flex items-center justify-center gap-[5px] py-[10px]">
        <span className="font-graphik text-[14px] leading-[25px] text-[#B3B3B3]">
          or send me a wuphf
        </span>
        {/* Dog icon - 14x14 */}
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4H2V6H3V4ZM3 4H4V2H7V4H8V2H9V1H2V2H3V4ZM5 12H6V11H5V12ZM1 9H2V6H1V3H0V7H1V9ZM4 11H5V10H6V11H7V10H9V9H6V8H5V9H2V10H4V11ZM4 7H5V5H4V7ZM1 3H2V2H1V3ZM6 7H7V5H6V7ZM8 6H9V4H8V6ZM9 9H10V7H11V3H10V6H9V9ZM9 3H10V2H9V3Z" fill="#B3B3B3"/>
        </svg>
      </div>
    </div>
  );
};

export default SlideUpModal;

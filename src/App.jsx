import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLastFm } from './hooks/useLastFm'
import { useGitHubStats } from './hooks/useGitHubStats'
import { useSounds } from './hooks/useSounds'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useAmbientData } from './hooks/useAmbientData'
import { Agentation } from 'agentation'
import About from './components/About/About'

// Lazy load modal components to defer Framer Motion loading
const SlideUpModal = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.default })))
const MusicModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.MusicModalContent })))
const ActivityModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ActivityModalContent })))
const ShortcutsModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ShortcutsModalContent })))
const ContactModalContent = lazy(() => import('./components/SlideUpModal').then(mod => ({ default: mod.ContactModalContent })))

// Preload modal components on hover for instant open
const preloadModalComponents = () => {
  import('./components/SlideUpModal');
};

// Marquee text component - circular scroll (one loop) with subtle fade hint
// delay prop adds additional wait time before first scroll (for staggering multiple marquees)
const MarqueeText = ({ children, className, style, maxWidth, delay = 0 }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const animationRef = useRef(null);

  const GAP = 50; // Gap between text instances
  const SCROLL_SPEED = 35; // Uniform scroll speed in pixels per second

  // Check if text overflows container
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const width = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setTextWidth(width);
        setIsOverflowing(width > containerWidth);
      }
    };

    checkOverflow();
    const timeout = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timeout);
  }, [children, maxWidth]);

  // Circular scroll: wait 8s initially (+ delay), scroll at uniform speed, then wait 16s AFTER animation ends, repeat
  useEffect(() => {
    if (!isOverflowing || !textWidth) {
      setScrollOffset(0);
      return;
    }

    const loopDistance = textWidth + GAP; // One full loop
    const scrollDuration = (loopDistance / SCROLL_SPEED) * 1000; // Duration based on uniform speed
    const initialWait = 8000 + delay; // First scroll after 8 seconds + any additional delay
    const pauseAfterScroll = 16000 + delay; // Keep same delay offset in subsequent cycles
    const cycleTime = scrollDuration + pauseAfterScroll; // Total cycle

    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const totalElapsed = timestamp - startTime;

      // Calculate where we are in the cycle
      let cycleElapsed;
      let currentWait;

      if (totalElapsed < initialWait + scrollDuration) {
        // First cycle
        cycleElapsed = totalElapsed;
        currentWait = initialWait;
      } else {
        // Subsequent cycles - pause happens AFTER the scroll
        const afterFirst = totalElapsed - initialWait - scrollDuration;
        cycleElapsed = afterFirst % cycleTime;
        currentWait = pauseAfterScroll; // Wait time AFTER scroll completes
      }

      if (cycleElapsed < currentWait) {
        // Waiting phase
        setScrollOffset(0);
        setIsScrolling(false);
      } else if (cycleElapsed < currentWait + scrollDuration) {
        // Scrolling phase
        setIsScrolling(true);
        const scrollProgress = (cycleElapsed - currentWait) / scrollDuration;
        setScrollOffset(-loopDistance * scrollProgress);
      } else {
        // Completed loop
        setScrollOffset(0);
        setIsScrolling(false);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOverflowing, textWidth, delay]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        maxWidth,
        overflow: 'hidden',
        position: 'relative',
        // CSS mask - subtle right fade only (no left fade)
        maskImage: isOverflowing
          ? 'linear-gradient(to right, black 0%, black 82%, rgba(0,0,0,0.4) 94%, rgba(0,0,0,0) 100%)'
          : 'none',
        WebkitMaskImage: isOverflowing
          ? 'linear-gradient(to right, black 0%, black 82%, rgba(0,0,0,0.4) 94%, rgba(0,0,0,0) 100%)'
          : 'none'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          transform: `translateX(${scrollOffset}px)`,
          willChange: isOverflowing ? 'transform' : 'auto'
        }}
      >
        <span ref={textRef}>{children}</span>
        {/* Duplicate for seamless circular loop */}
        {isOverflowing && (
          <span style={{ marginLeft: GAP }}>{children}</span>
        )}
      </div>
    </div>
  );
};

// Image URLs from Figma (valid for 7 days)
const imgRectangle316 = "https://www.figma.com/api/mcp/asset/8d33530d-0256-40f5-be5d-e642c6a86c84";
const imgFrame223 = "https://www.figma.com/api/mcp/asset/30286a38-278c-48f0-9f18-06d88761b814";
const imgLine5 = "https://www.figma.com/api/mcp/asset/e24604e5-5571-4d0f-ab1d-aed70112aa6f";
const imgGroup = "https://www.figma.com/api/mcp/asset/61c7aa82-f3ce-422a-beda-513c99c4bdb8";

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [clockTimeString, setClockTimeString] = useState('');
  const [clockTime, setClockTime] = useState({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const [isClockExpanded, setIsClockExpanded] = useState(false);
  const clockCardRef = useRef(null);

  // Loader state - shows coordinates while videos preload
  const [isLoading, setIsLoading] = useState(true);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [coordFading, setCoordFading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(''); // Encouraging messages after 5 seconds
  const videoCacheRef = useRef(new Map()); // Map<videoSrc, blobUrl> for instant playback
  const adjacentVideosReadyRef = useRef(0); // Track how many adjacent videos are ready during loader
  const fontsLoadedRef = useRef(false); // Track if fonts are loaded
  const [fontsReady, setFontsReady] = useState(false); // State to trigger re-render when fonts load
  const loaderMinTimeRef = useRef(false); // Minimum loader display time

  // Responsive breakpoints
  const isTabletOrBelow = useMediaQuery('(max-width: 813px)');
  const isMobileBreakpoint = useMediaQuery('(max-width: 480px)');

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e) => {
      // Ignore clicks on the hamburger button itself (it has its own toggle handler)
      if (e.target.closest('.mobile-hamburger')) return;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Search input state
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Face emoticon animation state
  const [faceExpression, setFaceExpression] = useState('(=_=)');
  const [faceTransform, setFaceTransform] = useState({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });
  const [isMouseNearFace, setIsMouseNearFace] = useState(false);
  const [isHomeButtonHovered, setIsHomeButtonHovered] = useState(false);
  const [isFaceClicked, setIsFaceClicked] = useState(false);
  const [isFaceHoverExiting, setIsFaceHoverExiting] = useState(false);
  const [isSleepingTime, setIsSleepingTime] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Nav background on scroll

  // Check if scrolled for nav background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if it's sleeping time (10PM - 6AM local time)
  useEffect(() => {
    const checkSleepingTime = () => {
      const hour = new Date().getHours();
      setIsSleepingTime(hour >= 22 || hour < 6);
    };
    checkSleepingTime();
    const interval = setInterval(checkSleepingTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Global mouseup to handle releasing click outside button
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsFaceClicked(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);
  const [isCommitExpanded, setIsCommitExpanded] = useState(false);
  const faceHoverTimeoutRef = useRef(null);
  const faceZoneRef = useRef(null);
  const faceIconRef = useRef(null);

  // Mouse tracking handler for frightened face
  const handleFaceZoneMouseMove = useCallback((e) => {
    if (!isMouseNearFace || !faceIconRef.current) return;

    const faceRect = faceIconRef.current.getBoundingClientRect();
    const faceCenter = {
      x: faceRect.left + faceRect.width / 2,
      y: faceRect.top + faceRect.height / 2,
    };

    // Calculate direction from face to mouse
    const dx = e.clientX - faceCenter.x;
    const dy = e.clientY - faceCenter.y;

    // Clamp eye movement to subtle range
    const eyeX = Math.max(-2, Math.min(2, dx / 50));
    const eyeY = Math.max(-1, Math.min(1, dy / 80));

    setFaceTransform(prev => ({
      ...prev,
      translateX: eyeX,
      translateY: eyeY,
    }));
  }, [isMouseNearFace]);

  // Face animation - blinks, yawns, and looking around
  useEffect(() => {
    // Wait until site is fully loaded before starting animations
    if (isLoading) return;

    // When hovering or clicked, show happy expression (even during sleep time)
    if (isHomeButtonHovered || isFaceClicked) {
      setFaceExpression('(^_^)');

      // Rare blinks - every 3-5 seconds
      const happyInterval = setInterval(() => {
        setFaceExpression('(^‿^)');
        setTimeout(() => setFaceExpression('(^_^)'), 150);
      }, 3000 + Math.random() * 2000);

      return () => clearInterval(happyInterval);
    }

    // When mouse is near face (but not hovering button), show startled expression
    if (isMouseNearFace) {
      setFaceExpression(isSleepingTime ? '(o_o)' : '(O_O)');
      return;
    }

    // Sleeping state (10PM - 6AM)
    if (isSleepingTime) {
      setFaceExpression('(-_-)');
      setFaceTransform({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });
      return;
    }

    // Reset to default when mouse leaves
    setFaceExpression('(=_=)');
    setFaceTransform({ scaleY: 1, scaleX: 1, translateX: 0, translateY: 0 });

    const expressions = {
      default: '(=_=)',
      blink: '(-_-)',
      content: '(=‿=)',
    };

    let blinkTimeout;
    let yawnTimeout;
    let lookTimeout;
    let contentTimeout;
    let isYawning = false;
    let isLooking = false;
    let isAnimating = false; // Prevent overlapping animations
    let lastAnimationEnd = 0; // Track when last animation ended
    let isFirstYawn = true; // Track if this is the first yawn

    const MIN_GAP = 1500; // Minimum 1.5s between different animations

    const canAnimate = () => {
      if (isAnimating || isYawning || isLooking) return false;
      if (Date.now() - lastAnimationEnd < MIN_GAP) return false;
      return true;
    };

    const blink = () => {
      if (!canAnimate()) {
        blinkTimeout = setTimeout(blink, 1000);
        return;
      }

      isAnimating = true;

      // Variety of blink types
      const blinkType = Math.random();

      if (blinkType < 0.15) {
        // Slow sleepy blink (15% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.97 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 300);
      } else if (blinkType < 0.25) {
        // Double blink (10% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
        }, 100);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
          setFaceExpression(expressions.blink);
        }, 250);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 350);
      } else {
        // Regular blink (75% chance)
        setFaceTransform(prev => ({ ...prev, scaleY: 0.96 }));
        setFaceExpression(expressions.blink);
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, scaleY: 1 }));
          setFaceExpression(expressions.default);
          isAnimating = false;
          lastAnimationEnd = Date.now();
        }, 120);
      }

      // Next blink in 3-6 seconds
      blinkTimeout = setTimeout(blink, 3000 + Math.random() * 3000);
    };

    // Separate content smile - rare and independent
    const showContent = () => {
      if (!canAnimate()) {
        contentTimeout = setTimeout(showContent, 5000);
        return;
      }

      isAnimating = true;
      setFaceExpression(expressions.content);
      setTimeout(() => {
        setFaceExpression(expressions.default);
        isAnimating = false;
        lastAnimationEnd = Date.now();
      }, 1000);

      // Next content in 25-40 seconds (rare)
      contentTimeout = setTimeout(showContent, 25000 + Math.random() * 15000);
    };

    const yawn = () => {
      if (isLooking || isAnimating) {
        yawnTimeout = setTimeout(yawn, 2000);
        return;
      }
      isYawning = true;
      isAnimating = true;
      // Start stretching - head rises up, slight stretch
      setFaceTransform(prev => ({ ...prev, scaleY: 1.02, scaleX: 0.99, translateY: -1 }));
      setTimeout(() => {
        setFaceExpression('(=.=)'); // Mouth slightly open
        setFaceTransform(prev => ({ ...prev, scaleY: 1.03, scaleX: 0.98, translateY: -1.5 }));
      }, 250);
      // Mouth opening more - head rises higher
      setTimeout(() => {
        setFaceExpression('(=0=)'); // Mouth more open
        setFaceTransform(prev => ({ ...prev, scaleY: 1.05, scaleX: 0.97, translateY: -2 }));
      }, 500);
      // Full yawn - peak rise
      setTimeout(() => {
        setFaceExpression('(=O=)'); // Full yawn
        setFaceTransform(prev => ({ ...prev, scaleY: 1.06, scaleX: 0.96, translateY: -2.5 }));
      }, 750);
      // Hold the yawn at peak
      setTimeout(() => {
        setFaceTransform(prev => ({ ...prev, scaleY: 1.05, scaleX: 0.97, translateY: -2 }));
      }, 1100);
      // Start closing mouth - head lowers
      setTimeout(() => {
        setFaceExpression('(=0=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.03, scaleX: 0.98, translateY: -1.5 }));
      }, 1400);
      // Mouth almost closed
      setTimeout(() => {
        setFaceExpression('(=.=)');
        setFaceTransform(prev => ({ ...prev, scaleY: 1.01, scaleX: 0.99, translateY: -0.5 }));
      }, 1650);
      // Back to sleepy - slight settle
      setTimeout(() => {
        setFaceExpression(expressions.default);
        setFaceTransform(prev => ({ ...prev, scaleY: 0.99, scaleX: 1.01, translateY: 0.5 }));
      }, 1900);
      // Settle to normal
      setTimeout(() => {
        setFaceTransform(prev => ({ ...prev, scaleY: 1, scaleX: 1, translateY: 0 }));
        isYawning = false;
        isAnimating = false;
        lastAnimationEnd = Date.now();
      }, 2100);
      // Next yawn in 20-35 seconds (after first yawn)
      isFirstYawn = false;
      yawnTimeout = setTimeout(yawn, 20000 + Math.random() * 15000);
    };

    const lookAround = () => {
      if (isYawning || isAnimating) {
        lookTimeout = setTimeout(lookAround, 2000);
        return;
      }
      isLooking = true;
      isAnimating = true;

      // Slow, gentle head drift patterns - very subtle movements
      const patterns = [
        // Slow drift left, hold, drift back
        [{ x: -0.8, duration: 1200 }, { x: -0.8, duration: 800 }, { x: 0, duration: 1000 }],
        // Slow drift right, hold, drift back
        [{ x: 0.8, duration: 1200 }, { x: 0.8, duration: 800 }, { x: 0, duration: 1000 }],
        // Gentle sway left to right
        [{ x: -0.6, duration: 1400 }, { x: 0.6, duration: 1800 }, { x: 0, duration: 1200 }],
        // Gentle sway right to left
        [{ x: 0.6, duration: 1400 }, { x: -0.6, duration: 1800 }, { x: 0, duration: 1200 }],
      ];

      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let delay = 0;

      pattern.forEach((step, index) => {
        setTimeout(() => {
          setFaceTransform(prev => ({ ...prev, translateX: step.x }));
          if (index === pattern.length - 1) {
            // Last step - mark as done after it settles
            setTimeout(() => {
              isLooking = false;
              isAnimating = false;
              lastAnimationEnd = Date.now();
            }, 500);
          }
        }, delay);
        delay += step.duration;
      });

      // Next look in 8-15 seconds
      lookTimeout = setTimeout(lookAround, 8000 + Math.random() * 7000);
    };

    // Start animations with staggered initial delays
    blinkTimeout = setTimeout(blink, 2000 + Math.random() * 2000);
    // First yawn at 6 seconds so user sees it early
    yawnTimeout = setTimeout(yawn, 6000);
    lookTimeout = setTimeout(lookAround, 10000 + Math.random() * 4000);
    contentTimeout = setTimeout(showContent, 30000 + Math.random() * 20000);

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(yawnTimeout);
      clearTimeout(lookTimeout);
      clearTimeout(contentTimeout);
    };
  }, [isLoading, isMouseNearFace, isFaceClicked, isHomeButtonHovered, isSleepingTime]);

  // Last.fm integration
  const { currentTrack, isLoading: musicLoading, error: musicError, isPlaying: isPreviewPlaying, isDataComplete, playPreview, stopPreview } = useLastFm();

  // GitHub stats integration
  const { stats: githubStats } = useGitHubStats();

  // Sound effects
  const { playClick, playArrow } = useSounds();
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(1); // 1 or 2, tracks which video element is visible
  const video1IndexRef = useRef(0); // Which video data index is in video1
  const video2IndexRef = useRef(1); // Which video data index is in video2
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false); // Loading state during video transitions
  const firstVideoReadyRef = useRef(false); // Track if first video is ready for loader

  // Video warm-up tracking - briefly plays each video to initialize decoder
  const warmupCompleteRef = useRef(false);
  const warmupCountRef = useRef(0);

  // Page persistence - prevent video reset on route toggle
  const hasInitializedHomeRef = useRef(false);
  const scrollPositionsRef = useRef({ home: 0, about: 0 });

  const [loadedComponents, setLoadedComponents] = useState({
    timeComponent: false,
    h1: false,
    bodyParagraphs: false,
    videoFrame: false,
    bottomComponent: false,
    navBar: false
  });
  const [showJiggle, setShowJiggle] = useState(false);
  const [hasDiscoveredContent, setHasDiscoveredContent] = useState(false); // Once true, jiggle never triggers again
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMetadataExpanded, setMobileMetadataExpanded] = useState(false); // Mobile: toggle metadata box on tap

  // Check if device is mobile/tablet
  const isMobileOrTablet = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [isMusicHovered, setIsMusicHovered] = useState(false);
  const [isModalExiting, setIsModalExiting] = useState(false);
  const [isShortcutsHovered, setIsShortcutsHovered] = useState(false);
  const [isShortcutsModalExiting, setIsShortcutsModalExiting] = useState(false);
  const [isShortcutsActive, setIsShortcutsActive] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'music' | 'activity' | 'shortcuts' | 'contact' | null
  const [activeAnchorRef, setActiveAnchorRef] = useState(null);
  const musicButtonRef = useRef(null);
  const activityButtonRef = useRef(null);
  const contactButtonRef = useRef(null);
  const isHoveredRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const modalTimeoutRef = useRef(null);
  const shortcutsModalTimeoutRef = useRef(null);
  const shortcutsButtonRef = useRef(null);
  
  // CMS data - fetched at runtime for live updates
  const [videoData, setVideoData] = useState([]);
  const [websiteCopy, setWebsiteCopy] = useState({});
  const lastMediaHashRef = useRef('');
  const lastCopyHashRef = useRef('');

  const videoFailedTiersRef = useRef(new Map()); // Track which tiers failed for each video id
  
  // City to timezone mapping - automatically determines timezone from city name
  const getTimezoneFromCity = (cityName) => {
    if (!cityName) return 'UTC';
    
    const cityMap = {
      // Asia
      'saigon': 'Asia/Ho_Chi_Minh',
      'ho chi minh': 'Asia/Ho_Chi_Minh',
      'ho chi minh city': 'Asia/Ho_Chi_Minh',
      'hcmc': 'Asia/Ho_Chi_Minh',
      'tokyo': 'Asia/Tokyo',
      'japan': 'Asia/Tokyo',
      'kagoshima': 'Asia/Tokyo',
      'seoul': 'Asia/Seoul',
      'korea': 'Asia/Seoul',
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai',
      'hong kong': 'Asia/Hong_Kong',
      'singapore': 'Asia/Singapore',
      'bangkok': 'Asia/Bangkok',
      'jakarta': 'Asia/Jakarta',
      'manila': 'Asia/Manila',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'dubai': 'Asia/Dubai',
      // Europe
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'amsterdam': 'Europe/Amsterdam',
      'moscow': 'Europe/Moscow',
      // Americas
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'san francisco': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'mexico city': 'America/Mexico_City',
      'sao paulo': 'America/Sao_Paulo',
      'buenos aires': 'America/Buenos_Aires',
      // Oceania
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'auckland': 'Pacific/Auckland',
    };
    
    const normalizedCity = cityName.toLowerCase().trim();
    return cityMap[normalizedCity] || 'UTC';
  };

  // City to coordinates mapping - derives lat/lng from CMS city name
  const getCoordsFromCity = (cityName) => {
    if (!cityName) return { lat: 0, lng: 0 };
    const coordsMap = {
      'saigon': { lat: 10.777, lng: 106.699 },
      'ho chi minh': { lat: 10.777, lng: 106.699 },
      'ho chi minh city': { lat: 10.777, lng: 106.699 },
      'hcmc': { lat: 10.777, lng: 106.699 },
      'tokyo': { lat: 35.682, lng: 139.692 },
      'japan': { lat: 35.682, lng: 139.692 },
      'kagoshima': { lat: 31.597, lng: 130.557 },
      'seoul': { lat: 37.566, lng: 126.978 },
      'korea': { lat: 37.566, lng: 126.978 },
      'beijing': { lat: 39.904, lng: 116.407 },
      'shanghai': { lat: 31.230, lng: 121.474 },
      'hong kong': { lat: 22.320, lng: 114.169 },
      'singapore': { lat: 1.352, lng: 103.820 },
      'bangkok': { lat: 13.756, lng: 100.502 },
      'jakarta': { lat: -6.175, lng: 106.845 },
      'manila': { lat: 14.599, lng: 120.984 },
      'mumbai': { lat: 19.076, lng: 72.878 },
      'delhi': { lat: 28.614, lng: 77.209 },
      'dubai': { lat: 25.205, lng: 55.270 },
      'london': { lat: 51.507, lng: -0.128 },
      'paris': { lat: 48.857, lng: 2.352 },
      'berlin': { lat: 52.520, lng: 13.405 },
      'rome': { lat: 41.902, lng: 12.496 },
      'madrid': { lat: 40.417, lng: -3.704 },
      'amsterdam': { lat: 52.370, lng: 4.895 },
      'moscow': { lat: 55.756, lng: 37.617 },
      'new york': { lat: 40.713, lng: -74.006 },
      'los angeles': { lat: 34.052, lng: -118.244 },
      'san francisco': { lat: 37.775, lng: -122.419 },
      'chicago': { lat: 41.878, lng: -87.630 },
      'toronto': { lat: 43.653, lng: -79.383 },
      'vancouver': { lat: 49.283, lng: -123.121 },
      'mexico city': { lat: 19.433, lng: -99.133 },
      'sao paulo': { lat: -23.551, lng: -46.634 },
      'buenos aires': { lat: -34.604, lng: -58.382 },
      'sydney': { lat: -33.869, lng: 151.209 },
      'melbourne': { lat: -37.814, lng: 144.963 },
      'auckland': { lat: -36.849, lng: 174.764 },
    };
    return coordsMap[cityName.toLowerCase().trim()] || { lat: 0, lng: 0 };
  };

  // Helper to get copy by key - use safeWebsiteCopy if available
  const getCopy = (key) => {
    const copy = websiteCopy[key] || '';
    return copy;
  };

  // Calculate time ago from Last.fm timestamp
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    
    const now = new Date();
    const playedAt = new Date(timestamp);
    const diffMs = now - playedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return 'recently';
  };
  
  // Helper to render copy with links: {text|url} becomes <a>, {text} becomes <span>
  const renderCopy = (key) => {
    const content = getCopy(key);
    if (!content) return null;

    // Parse {text|url} for links and {text} for styled spans
    const parts = content.split(/(\{[^}]+\})/g);
    return parts.map((part, i) => {
      const linkMatch = part.match(/^\{([^|]+)\|([^}]+)\}$/);
      const spanMatch = part.match(/^\{([^}]+)\}$/);

      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark" onClick={playClick}>
            {linkMatch[1]}
          </a>
        );
      } else if (spanMatch) {
        return <span key={i} className="dotted-underline-grey text-grey-dark">{spanMatch[1]}</span>;
      }
      
      // Check for "second breakfasts" easter egg (case-insensitive)
      if (/second breakfasts/i.test(part)) {
        const regex = /(second breakfasts)/gi;
        const splitParts = part.split(regex);
        return splitParts.map((splitPart, j) => {
          if (regex.test(splitPart)) {
            return (
              <a
                key={`${i}-${j}`}
                href="https://www.youtube.com/watch?v=gA8LV37QwxA"
                target="_blank"
                rel="noopener noreferrer"
                className="easter-egg-second-breakfast"
              >
                {splitPart}
              </a>
            );
          }
          return splitPart;
        });
      }
      
      return part;
    });
  };
  
  // Fetch CMS data on mount and poll for changes in dev mode
  useEffect(() => {
    const fetchWithTimeout = async (url, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    };

    const fetchCmsData = async () => {
      try {
        // Always fetch from static JSON files
        const [mediaJson, copyJson] = await Promise.allSettled([
          fetchWithTimeout('/cms-data/homepage-media.json', 5000),
          fetchWithTimeout('/cms-data/website-copy.json', 5000)
        ]);

        // Handle media data
        if (mediaJson.status === 'fulfilled') {
          const newMediaHash = JSON.stringify(mediaJson.value.data);
          if (newMediaHash !== lastMediaHashRef.current) {
            lastMediaHashRef.current = newMediaHash;
            setVideoData(mediaJson.value.data || []);
          }
        }

        // Handle website copy
        if (copyJson.status === 'fulfilled') {
          const newCopyHash = JSON.stringify(copyJson.value.data);
          if (newCopyHash !== lastCopyHashRef.current) {
            lastCopyHashRef.current = newCopyHash;
            const copyObj = {};
            (copyJson.value.data || []).forEach(item => {
              copyObj[item.key] = item.content;
            });
            setWebsiteCopy(copyObj);
          }
        }
      } catch (error) {
        // Silent fail - data will remain unchanged
      }
    };

    fetchCmsData();

    // Poll every 2 seconds for changes (useful during development)
    let pollInterval = setInterval(fetchCmsData, 2000);
    
    // Also refetch when window regains focus
    const handleFocus = () => fetchCmsData();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);
  
  // Update refs when state changes
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      videoCacheRef.current.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, []);

  // Track the last known width to prevent resetting during data refresh
  const lastMusicPillWidthRef = useRef(205);

  // Measure actual text width using canvas for accurate dynamic sizing
  const measureTextWidth = (text, font = '14px Graphik, sans-serif') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Calculate music pill width dynamically based on actual text width
  // Measures text, adds padding for album art + gaps + hover box margin
  const musicPillWidth = useMemo(() => {
    // Don't update width until data is complete (album art preloaded)
    if (!isDataComplete) return lastMusicPillWidthRef.current;
    if (!currentTrack?.name || !currentTrack?.artist) return lastMusicPillWidthRef.current;

    // Measure actual pixel width of title and artist
    const titleWidth = measureTextWidth(currentTrack.name);
    const artistWidth = measureTextWidth(currentTrack.artist);
    const maxTextWidth = Math.max(titleWidth, artistWidth);

    // Fixed offsets:
    // - Album art: 40px
    // - Gap between art and text: 10px
    // - Button padding (left 6px + right 16px): 22px
    // - Wrapper padding (left 6px + right 12px): 18px
    // - Comfortable breathing room: 45px (matches original live version feel)
    const fixedOffset = 40 + 10 + 22 + 18 + 45; // = 135px

    // Calculate dynamic width with min/max constraints
    // Min: 185px (more than original 172px, but less whitespace for short text)
    // Max: 265px (prevent excessive width while allowing longer titles)
    const calculatedWidth = Math.round(maxTextWidth + fixedOffset);
    const newWidth = Math.max(185, Math.min(265, calculatedWidth));

    // Update the ref for next time
    lastMusicPillWidthRef.current = newWidth;
    return newWidth;
  }, [currentTrack?.name, currentTrack?.artist, isDataComplete]);

  // Cleanup modal timeout on unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
      if (shortcutsModalTimeoutRef.current) {
        clearTimeout(shortcutsModalTimeoutRef.current);
      }
    };
  }, []);

  // Detect Mac vs Windows/Linux
  useEffect(() => {
    const checkIsMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
                       navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    setIsMac(checkIsMac);
  }, []);
  // Get the appropriate video source - Safari gets smaller optimized files
  const getVideoSrc = (video) => {
    if (!video) return '';

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Safari: Use smaller Safari-optimized files for faster loading
    if (isSafari) {
      // Local files: Use srcSafari if available
      if (video.srcSafari) {
        return video.srcSafari;
      }
      // Cloudinary URLs: Add Safari transforms (720p, lower quality)
      if (video.src && video.src.includes('cloudinary.com')) {
        return video.src.replace('/upload/', '/upload/c_scale,h_720,q_auto:eco/');
      }
    }

    // Default: Standard tier (1080p Premium quality)
    return video.src;
  };

  // Handle video load failure - fallback to standard tier
  const handleVideoError = (videoId, videoElement) => {
    // Log video errors for debugging
    console.warn(`Video ${videoId} failed to load:`, videoElement?.src);
  };

  // Keyboard shortcuts: Cmd+K / Ctrl+K and Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to close modal
      if (e.code === 'Escape' && activeModal) {
        e.preventDefault();
        setActiveModal(null);
        return;
      }

      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();

        // If modal is open, close it and show shortcuts
        if (activeModal) {
          setActiveModal(null);
        }

        // Show active state animation
        setIsShortcutsActive(true);

        // Also show the hover state briefly
        setIsShortcutsHovered(true);

        setTimeout(() => {
          setIsShortcutsActive(false);
          setIsShortcutsModalExiting(true);
          setTimeout(() => {
            setIsShortcutsHovered(false);
            setIsShortcutsModalExiting(false);
          }, 200);
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Handle video ended event - auto-advance to next video
  const handleVideoEnded = (e) => {
    // Prevent handling if we're already transitioning
    if (isTransitioningRef.current) {
      return;
    }
    
    const video = e.target;
    
    // Always advance to next video when current one ends
    if (video) {
      video.loop = false;
    }
    changeVideo('next');
  };

  // Track transition state for cancellation
  const transitionIdRef = useRef(0);
  const pendingDirectionRef = useRef(null);
  const targetVideoIndexRef = useRef(0); // Track ultimate target when clicking fast

  // Helper to get video src - handles both Cloudinary URLs and local paths
  // Applies browser-specific optimizations for Cloudinary URLs
  const encodeVideoSrc = (src, options = {}) => {
    if (!src) return src;

    // If it's a Cloudinary URL, optimize transformations
    if (src.includes('cloudinary.com')) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Parse existing URL to modify transformations
      const urlParts = src.match(/\/video\/upload\/([^/]+)\/(.+)/);
      if (urlParts) {
        const [, existingTransforms, path] = urlParts;

        // Build optimized transformations
        // - q_auto:good - automatic quality optimization
        // - vc_h264 - H.264 codec (best Safari support)
        // - f_mp4 - MP4 format (universal support)
        // - ac_none - remove audio (videos are muted, saves bandwidth)
        // - so_0 - start offset 0 (ensures consistent starting point)
        // For Safari: add fl_progressive for smoother streaming
        const baseTransforms = 'q_auto:good,vc_h264,f_mp4,ac_none,so_0';
        const safariTransforms = isSafari ? `${baseTransforms},fl_progressive:steep` : baseTransforms;

        return `https://res.cloudinary.com/dxsdxpm9m/video/upload/${safariTransforms}/${path}`;
      }

      return src;
    }

    // Local path - encode spaces
    const parts = src.split('/');
    return parts.map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/');
  };

  // Helper to get poster image - uses Cloudinary thumbnail or local poster
  const getPosterSrc = (src) => {
    if (!src) return '';

    // If it's a Cloudinary URL, generate thumbnail URL
    if (src.includes('cloudinary.com')) {
      // Convert video URL to image thumbnail
      // Replace video transformations with image thumbnail transformations
      // Extract the base URL and filename
      const match = src.match(/\/video\/upload\/([^/]+)\/(.+)\.(mp4|webm|mov)/i);
      if (match) {
        const filename = match[2];
        // Use f_auto for WebP/AVIF delivery when supported, with quality optimization
        return `https://res.cloudinary.com/dxsdxpm9m/video/upload/f_auto,q_auto:good,so_0/${filename}.jpg`;
      }
      // Fallback for URLs without extension
      return src
        .replace(/\/video\/upload\/[^/]+\//, '/video/upload/f_auto,q_auto:good,so_0/')
        .replace(/\.(mp4|webm|mov)$/i, '.jpg');
    }

    // Local path - use local poster
    const filename = src.startsWith('/') ? src.slice(1) : src;
    const posterName = filename.replace('.mp4', '.jpg');
    const posterPath = `/posters/${posterName}`;
    const parts = posterPath.split('/');
    return parts.map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/');
  };

  // Warm up adjacent video by silently playing one frame (forces Safari decoder init)
  const warmUpAdjacentVideo = useCallback((videoEl) => {
    if (!videoEl) return;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isSafari) return;
    // Already decoded enough data
    if (videoEl.readyState >= 4) return;

    videoEl.muted = true;
    videoEl.currentTime = 0;

    const onTimeUpdate = () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.pause();
      videoEl.currentTime = 0;
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate, { once: true });
    videoEl.play().catch(() => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
    });
  }, []);

  // Preload video on hover for faster transitions
  const preloadVideoOnHover = (direction) => {
    if (videoData.length === 0 || isTransitioningRef.current) return;

    const baseIndex = isTransitioningRef.current ? targetVideoIndexRef.current : videoIndex;
    const targetIndex = direction === 'next'
      ? (baseIndex + 1) % videoData.length
      : (baseIndex - 1 + videoData.length) % videoData.length;

    // Trigger preload on the target video element
    const targetVideoEl = videoElementsRef.current[targetIndex];
    if (targetVideoEl) {
      targetVideoEl.preload = 'auto';
      // Also warm up the video for faster switching on Safari
      warmUpAdjacentVideo(targetVideoEl);
    }
  };

  // Reference to all video elements for play/pause control
  const videoElementsRef = useRef([]);

  const changeVideo = (direction) => {
    // Don't change if no video data
    if (videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Calculate next index
    const nextIndex = direction === 'next'
      ? (videoIndex + 1) % videoData.length
      : (videoIndex - 1 + videoData.length) % videoData.length;

    // Get video elements
    const currentVideo = videoElementsRef.current[videoIndex];
    const nextVideo = videoElementsRef.current[nextIndex];

    // Prepare next video BEFORE switching - ensure it's ready and visible
    if (nextVideo) {
      // Make next video visible (but still behind current due to z-index)
      nextVideo.style.visibility = 'visible';
      nextVideo.style.opacity = '1';

      // Reset and start playing the next video
      nextVideo.currentTime = 0;
      const playPromise = nextVideo.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Retry play on Safari
          if (isSafari) {
            setTimeout(() => nextVideo.play().catch(() => {}), 50);
          }
        });
      }
    }

    // Dynamic delay: if next video is pre-decoded (readyState >= 3), switch faster
    const switchDelay = (nextVideo && nextVideo.readyState >= 3) ? 5 : (isSafari ? 30 : 10);

    setTimeout(() => {
      // Now update index - this will swap z-index making next video visible
      setVideoIndex(nextIndex);

      // Hide and pause current video after switch
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.style.visibility = 'hidden';
        currentVideo.style.opacity = '0';
      }
    }, switchDelay);
  };


  // Detect Safari and add class for underline fallback
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      document.documentElement.classList.add('safari');
    }
  }, []);

  // Save/restore scroll position when toggling between pages
  useEffect(() => {
    if (location.pathname === '/') {
      scrollPositionsRef.current.about = window.scrollY;
      window.scrollTo(0, scrollPositionsRef.current.home);
    } else if (location.pathname === '/about') {
      scrollPositionsRef.current.home = window.scrollY;
      window.scrollTo(0, scrollPositionsRef.current.about);
    }
  }, [location.pathname]);

  // Trigger component load animations in sequence - only after loader finishes
  useEffect(() => {
    // Don't start animations until loader is done
    if (isLoading) return;
    
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Wait after loader ends - Safari needs more time
    const startDelay = isSafari ? 1200 : 1000;
    const stagger = isSafari ? 100 : 70; // More time between animations for Safari
    
    // Time component appears first
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, timeComponent: true }));
    }, startDelay);
    
    // H1 appears second
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, h1: true }));
    }, startDelay + stagger);
    
    // Body paragraphs appear third
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bodyParagraphs: true }));
    }, startDelay + stagger * 2);
    
    // Video frame appears fourth
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, videoFrame: true }));
    }, startDelay + stagger * 3);
    
    // Bottom component and navbar appear last - give more time
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bottomComponent: true, navBar: true }));
    }, startDelay + stagger * 4 + 50);
  }, [isLoading]);

  // Trigger subtle jiggle animation: initial 8s after loading completes, then every 5s. Stops permanently once user hovers.
  const jiggleIntervalRef = useRef(null);
  const jigglePauseTimeoutRef = useRef(null);
  const jiggleTimeoutRef = useRef(null);
  const jiggleInitialRef = useRef(null);

  // Single effect to manage all jiggle logic based on hover state
  useEffect(() => {
    const clearAllJiggleTimers = () => {
      if (jiggleTimeoutRef.current) {
        clearTimeout(jiggleTimeoutRef.current);
        jiggleTimeoutRef.current = null;
      }
      if (jiggleIntervalRef.current) {
        clearInterval(jiggleIntervalRef.current);
        jiggleIntervalRef.current = null;
      }
      if (jigglePauseTimeoutRef.current) {
        clearTimeout(jigglePauseTimeoutRef.current);
        jigglePauseTimeoutRef.current = null;
      }
      if (jiggleInitialRef.current) {
        clearTimeout(jiggleInitialRef.current);
        jiggleInitialRef.current = null;
      }
    };

    // If user has already discovered the content, never show jiggle again
    if (hasDiscoveredContent) {
      clearAllJiggleTimers();
      setShowJiggle(false);
      return;
    }

    const startJiggle = () => {
      // Don't jiggle if discovered or currently hovered
      if (isHoveredRef.current || hasDiscoveredContent) {
        setShowJiggle(false);
        return;
      }
      setShowJiggle(true);
      jiggleTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current) {
          setShowJiggle(false);
        }
        jiggleTimeoutRef.current = null;
      }, 600);
    };

    const startJiggleCycle = () => {
      if (jiggleIntervalRef.current) {
        clearInterval(jiggleIntervalRef.current);
      }
      jiggleIntervalRef.current = setInterval(() => {
        if (!isHoveredRef.current && !hasDiscoveredContent) {
          startJiggle();
        }
      }, 5000);
    };

    if (isHovered) {
      // User has discovered the content - permanently stop jiggle
      setHasDiscoveredContent(true);
      setShowJiggle(false);
      clearAllJiggleTimers();
    } else if (!hasDiscoveredContent && !isLoading) {
      // Only start jiggle cycle if user hasn't discovered content yet AND site has finished loading
      jigglePauseTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current && !hasDiscoveredContent) {
          startJiggle();
          startJiggleCycle();
        }
      }, 8000);
    }

    return () => {
      clearAllJiggleTimers();
    };
  }, [isHovered, hasDiscoveredContent, isLoading]);

  // Update clock time based on CMS city setting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Get city from CMS, default to 'Saigon' if not set
      const clockCity = getCopy('clock_location') || 'Saigon';
      const timezone = getTimezoneFromCity(clockCity);
      
      // Get time string for the city's timezone
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(now);
      setClockTimeString(timeString);

      // Get time for clock hands
      const timeForClock = now.toLocaleString('en-US', { timeZone: timezone });
      const localDate = new Date(timeForClock);
      const hours = localDate.getHours() % 12;
      const minutes = localDate.getMinutes();
      const seconds = localDate.getSeconds();
      // Get milliseconds from the original date (timezone conversion doesn't affect milliseconds)
      const milliseconds = now.getMilliseconds();
      
      setClockTime({ hours, minutes, seconds, milliseconds });
    };

    updateTime();
    // Update every 16ms (~60fps) for smooth second hand animation
    const interval = setInterval(updateTime, 16);
    return () => clearInterval(interval);
  }, [websiteCopy]); // Re-run when CMS data changes

  // Ambient data for expanded clock card
  const clockCity = getCopy('clock_location') || 'Saigon';
  const clockCoords = getCoordsFromCity(clockCity);
  const clockTimezone = getTimezoneFromCity(clockCity);
  const { weather: ambientWeather, sun: ambientSun, moon: ambientMoon } = useAmbientData({
    lat: clockCoords.lat,
    lng: clockCoords.lng,
    timezone: clockTimezone,
    enabled: isClockExpanded,
  });

  // Close expanded clock on click outside
  useEffect(() => {
    if (!isClockExpanded) return;
    const handleClickOutside = (e) => {
      if (clockCardRef.current && !clockCardRef.current.contains(e.target)) {
        setIsClockExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isClockExpanded]);

  // Close expanded clock on Escape
  useEffect(() => {
    if (!isClockExpanded) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsClockExpanded(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isClockExpanded]);

  // Font loading check - ensure fonts are loaded before loader animation
  useEffect(() => {
    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        // Small delay to ensure font is actually rendered in the DOM
        // This prevents FOUT (Flash of Unstyled Text) in the loader
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            fontsLoadedRef.current = true;
            setFontsReady(true);
          });
        });
      });
    } else {
      // Fallback for browsers without font loading API
      // Wait a bit for fonts to potentially load
      setTimeout(() => {
        fontsLoadedRef.current = true;
        setFontsReady(true);
      }, 200);
    }
  }, []);

  // Preload FIRST + ADJACENT videos during the loader to enable smooth toggling
  // Uses FETCH to fully download videos into HTTP cache (not just canplaythrough which is optimistic)
  useEffect(() => {
    if (videoData.length === 0) return;

    adjacentVideosReadyRef.current = 0;
    firstVideoReadyRef.current = false; // Reset on new video data
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Fetch video fully and create blob URL for instant playback
    const fetchVideoToCache = async (videoSrc, onComplete) => {
      try {
        if (videoCacheRef.current.has(videoSrc)) {
          onComplete(true);
          return true;
        }
        const encodedSrc = encodeVideoSrc(videoSrc);
        const response = await fetch(encodedSrc);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(videoSrc, blobUrl);

          // Update non-active video elements with blob URL for instant switching
          const idx = videoData.findIndex(v => getVideoSrc(v) === videoSrc);
          if (idx !== -1 && idx !== videoIndex) {
            const videoEl = videoElementsRef.current[idx];
            if (videoEl) {
              videoEl.src = blobUrl;
              videoEl.load();
            }
          }

          onComplete(true);
          return true;
        }
      } catch (e) {
        // Fetch failed
      }
      onComplete(false);
      return false;
    };

    // Preload first video - fetch MUST complete before we consider it ready
    const firstVideoSrc = getVideoSrc(videoData[0]);

    // Fetch first video (marks ready when complete)
    fetchVideoToCache(firstVideoSrc, (success) => {
      if (success) {
        firstVideoReadyRef.current = true;
      }
    });

    // Preload adjacent videos (next and previous) for smooth toggling
    if (videoData.length > 1) {
      const nextVideoSrc = getVideoSrc(videoData[1]);
      const prevVideoSrc = videoData.length > 2 ? getVideoSrc(videoData[videoData.length - 1]) : null;

      // Fetch next video (slightly staggered)
      setTimeout(() => {
        fetchVideoToCache(nextVideoSrc, (success) => {
          if (success) {
            adjacentVideosReadyRef.current += 1;
          }
        });
      }, 100);

      // Fetch previous video
      if (prevVideoSrc) {
        setTimeout(() => {
          fetchVideoToCache(prevVideoSrc, (success) => {
            if (success) {
              adjacentVideosReadyRef.current += 1;
            }
          });
        }, 200);
      }
    }

    // Fallback: mark as ready after timeout (in case fetch is slow)
    const fallbackTimer = setTimeout(() => {
      if (!firstVideoReadyRef.current) {
        console.log('Video preload timeout - marking as ready');
        firstVideoReadyRef.current = true;
      }
    }, isSafari ? 10000 : 8000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [videoData]);

  // Video warm-up during loader:
  // 1. First video: Fully decode frames (play briefly, then reset to ready state)
  // 2. Other videos: Preload data into browser cache (fast parallel fetch)
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    let isCancelled = false;

    // Decode first video frames by playing briefly
    const decodeFirstVideo = async (videoEl) => {
      if (!videoEl || isCancelled) return;

      return new Promise((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          // Reset first video to ready state
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.style.opacity = '1';
          videoEl.style.visibility = 'visible';
          firstVideoReadyRef.current = true;
          warmupCountRef.current += 1;
          resolve();
        };

        const timeout = setTimeout(done, 3000);

        videoEl.preload = 'auto';
        videoEl.muted = true;
        videoEl.load();

        const onCanPlay = () => {
          if (resolved || isCancelled) return;
          videoEl.play().then(() => {
            const onFrame = () => {
              videoEl.removeEventListener('timeupdate', onFrame);
              clearTimeout(timeout);
              // Small delay to ensure frame is rendered
              setTimeout(done, 100);
            };
            videoEl.addEventListener('timeupdate', onFrame, { once: true });
            setTimeout(() => {
              videoEl.removeEventListener('timeupdate', onFrame);
              if (!resolved) done();
            }, 500);
          }).catch(() => done());
        };

        if (videoEl.readyState >= 3) onCanPlay();
        else videoEl.addEventListener('canplay', onCanPlay, { once: true });
      });
    };

    // Preload other videos (just fetch data, don't play)
    const preloadVideo = async (videoEl) => {
      if (!videoEl || isCancelled) return;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          warmupCountRef.current += 1;
          resolve();
        }, 2000);

        videoEl.preload = 'auto';
        videoEl.load();

        const onLoaded = () => {
          clearTimeout(timeout);
          warmupCountRef.current += 1;
          resolve();
        };

        if (videoEl.readyState >= 2) onLoaded();
        else videoEl.addEventListener('loadeddata', onLoaded, { once: true });
      });
    };

    // Yield to main thread to prevent blocking
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    const warmUpVideos = async () => {
      const videoElements = videoElementsRef.current;

      if (!videoElements || videoElements.length === 0 || !videoElements[0]) {
        if (!isCancelled) setTimeout(warmUpVideos, 100);
        return;
      }

      console.log('Warming up', videoElements.length, 'videos');

      // First: Decode first video fully
      await decodeFirstVideo(videoElements[0]);
      console.log('First video ready');

      // Yield after first video
      await yieldToMain();

      // Then: Preload other videos in batches, yielding between batches
      const otherVideos = videoElements.slice(1);
      const BATCH_SIZE = 4;

      for (let i = 0; i < otherVideos.length; i += BATCH_SIZE) {
        if (isCancelled) break;
        const batch = otherVideos.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(v => preloadVideo(v)));
        // Yield to main thread between batches
        await yieldToMain();
      }

      if (!isCancelled) {
        warmupCompleteRef.current = true;
        console.log(`Warmup complete: ${warmupCountRef.current}/${videoElements.length} videos`);
      }
    };

    const timer = setTimeout(warmUpVideos, 100);
    return () => { isCancelled = true; clearTimeout(timer); };
  }, [isLoading, videoData]);

  // Background video preloading: Preload remaining videos AFTER loader completes
  // First 3 videos (current, next, prev) are preloaded during loader
  useEffect(() => {
    // Skip if still loading or not enough videos to preload
    if (isLoading || videoData.length <= 3) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let isCancelled = false;

    // Preload a single video via fetch and create blob URL
    const preloadVideo = async (video) => {
      if (isCancelled) return;
      try {
        const videoSrc = getVideoSrc(video);

        // Check if already cached during loader
        if (videoCacheRef.current.has(videoSrc)) return;

        const encodedSrc = encodeVideoSrc(videoSrc);
        const response = await fetch(encodedSrc);
        if (response.ok && !isCancelled) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          videoCacheRef.current.set(videoSrc, blobUrl);

          // Update the corresponding non-active video element with blob URL
          const idx = videoData.findIndex(v => getVideoSrc(v) === videoSrc);
          if (idx !== -1 && idx !== videoIndex) {
            const videoEl = videoElementsRef.current[idx];
            if (videoEl) {
              videoEl.src = blobUrl;
              videoEl.load();
            }
          }
        }
      } catch (e) {
        // Don't mark as cached on error
      }
    };

    // Start preloading remaining videos 2 seconds after loader ends
    // Skip index 0 (first), 1 (next), and last (prev) - already preloaded during loader
    const remainingTimer = setTimeout(() => {
      if (isCancelled) return;

      // Get indices to preload (skip first, second, and last)
      const indicesToPreload = [];
      for (let i = 2; i < videoData.length - 1; i++) {
        indicesToPreload.push(i);
      }

      // Preload with stagger to avoid network congestion
      indicesToPreload.forEach((index, i) => {
        setTimeout(() => {
          if (!isCancelled) {
            preloadVideo(videoData[index]);
          }
        }, i * 1500); // 1.5 second stagger
      });
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(remainingTimer);
    };
  }, [isLoading, videoData]);

  // Loader animation: Cycle through coordinates (only after fonts are loaded)
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let minTimeTimer = null;
    let coordInterval = null;
    let isMounted = true;

    // Wait for fonts to load before starting the animation
    const startAnimation = () => {
      if (!isMounted) return;

      // Set minimum loader time to allow videos to fully decode frames
      // Safari: 6 seconds, Chrome: 5 seconds (gives warmup time to decode all videos)
      const minTime = isSafari ? 4000 : 3000;
      minTimeTimer = setTimeout(() => {
        if (isMounted) {
          loaderMinTimeRef.current = true;
        }
      }, minTime);
      
      // Cycle through coordinates
      coordInterval = setInterval(() => {
        if (!isMounted) return;
        setCoordFading(true);
        setTimeout(() => {
          if (isMounted) {
            setCurrentCoordIndex(prev => (prev + 1) % videoData.length);
            setCoordFading(false);
          }
        }, 300); // Fade out duration
      }, 600); // Change every 600ms
    };
    
    // Check if fonts are already loaded
    if (fontsLoadedRef.current) {
      startAnimation();
    } else {
      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (isMounted && isLoading && videoData.length > 0) {
            startAnimation();
          }
        });
      } else {
        // Fallback: start after a short delay if font API not available
        setTimeout(() => {
          if (isMounted) {
            startAnimation();
          }
        }, 100);
      }
    }
    
    return () => {
      isMounted = false;
      if (minTimeTimer) clearTimeout(minTimeTimer);
      if (coordInterval) clearInterval(coordInterval);
    };
  }, [isLoading, videoData]);

  // Encouraging messages after 5 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const encouragingMessages = [
      "Good things take time...",
      "Worth the wait, promise.",
      "Almost there...",
      "Patience is a virtue.",
      "Loading some cool stuff...",
      "Making it perfect for you...",
      "Just a moment more...",
    ];
    
    let messageIndex = 0;
    
    // Show first message at 5 seconds
    const firstMessageTimer = setTimeout(() => {
      setLoaderMessage(encouragingMessages[0]);
      messageIndex = 1;
    }, 5000);
    
    // Rotate messages every 2 seconds after that
    const messageInterval = setInterval(() => {
      if (messageIndex > 0 && messageIndex < encouragingMessages.length) {
        setLoaderMessage(encouragingMessages[messageIndex]);
        messageIndex++;
      }
    }, 2000);
    
    return () => {
      clearTimeout(firstMessageTimer);
      clearInterval(messageInterval);
      setLoaderMessage('');
    };
  }, [isLoading]);

  // Check if loading is complete - wait for video warm-up, fonts, and Last.fm
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Check periodically if everything is ready:
    // 1. Minimum time has passed (6 seconds Safari, 5 seconds Chrome)
    // 2. First video is FULLY ready (decoded, can play)
    // 3. Videos are being cached (at least 50% fetched)
    // 4. Fonts are loaded
    // 5. Last.fm is done loading (or timed out)
    const checkLoading = setInterval(() => {
      const fontsReady = fontsLoadedRef.current;
      const lastFmReady = !musicLoading || isDataComplete;
      const firstVideoReady = firstVideoReadyRef.current;

      // Require 80% of videos preloaded
      const minCached = Math.ceil(videoData.length * 0.8);
      const cacheReady = warmupCompleteRef.current || warmupCountRef.current >= minCached;

      // Exit loader once first video ready and enough cached
      if (loaderMinTimeRef.current && fontsReady && lastFmReady && firstVideoReady && cacheReady) {
        console.log(`Loader complete: ${warmupCountRef.current}/${videoData.length} videos cached`);
        setIsLoading(false);
      }
    }, 100);

    // Maximum loader time
    const maxTime = isSafari ? 8000 : 6000;
    const maxTimer = setTimeout(() => {
      console.log(`Loader timeout: ${warmupCountRef.current}/${videoData.length} videos decoded`);
      setIsLoading(false);
    }, maxTime);

    return () => {
      clearInterval(checkLoading);
      clearTimeout(maxTimer);
    };
  }, [isLoading, videoData, musicLoading]);

  // Ensure browser-specific attributes are set on ALL video elements
  // Runs when loader finishes and videos are in DOM
  useEffect(() => {
    if (isLoading) return; // Wait for loader to finish

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);

    const setupVideoElement = (videoEl, index) => {
      if (!videoEl) return;

      // Standard attributes for all browsers
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.muted = true;
      videoEl.defaultMuted = true;

      // Disable picture-in-picture and remote playback for cleaner experience
      videoEl.disablePictureInPicture = true;
      videoEl.disableRemotePlayback = true;

      // Force hardware acceleration for all browsers
      videoEl.style.transform = 'translateZ(0)';
      videoEl.style.willChange = 'transform, opacity';

      if (isSafari) {
        // Safari-specific optimizations
        videoEl.setAttribute('x-webkit-airplay', 'allow');
        videoEl.style.webkitTransform = 'translateZ(0)';
        // All videos should preload in Safari for instant switching
        videoEl.preload = 'auto';
        // Reduce buffering aggressiveness slightly for non-current videos
        if (index !== videoIndex) {
          videoEl.setAttribute('autobuffer', 'true');
        }
      } else if (isChrome) {
        // Chrome-specific optimizations
        // Current and adjacent videos get full preload
        const isAdjacent = Math.abs(index - videoIndex) <= 1 ||
                           (videoIndex === 0 && index === videoData.length - 1) ||
                           (videoIndex === videoData.length - 1 && index === 0);

        videoEl.preload = isAdjacent ? 'auto' : 'metadata';
      } else {
        // Firefox and other browsers
        videoEl.preload = 'auto';
      }
    };

    // Setup ALL video elements
    videoElementsRef.current.forEach((videoEl, index) => {
      setupVideoElement(videoEl, index);
    });
  }, [isLoading, videoIndex, videoData.length]);

  // Ensure videos never loop - always advance to next
  useEffect(() => {
    if (videoRef1.current) {
      videoRef1.current.loop = false;
    }
    if (videoRef2.current) {
      videoRef2.current.loop = false;
    }
  }, []);

  // Preload adjacent videos for seamless transitions
  useEffect(() => {
    // Don't run during loading or transitions
    if (isLoading || isTransitioningRef.current || videoData.length === 0) return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
    const nextIndex = (videoIndex + 1) % videoData.length;
    const prevIndex = (videoIndex - 1 + videoData.length) % videoData.length;

    // Safari: Trigger adjacent video elements to start buffering
    if (isSafari) {
      [nextIndex, prevIndex].forEach(idx => {
        const videoEl = videoElementsRef.current[idx];
        if (videoEl && videoEl.readyState < 3) {
          videoEl.preload = 'auto';
        }
      });
    }

    // Chrome: Smart preloading - adjacent videos get full preload, others get metadata only
    if (isChrome) {
      videoData.forEach((video, idx) => {
        const videoEl = videoElementsRef.current[idx];
        if (!videoEl) return;

        const isAdjacent = idx === nextIndex || idx === prevIndex;
        const isCurrent = idx === videoIndex;

        if (isCurrent || isAdjacent) {
          videoEl.preload = 'auto';
        } else {
          videoEl.preload = 'metadata';
        }
      });
    }

    // All browsers: Fetch adjacent videos and create blob URLs if not cached
    [nextIndex, prevIndex].forEach(idx => {
      if (videoData[idx]) {
        const videoSrc = getVideoSrc(videoData[idx]);
        if (!videoCacheRef.current.has(videoSrc)) {
          const encodedSrc = encodeVideoSrc(videoSrc);
          fetch(encodedSrc).then(res => {
            if (res.ok) return res.blob();
            throw new Error('fetch failed');
          }).then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            videoCacheRef.current.set(videoSrc, blobUrl);
            // Update non-active video element with blob URL
            if (idx !== videoIndex) {
              const videoEl = videoElementsRef.current[idx];
              if (videoEl) {
                videoEl.src = blobUrl;
                videoEl.load();
                // Warm up the video after blob loads for instant switching
                setTimeout(() => warmUpAdjacentVideo(videoEl), 200);
              }
            }
          }).catch(() => {});
        }
      }
    });
  }, [isLoading, videoIndex, videoData]);

  // Ensure videos play on mount - runs when loader finishes AND videoData is ready
  // On first init: full setup. On return from About: just resume playback (no reset).
  useEffect(() => {
    if (isLoading || videoData.length === 0) return;
    if (location.pathname !== '/') return;

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // FIRST TIME: Full initialization (loader just finished)
    if (!hasInitializedHomeRef.current) {
      hasInitializedHomeRef.current = true;

      requestAnimationFrame(() => {
        video1IndexRef.current = 0;
        video2IndexRef.current = 1;
        setVideoIndex(0);
        setActiveVideo(1);

        const firstVideo = videoElementsRef.current[0] || videoRef1.current;

        if (firstVideo) {
          firstVideo.style.visibility = 'visible';
          firstVideo.style.opacity = '1';
          firstVideo.muted = true;
          firstVideo.currentTime = 0;

          const playPromise = firstVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              setTimeout(() => firstVideo.play().catch(() => {}), 100);
            });
          }
        }

        videoElementsRef.current.forEach((videoEl, idx) => {
          if (idx !== 0 && videoEl) {
            videoEl.style.visibility = 'hidden';
            videoEl.style.opacity = '0';
            videoEl.pause();
          }
        });

        // Safari: Preload all other videos for instant switching
        if (isSafari) {
          videoData.forEach((video, idx) => {
            if (idx === 0) return;
            setTimeout(() => {
              const videoEl = videoElementsRef.current[idx];
              if (videoEl) {
                videoEl.preload = 'auto';
                videoEl.load();
              }
            }, idx * 200);
          });
        }
      });
      return;
    }

    // RETURNING FROM ABOUT: Just resume the current video (no index reset, no re-preloading)
    requestAnimationFrame(() => {
      const currentVideo = videoElementsRef.current[videoIndex];
      if (currentVideo) {
        const playPromise = currentVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setTimeout(() => currentVideo.play().catch(() => {}), 100);
          });
        }
      }
    });
  }, [isLoading, videoData, location.pathname]);

  // Pause home video when navigating away to free decoder resources
  useEffect(() => {
    if (location.pathname !== '/') {
      const currentVideo = videoElementsRef.current[videoIndex];
      if (currentVideo) {
        currentVideo.pause();
      }
    }
  }, [location.pathname]);

  // Show loading state only if we have no data at all (allow partial rendering)
  const hasAnyData = videoData.length > 0 || Object.keys(websiteCopy).length > 0;

  // Use fallback data if missing
  const safeVideoData = videoData.length > 0 ? videoData : [];
  const safeWebsiteCopy = Object.keys(websiteCopy).length > 0 ? websiteCopy : {};

  // Coordinates for loader animation
  const loaderCoordinates = videoData.length > 0
    ? videoData.map(v => v.coordinates)
    : ['6.79770°S, 107.57870°E', '37.82975°N, 122.40606°W', '56.76040°N, 4.69090°W', '10.77700°N, 106.69860°E'];

  // If no data at all, show minimal loader
  if (!hasAnyData) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen w-full flex flex-col items-center justify-center gap-4">
        <div className="h-[24px]" />
      </div>
    );
  }

  return (
    <>
    <div className="bg-[#FCFCFC] min-h-screen w-full">
      {/* Loader Overlay - covers content while videos load */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] bg-[#FCFCFC] flex flex-col items-center justify-center gap-4 transition-opacity duration-300"
          style={{ pointerEvents: 'auto' }}
        >
          {fontsReady ? (
            <>
              <div className={`coord-loader font-graphik text-[16px] text-[#91918e] ${coordFading ? 'coord-fade-out' : 'coord-fade-in'}`}>
                {loaderCoordinates[currentCoordIndex % loaderCoordinates.length]}
              </div>
              {loaderMessage && (
                <div className="font-graphik text-[13px] text-[#b5b5b5] animate-pulse">
                  {loaderMessage}
                </div>
              )}
            </>
          ) : (
            <div className="h-[24px]" />
          )}
        </div>
      )}

      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-[#333] focus:font-graphik focus:text-[14px]"
      >
        Skip to main content
      </a>

      {/* Navigation Bar - Light Mode */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 top-nav-container ${loadedComponents.navBar ? 'component-loaded' : 'component-hidden'}`}
        style={{
          backgroundColor: isScrolled ? 'rgba(252, 252, 252, 0.85)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
          transition: 'background-color 300ms ease, backdrop-filter 300ms ease'
        }}
      >
        <div className="light-nav-bar h-[62px] w-full px-[15px] flex items-center justify-between">
          {/* Gary Section - Face Icon + Name + Hover Info Box */}
          <div className="gary-section relative">
            {/* Mouse proximity detection zone */}
            <div
              ref={faceZoneRef}
              className="face-detection-zone absolute pointer-events-auto z-10"
              style={{
                left: '-60px',
                top: '-60px',
                width: 'max(350px, 22vw)',
                height: 'max(280px, 20vh)',
              }}
              onMouseEnter={() => setIsMouseNearFace(true)}
              onMouseLeave={() => setIsMouseNearFace(false)}
              onMouseMove={handleFaceZoneMouseMove}
            />
            {/* Hover wrapper - handles hover for both button and dropdown */}
            <div
              className="gary-hover-wrapper relative z-20"
              onMouseEnter={() => {
                if (faceHoverTimeoutRef.current) {
                  clearTimeout(faceHoverTimeoutRef.current);
                  faceHoverTimeoutRef.current = null;
                }
                setIsFaceHoverExiting(false);
                setIsHomeButtonHovered(true);
              }}
              onMouseLeave={() => {
                setIsFaceHoverExiting(true);
                faceHoverTimeoutRef.current = setTimeout(() => {
                  setIsHomeButtonHovered(false);
                  setIsFaceHoverExiting(false);
                }, 200);
              }}
            >
              <button
                className={`home-button flex items-center gap-[10px] px-[4px] py-[4px] rounded-[16px] cursor-pointer ${isHomeButtonHovered ? 'gary-active' : ''}`}
                onClick={() => { playClick(); navigate('/'); }}
                onMouseDown={() => setIsFaceClicked(true)}
                onMouseUp={() => setIsFaceClicked(false)}
                aria-label="Joonseo Chang - Home"
              >
                <div
                  ref={faceIconRef}
                  className={`face-icon-container h-[37px] w-[42px] flex items-center justify-center rounded-[12px] ${isMouseNearFace ? 'frightened' : ''} relative`}
                >
                  <div
                    className="flex items-center justify-center leading-none"
                    style={{
                      transform: `translateX(${faceTransform.translateX}px) translateY(${faceTransform.translateY}px) scaleX(${faceTransform.scaleX}) scaleY(${faceTransform.scaleY})`,
                      transition: isMouseNearFace ? 'none' : 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <span className="font-graphik text-[12px] text-[#8f8f8f] leading-none">
                      {faceExpression}
                    </span>
                  </div>
                  {/* Floating z's during sleeping time */}
                  {isSleepingTime && !isHomeButtonHovered && !isFaceClicked && !isMouseNearFace && (
                    <div className="absolute top-1 right-2 pointer-events-none">
                      <span className="sleep-z sleep-z-1 absolute font-graphik text-[8px] text-[#b0b0b0]">z</span>
                      <span className="sleep-z sleep-z-2 absolute font-graphik text-[10px] text-[#b0b0b0]">z</span>
                      <span className="sleep-z sleep-z-3 absolute font-graphik text-[7px] text-[#b0b0b0]">z</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start gap-[4px] pr-[8px]">
                  <span className="nav-name font-graphik text-[14px] text-[#5b5b5e] leading-none transition-colors duration-[250ms]">Joonseo Chang</span>
                  <span className="font-graphik text-[14px] leading-none">
                    <span className="activity-added text-[#c3c3c3] transition-colors duration-[250ms]">+{(githubStats?.added || 0).toLocaleString()}</span>
                    <span className="text-[#c3c3c3]"> </span>
                    <span className="activity-removed text-[#c3c3c3] transition-colors duration-[250ms]">-{(githubStats?.deleted || 0).toLocaleString()}</span>
                  </span>
                </div>
              </button>

              {/* Gary section hover info box - appears when hovering on home button */}
              {(isHomeButtonHovered || isFaceHoverExiting) && (
                <div
                  className={`face-hover-box absolute z-[100] ${isFaceHoverExiting ? 'exiting' : ''}`}
                  onAnimationEnd={() => {
                    if (isFaceHoverExiting) {
                      setIsFaceHoverExiting(false);
                    }
                  }}
                >
                  <div className="face-hover-box-inner rounded-[12px] p-[4px]">
                    <button
                      className="commit-toggle-btn flex items-center gap-[4px] cursor-pointer rounded-[8px] px-[6px] py-[6px] transition-all duration-150"
                      onClick={() => setIsCommitExpanded(!isCommitExpanded)}
                    >
                      <p className="font-graphik text-[14px] leading-normal whitespace-nowrap">
                        <span className="text-[#969494]">Last commit: </span>
                        <span className="text-[#e6eaee]">{githubStats?.lastCommitAt ? getTimeAgo(githubStats.lastCommitAt) : 'recently'}</span>
                      </p>
                      <svg
                        width="12"
                        height="7"
                        viewBox="0 0 12 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="commit-arrow shrink-0 transition-transform duration-200"
                        style={{ transform: isCommitExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <path
                          d="M1 1L6 5.5L11 1"
                          className="transition-[stroke] duration-200"
                          stroke={isCommitExpanded ? '#e6eaee' : '#969494'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center - Navigation Links */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[20px]" aria-label="Main navigation">
            <Link
              to="/about"
              className={`nav-text-link font-graphik text-[14px] hover:text-[#5b5b5e] transition-colors cursor-pointer px-[8px] py-[12px] -mx-[8px] ${location.pathname === '/about' ? 'text-[#5b5b5e]' : 'text-[#9f9fa3]'}`}
              onClick={playClick}
            >
              About
            </Link>
            <button
              className="nav-text-link font-graphik text-[14px] text-[#9f9fa3] hover:text-[#5b5b5e] transition-colors cursor-pointer px-[8px] py-[12px] -mx-[8px]"
              onClick={playClick}
            >
              Projects
            </button>
            <button
              className="nav-text-link font-graphik text-[14px] text-[#9f9fa3] hover:text-[#5b5b5e] transition-colors cursor-pointer px-[8px] py-[12px] -mx-[8px]"
              onClick={playClick}
            >
              Gallery
            </button>
            <button
              className="nav-text-link font-graphik text-[14px] text-[#9f9fa3] hover:text-[#5b5b5e] transition-colors cursor-pointer px-[8px] py-[12px] -mx-[8px]"
              onClick={playClick}
            >
              Notes
            </button>
            <button
              className="nav-text-link font-graphik text-[14px] text-[#9f9fa3] hover:text-[#5b5b5e] transition-colors cursor-pointer px-[8px] py-[12px] -mx-[8px]"
              onClick={playClick}
            >
              Extra
            </button>
          </nav>

          {/* Right - Search Input (hidden on mobile) */}
          {!isTabletOrBelow && (
            <div
              className={`nav-search-button relative border h-[37px] pl-[10px] pr-[7px] py-[6px] rounded-[8px] flex items-center justify-between cursor-pointer group transition-all duration-[250ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] ${searchFocused ? 'w-[280px] bg-white border-[#d8d8d8] shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_0.5px_0_rgba(255,255,255,0.6)]' : 'w-[197px] bg-[#f7f7f7] border-[#eaeaea] shadow-[0_0.5px_1px_rgba(0,0,0,0.03),0_1px_1px_rgba(0,0,0,0.02),inset_0_0.5px_0_rgba(255,255,255,0.5),inset_0_-0.5px_0_rgba(0,0,0,0.015)] hover:bg-[#fcfcfc] hover:border-[#e0e0e0] hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.03),inset_0_0.5px_0_rgba(255,255,255,0.6),inset_0_-0.5px_0_rgba(0,0,0,0.02)] hover:-translate-y-[0.5px]'}`}
              onClick={() => {
                if (!searchFocused) {
                  playClick();
                  setSearchFocused(true);
                  setTimeout(() => searchInputRef.current?.focus(), 10);
                }
              }}
              role="search"
              aria-label="Search - Ask me anything"
            >
              {searchFocused ? (
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setSearchFocused(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent font-graphik text-[14px] text-[#333] placeholder-[#8f8f8f] outline-none"
                  autoFocus
                />
              ) : (
                <span className="font-graphik text-[14px] text-[#8f8f8f] group-hover:text-[#666] whitespace-nowrap transition-colors duration-[180ms]">Ask me anything...</span>
              )}
              <span className={`bg-[#eeeeee] border border-[#e0e0e0] shadow-[0_0.5px_1px_rgba(0,0,0,0.04),inset_0_0.5px_0_rgba(255,255,255,0.4),inset_0_-0.5px_0_rgba(0,0,0,0.02)] h-[25px] w-[29px] rounded-[5px] flex items-center justify-center transition-all duration-[180ms] flex-shrink-0 ${searchFocused ? '' : 'group-hover:bg-[#e9e9e9] group-hover:border-[#d8d8d8]'}`}>
                <span className={`font-graphik text-[12px] text-[#888] transition-colors duration-[180ms] ${searchFocused ? '' : 'group-hover:text-[#666]'}`}>⌘J</span>
              </span>
            </div>
          )}

          {/* Hamburger Menu Button (mobile only) */}
          {isTabletOrBelow && (
            <button
              className="mobile-hamburger w-[37px] h-[37px] flex items-center justify-center rounded-[8px] cursor-pointer bg-[#f7f7f7] border border-[#eaeaea] shadow-[0_0.5px_1px_rgba(0,0,0,0.03),0_1px_1px_rgba(0,0,0,0.02)] hover:bg-[#fcfcfc] hover:border-[#e0e0e0] transition-all duration-150"
              onClick={() => {
                playClick();
                setIsMobileMenuOpen(prev => !prev);
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <div className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {isTabletOrBelow && (
          <div
            ref={mobileMenuRef}
            className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}
          >
            <nav className="flex flex-col px-[16px] pt-[8px] pb-[16px] gap-[4px]" aria-label="Mobile navigation">
              <Link
                to="/about"
                className={`mobile-nav-link font-graphik text-[15px] py-[12px] px-[12px] rounded-[8px] transition-colors ${location.pathname === '/about' ? 'text-[#333] bg-[#f3f3f3]' : 'text-[#5b5b5e]'}`}
                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
              >
                About
              </Link>
              <button
                className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
              >
                Projects
              </button>
              <button
                className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
              >
                Gallery
              </button>
              <button
                className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
              >
                Notes
              </button>
              <button
                className="mobile-nav-link font-graphik text-[15px] text-[#5b5b5e] py-[12px] px-[12px] rounded-[8px] text-left transition-colors"
                onClick={() => { playClick(); setIsMobileMenuOpen(false); }}
              >
                Extra
              </button>

              {/* Search in drawer */}
              <div className="mt-[8px] pt-[12px] border-t border-[#eaeaea]">
                <div
                  className="relative border h-[37px] pl-[10px] pr-[7px] py-[6px] rounded-[8px] flex items-center justify-between bg-[#f7f7f7] border-[#eaeaea] w-full"
                  role="search"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent font-graphik text-[14px] text-[#333] placeholder-[#8f8f8f] outline-none"
                  />
                  <span className="bg-[#eeeeee] border border-[#e0e0e0] h-[25px] w-[29px] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <span className="font-graphik text-[12px] text-[#888]">{isMac ? '⌘J' : '⌃J'}</span>
                  </span>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* Bottom border line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#EAEAEA]"></div>
      </div>

      {/* Main Content - Both pages always mounted, toggled via display */}
      <div style={{ display: location.pathname === '/about' ? 'block' : 'none' }}>
        <div className="page-enter"><About /></div>
      </div>

      <main id="main-content" className="page-enter w-full min-h-screen items-center justify-center py-[120px] mt-[-10px]" style={{ display: location.pathname === '/' ? 'flex' : 'none' }}>
        <div className="flex gap-[50px] items-start text-left main-content-wrapper">
          {/* Left Column - Text Content (display:contents on mobile for reordering) */}
          <div className="flex flex-col w-[375px] home-left-column">
            {/* Time Component - Expandable Ambient Context Card */}
            <div
              ref={clockCardRef}
              className={`home-time-component mb-[15px] ${loadedComponents.timeComponent ? 'component-loaded' : 'component-hidden'}`}
            >
              {/* Original Clock Pill */}
              <div
                onClick={() => setIsClockExpanded(true)}
                className="bg-white border border-[#ebeef5] flex gap-[6px] h-[35px] items-center justify-center pt-[10px] pr-[10px] pb-[10px] pl-[8px] rounded-[20px] w-fit cursor-pointer select-none"
                style={{
                  boxShadow: '0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.015)',
                  opacity: isClockExpanded ? 0 : 1,
                  transition: 'opacity 150ms ease',
                  pointerEvents: isClockExpanded ? 'none' : 'auto',
                }}
              >
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block max-w-none size-full">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const angle = (i * 6 - 90) * (Math.PI / 180);
                      const isHourMarker = i % 5 === 0;
                      const outerRadius = 9.5;
                      const innerRadius = isHourMarker ? 8.5 : 9;
                      return (
                        <line key={`minute-${i}`} x1={10 + Math.cos(angle) * innerRadius} y1={10 + Math.sin(angle) * innerRadius} x2={10 + Math.cos(angle) * outerRadius} y2={10 + Math.sin(angle) * outerRadius} stroke="#C3C3C3" strokeWidth={isHourMarker ? "0.8" : "0.4"} strokeLinecap="round" />
                      );
                    })}
                    <line x1="10" y1="10" x2="10" y2="6" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.hours * 30 + clockTime.minutes * 0.5} 10 10)`} />
                    <line x1="10" y1="10" x2="10" y2="3.5" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.minutes * 6 + clockTime.seconds * 0.1} 10 10)`} />
                    <line x1="10" y1="10" x2="10" y2="2.5" stroke="#FF0000" strokeWidth="0.6" strokeLinecap="round" transform={`rotate(${(clockTime.seconds + clockTime.milliseconds / 1000) * 6} 10 10)`} />
                    <circle cx="10" cy="10" r="0.8" fill="#111112"/>
                  </svg>
                </div>
                <div className="flex font-graphik gap-[8px] items-center justify-center leading-[0] text-[14px] whitespace-nowrap">
                  <div className="flex flex-col justify-center text-[#5b5b5e]">
                    <p className="leading-[normal]">{clockTimeString || '2:02 PM'}</p>
                  </div>
                  <div className="flex flex-col justify-center text-[#c3c3c3]">
                    <p className="leading-[normal]">{getCopy('clock_location')}</p>
                  </div>
                </div>
              </div>
            </div>
            <h1 className={`home-heading font-calluna font-normal leading-[29px] text-[#333] text-[21px] w-[317px] whitespace-pre-wrap mb-[10px] ${loadedComponents.h1 ? 'component-loaded' : 'component-hidden'}`}>
              {getCopy('hero_headline')}
            </h1>
            <div className={`home-bio font-graphik leading-[25px] text-[#5b5b5e] text-[14px] whitespace-pre-wrap ${loadedComponents.bodyParagraphs ? 'component-loaded' : 'component-hidden'}`}>
              <p className="mb-[10px]">
                {renderCopy('bio_intro')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_current')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_mobbin')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_hanriver')}
              </p>
              <p className="mb-[10px]">
                {renderCopy('bio_grants')}
              </p>
            </div>
          </div>

          {/* Right Column - Video Card */}
            <div
              className={`home-video-frame group video-frame-hover flex flex-col h-[470px] items-start justify-end rounded-[14px] w-[346px] relative overflow-visible outline outline-1 outline-black/5 cursor-default -mt-[35px] ${loadedComponents.videoFrame ? 'component-loaded' : 'component-hidden'} ${isMobileOrTablet && mobileMetadataExpanded ? 'mobile-expanded' : ''}`}
              onMouseEnter={() => {
                if (isMobileOrTablet) return; // No hover on mobile
                // Set ref FIRST to prevent race condition with jiggle interval
                isHoveredRef.current = true;
                setShowJiggle(false);
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                if (isMobileOrTablet) return; // No hover on mobile
                setIsHovered(false);
                isHoveredRef.current = false;
              }}
              onClick={() => {
                // Mobile/tablet: toggle metadata box on tap
                if (isMobileOrTablet) {
                  setMobileMetadataExpanded(prev => !prev);
                  setShowJiggle(false);
                  if (!hasDiscoveredContent) {
                    setHasDiscoveredContent(true);
                  }
                }
              }}
            >
              {/* Loading indicator during video transitions */}
              {videoLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 rounded-[14px] pointer-events-none">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              )}
            <div className="absolute inset-0 rounded-[14px] overflow-hidden z-0 bg-[#f5f5f5]">
              {/* Poster background - shows while video loads */}
              {safeVideoData[videoIndex] && (
                <div
                  className="absolute inset-0 z-5 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getPosterSrc(safeVideoData[videoIndex].src)})`,
                    filter: safeVideoData[videoIndex].noExposureBoost ? 'none' : 'brightness(1.10)'
                  }}
                />
              )}
              {/* All videos rendered - active video on top, others hidden */}
              {safeVideoData.map((video, idx) => {
                const isActive = idx === videoIndex;
                return (
                  <video
                    key={video.id || idx}
                    ref={el => {
                      videoElementsRef.current[idx] = el;
                      if (idx === 0) videoRef1.current = el;
                      if (idx === 1) videoRef2.current = el;
                    }}
                    className={`absolute inset-0 w-full h-full object-cover ${video.noExposureBoost ? '' : 'brightness-[1.10]'} ${!isMobileOrTablet ? 'group-hover:brightness-[1.20]' : ''}`}
                    style={{
                      zIndex: isActive ? 20 : 10,
                      opacity: isActive ? 1 : 0,
                      visibility: isActive ? 'visible' : 'hidden',
                      transition: 'filter 250ms ease-in-out',
                      objectFit: 'cover',
                      willChange: isActive ? 'auto' : 'opacity',
                      ...(isMobileOrTablet && mobileMetadataExpanded && { filter: video.noExposureBoost ? 'brightness(1.03)' : 'brightness(1.20)' })
                    }}
                    poster={getPosterSrc(getVideoSrc(video))}
                    muted
                    playsInline
                    preload="auto"
                    controls={false}
                    loop={false}
                    onEnded={handleVideoEnded}
                    onError={(e) => handleVideoError(video.id, e.target)}
                  >
                    <source src={encodeVideoSrc(getVideoSrc(video))} type="video/mp4" />
                  </video>
                );
              })}
            </div>

            {/* Liquid glass info button - archived for now
            <button
              className="info-glass-button absolute top-3 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center
                         opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
                         transition-all duration-300 ease-out
                         hover:!scale-110 active:!scale-95 cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 0 0 0.5px rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Placeholder for future functionality
              }}
              aria-label="Video information"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            */}

            <div
              className="relative z-30 w-full black-box-container" 
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => {
                // Set ref FIRST to prevent race condition with jiggle interval
                isHoveredRef.current = true;
                setShowJiggle(false);
                setIsHovered(true);
              }}
            >
              <div
                className={`bg-[#222122] h-[40px] rounded-[14px] w-full black-box-slide overflow-hidden relative outline outline-1 outline-white/5 ${showJiggle ? 'black-box-jiggle' : ''} ${!isMobileOrTablet ? 'group-hover:h-[130px]' : ''}`}
                style={isMobileOrTablet ? { height: mobileMetadataExpanded ? '130px' : '40px' } : undefined}
              >
                <div className={`absolute left-[12px] right-[12px] top-[12px] flex items-center justify-between transition-all duration-300 ease-in-out min-w-0 max-w-full z-10 ${!isMobileOrTablet ? 'group-hover:items-start group-hover:justify-between' : ''} ${isMobileOrTablet && mobileMetadataExpanded ? 'items-start justify-between' : ''}`}>
                  {safeVideoData[videoIndex] && (
                    <>
                      <p key={videoIndex} className="black-box-text font-graphik leading-[normal] text-[#e6eaee] text-[14px] whitespace-nowrap shrink-0" style={{ color: 'rgba(230, 234, 238, 1)' }}>
                        {safeVideoData[videoIndex].location}
                      </p>
                      <div className="absolute right-0 flex items-center group/coord-wrapper">
                        <a
                          key={videoIndex}
                          href={safeVideoData[videoIndex].coordinatesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="coord-link black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap group-hover/coord-wrapper:text-[#e6eaee] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group-hover/coord-wrapper:-translate-x-[14px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative inline-block"
                          onClick={playClick}
                        >
                          {safeVideoData[videoIndex].coordinates}
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 12 12" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="coord-arrow-svg absolute left-full opacity-0 group-hover/coord-wrapper:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ marginLeft: '2px', top: 'calc(50% - 1px)', transform: 'translateY(-50%)' }}
                          >
                            <path d="M4 2L8 6L4 10" stroke="#E6EAEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </a>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="absolute left-[12px] right-[12px] bottom-[15px] flex items-end justify-between metadata-fade z-10"
                  style={isMobileOrTablet ? { opacity: mobileMetadataExpanded ? 1 : 0, transition: 'opacity 200ms ease' } : undefined}
                >
                  <div className="flex flex-col gap-[8px]">
                    {safeVideoData[videoIndex] && (
                      <>
                        <p key={`camera-${videoIndex}`} className="black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap">
                          {safeVideoData[videoIndex].camera}
                        </p>
                        <p key={`settings-${videoIndex}`} className="black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap">
                          {safeVideoData[videoIndex].aperture} · {safeVideoData[videoIndex].shutter} · ISO <span style={{ color: '#F9F801' }}>{safeVideoData[videoIndex].iso}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className={`flex items-center ${isMobileOrTablet ? 'gap-[10px]' : 'gap-[6px]'}`}>
                    <button
                      className={`arrow-button flex items-center justify-center cursor-pointer ${isMobileOrTablet ? 'h-[38px] w-[40px]' : 'h-[29px] w-[30px]'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playArrow();
                        changeVideo('prev');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('prev');
                      }}
                      aria-label="Previous photo"
                    >
                      <svg width={isMobileOrTablet ? "40" : "30"} height={isMobileOrTablet ? "38" : "29"} viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg" aria-hidden="true">
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" fill="#222122" className="arrow-fill"/>
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" stroke="#4A474A" strokeWidth="1.4" className="arrow-stroke"/>
                        <path d="M16.7706 9.24213C16.9175 9.39721 17 9.60751 17 9.8268C17 10.0461 16.9175 10.2564 16.7706 10.4115L12.8915 14.505L16.7706 18.5985C16.9133 18.7545 16.9923 18.9634 16.9905 19.1802C16.9887 19.397 16.9063 19.6045 16.761 19.7578C16.6157 19.9111 16.4192 19.9981 16.2137 20C16.0082 20.0019 15.8103 19.9185 15.6625 19.7679L11.2294 15.0897C11.0825 14.9346 11 14.7243 11 14.505C11 14.2857 11.0825 14.0754 11.2294 13.9203L15.6625 9.24213C15.8094 9.08709 16.0087 9 16.2165 9C16.4243 9 16.6236 9.08709 16.7706 9.24213Z" fill="#4A474A" className="arrow-path"/>
                      </svg>
                    </button>
                    <button
                      className={`arrow-button flex items-center justify-center cursor-pointer ${isMobileOrTablet ? 'h-[38px] w-[40px]' : 'h-[29px] w-[30px]'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playArrow();
                        changeVideo('next');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('next');
                      }}
                      aria-label="Next photo"
                    >
                      <svg width={isMobileOrTablet ? "40" : "30"} height={isMobileOrTablet ? "38" : "29"} viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg" aria-hidden="true">
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" fill="#222122" className="arrow-fill"/>
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" stroke="#4A474A" strokeWidth="1.4" className="arrow-stroke"/>
                        <path d="M12.5294 19.7579C12.3825 19.6028 12.3 19.3925 12.3 19.1732C12.3 18.9539 12.3825 18.7436 12.5294 18.5885L16.4085 14.495L12.5294 10.4015C12.3867 10.2455 12.3077 10.0366 12.3095 9.81979C12.3113 9.60296 12.3937 9.39554 12.539 9.24221C12.6843 9.08889 12.8808 9.00192 13.0863 9.00003C13.2918 8.99815 13.4897 9.0815 13.6375 9.23214L18.0706 13.9103C18.2175 14.0654 18.3 14.2757 18.3 14.495C18.3 14.7143 18.2175 14.9246 18.0706 15.0797L13.6375 19.7579C13.4906 19.9129 13.2913 20 13.0835 20C12.8757 20 12.6764 19.9129 12.5294 19.7579Z" fill="#4A474A" className="arrow-path"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Component - Born Slippy, Activity, Shortcuts, Contact */}
      <div
        className={`bottom-pill-outer fixed bottom-[50px] left-1/2 transform -translate-x-1/2 h-[64px] ${loadedComponents.bottomComponent ? 'component-loaded' : 'component-hidden'}`}
        style={{
          width: isTabletOrBelow ? undefined : `${musicPillWidth + 1 + 292}px`,
          maxWidth: isTabletOrBelow ? 'calc(100vw - 32px)' : undefined,
          overflow: 'visible',
          transition: 'width 500ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex h-full bottom-pill-container rounded-[14px] relative" style={{ '--music-pill-width': `${musicPillWidth}px` }}>
          {/* Status Tab - aligned to right edge of music hover box, 10px above pill */}
          {(isMusicHovered || isModalExiting) && currentTrack && (
            <div 
              className={`music-status-tab absolute z-[100] ${isModalExiting ? 'exiting' : ''}`}
              onAnimationEnd={() => {
                if (isModalExiting) {
                  setIsModalExiting(false);
                }
              }}
            >
              <div className="status-tab-inner rounded-[8px] px-[12px] py-[7px] flex items-center justify-center gap-[6px]">
                {currentTrack.isNowPlaying ? (
                  <>
                    <div className="audio-waveform flex items-end gap-[2px]">
                      <span className="waveform-bar bar-1"></span>
                      <span className="waveform-bar bar-2"></span>
                      <span className="waveform-bar bar-3"></span>
                      <span className="waveform-bar bar-4"></span>
                    </div>
                    <span className="font-graphik text-[14px] leading-[20px] text-[#e6eaee] whitespace-nowrap">Live now</span>
                  </>
                ) : (
                  <>
                    <span className="font-graphik text-[14px] leading-[20px] whitespace-nowrap">
                      <span className="text-[#969494]">Last seen:</span>
                      <span className="text-[#e6eaee]"> {currentTrack.playedAt ? getTimeAgo(currentTrack.playedAt) : 'recently'}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div
            className="music-pill-wrapper h-[64px] flex items-center pl-[6px] pr-[12px] relative flex-shrink-0"
            style={{ '--music-pill-width': `${musicPillWidth}px`, overflow: 'visible' }}
          >
            <button
              ref={musicButtonRef}
              className="music-player-button h-[48px] w-full flex items-center gap-[10px] pl-[6px] pr-[16px] cursor-pointer group/vinyl"
              onClick={(e) => {
                e.preventDefault();
                playClick();
                if (activeModal === 'music') {
                  setActiveModal(null);
                  setActiveAnchorRef(null);
                } else {
                  setActiveModal('music');
                  setActiveAnchorRef(musicButtonRef);
                }
              }}
              onMouseEnter={() => {
                preloadModalComponents();
                if (modalTimeoutRef.current) {
                  clearTimeout(modalTimeoutRef.current);
                  modalTimeoutRef.current = null;
                }
                setIsModalExiting(false);
                setIsMusicHovered(true);
                // playPreview(); // Disabled for now
              }}
              onMouseLeave={() => {
                stopPreview();
                setIsModalExiting(true);
                modalTimeoutRef.current = setTimeout(() => {
                  setIsMusicHovered(false);
                  setIsModalExiting(false);
                }, 200);
              }}
            >
            <div className="vinyl-container relative shrink-0 w-[40px] h-[40px]">
              {/* Floating music notes - appear on hover */}
              <div className="music-notes-container absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <span className="music-note note-1" style={{ color: '#5B9FD8' }}>♪</span>
                <span className="music-note note-2" style={{ color: '#D67A9A' }}>♫</span>
                <span className="music-note note-3" style={{ color: '#6BB88A' }}>♪</span>
                <span className="music-note note-4" style={{ color: '#E8A85C' }}>♬</span>
              </div>
              
              {/* Vinyl record - always spinning */}
              <div className={`vinyl-record vinyl-spin absolute inset-0 rounded-full flex items-center justify-center ${isPreviewPlaying ? 'vinyl-playing' : ''}`}>
                {/* Vinyl base with sheen */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#0d0d0d]"></div>
                <div className="vinyl-sheen absolute inset-0 rounded-full"></div>
                
                {/* Vinyl grooves - more visible */}
                <div className="absolute inset-[3px] rounded-full border-[0.5px] border-white/[0.07]"></div>
                <div className="absolute inset-[6px] rounded-full border-[0.5px] border-white/[0.05]"></div>
                <div className="absolute inset-[9px] rounded-full border-[0.5px] border-white/[0.06]"></div>
                
                {/* Center label with album art - more prominent */}
                <div className="relative w-[24px] h-[24px] rounded-full flex items-center justify-center overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.5)] z-10 ring-1 ring-black/20">
                  {currentTrack?.albumArtSmall ? (
                    <img
                      src={currentTrack.albumArtSmall}
                      alt={currentTrack.album}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="24"
                      height="24"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-[8px] font-bold">
                        {musicLoading ? '...' : musicError ? '!' : '♪'}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Center hole */}
                <div className="absolute w-[2px] h-[2px] rounded-full bg-[#0a0a0a] z-20"></div>
              </div>
            </div>
            <div className="music-text-container flex flex-col font-graphik text-[14px] justify-center gap-[2px] items-start min-w-0 flex-shrink">
              <MarqueeText
                className="text-[#333] leading-[1.2]"
                maxWidth="calc(var(--music-pill-width, 205px) - 100px)"
              >
                {currentTrack?.name || (musicLoading ? 'Loading...' : 'No recent track')}
              </MarqueeText>
              <MarqueeText
                className="text-[#c3c3c3] leading-[1.2]"
                maxWidth="calc(var(--music-pill-width, 205px) - 100px)"
                delay={3000}
              >
                {currentTrack?.artist || (musicLoading ? '...' : 'Connect Last.fm')}
              </MarqueeText>
            </div>
          </button>
          </div>

          {/* Divider line */}
          <div className="pill-divider w-[1px] h-full bg-[#ebeef5] flex-shrink-0"></div>

          {/* Right side - Buttons */}
          <div className={`pill-buttons-section h-[64px] flex items-center px-[12px] py-[14px] relative flex-shrink-0 ${isTabletOrBelow ? 'gap-[6px] w-auto' : 'gap-[10px] w-[292px]'}`}>
            {/* ⌘K indicator - desktop only */}
            {!isTabletOrBelow && (isShortcutsHovered || isShortcutsModalExiting) && (
              <div
                className={`shortcuts-modal absolute z-[100] ${isShortcutsModalExiting ? 'exiting' : ''}`}
                onAnimationEnd={() => {
                  if (isShortcutsModalExiting) {
                    setIsShortcutsModalExiting(false);
                  }
                }}
              >
                <div className="shortcuts-modal-inner rounded-[8px] px-[12px] py-[7px] flex items-center justify-center">
                  <span className="font-graphik text-[14px] leading-[20px] text-[#5b5b5e] whitespace-nowrap">{isMac ? '⌘K' : 'Ctrl+K'}</span>
                </div>
              </div>
            )}

            {/* Activity and Shortcuts buttons */}
            <div className={`flex h-[37px] ${isTabletOrBelow ? 'w-auto gap-[6px]' : 'w-[177px]'}`}>
              <button
                ref={activityButtonRef}
                className={`bottom-button h-[37px] flex items-center justify-center cursor-pointer ${isTabletOrBelow ? 'w-[37px] rounded-[8px]' : 'rounded-l-[8px] w-[85px]'}`}
                onMouseEnter={preloadModalComponents}
                onClick={() => {
                  playClick();
                  if (activeModal === 'activity') {
                    setActiveModal(null);
                    setActiveAnchorRef(null);
                  } else {
                    setActiveModal('activity');
                    setActiveAnchorRef(activityButtonRef);
                  }
                }}
              >
                {isTabletOrBelow ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="#999" strokeWidth="1"/><path d="M9 3V9H14" stroke="#999" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <p className="font-graphik text-[14px] text-[#5b5b5e]">Timeline</p>
                )}
              </button>
              <button
                ref={shortcutsButtonRef}
                className={`bottom-button h-[37px] flex items-center justify-center cursor-pointer ${isShortcutsActive ? 'active' : ''} ${isTabletOrBelow ? 'w-[37px] rounded-[8px]' : 'rounded-r-[8px] w-[92px]'}`}
                onMouseEnter={() => {
                  preloadModalComponents();
                  if (shortcutsModalTimeoutRef.current) {
                    clearTimeout(shortcutsModalTimeoutRef.current);
                    shortcutsModalTimeoutRef.current = null;
                  }
                  setIsShortcutsModalExiting(false);
                  setIsShortcutsHovered(true);
                }}
                onClick={() => { playClick(); setActiveModal('shortcuts'); }}
                onMouseLeave={() => {
                  setIsShortcutsModalExiting(true);
                  shortcutsModalTimeoutRef.current = setTimeout(() => {
                    setIsShortcutsHovered(false);
                    setIsShortcutsModalExiting(false);
                  }, 200);
                }}
              >
                {isTabletOrBelow ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="5" width="14" height="9" rx="1.5" stroke="#999" strokeWidth="1"/><path d="M5 8.5H6.5M8 8.5H10M11.5 8.5H13M6 11H12" stroke="#999" strokeWidth="1" strokeLinecap="round"/></svg>
                ) : (
                  <p className="font-graphik text-[14px] text-[#5b5b5e]">Shortcuts</p>
                )}
              </button>
            </div>

            {/* Contact button */}
            <button
              ref={contactButtonRef}
              className={`bottom-button h-[37px] rounded-[8px] flex items-center justify-center cursor-pointer ${isTabletOrBelow ? 'w-[37px]' : 'w-[81px]'}`}
              onMouseEnter={preloadModalComponents}
              onClick={() => {
                playClick();
                if (activeModal === 'contact') {
                  setActiveModal(null);
                  setActiveAnchorRef(null);
                } else {
                  setActiveModal('contact');
                  setActiveAnchorRef(contactButtonRef);
                }
              }}
            >
              {isTabletOrBelow ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="#999" strokeWidth="1"/><path d="M2 6L9 11L16 6" stroke="#999" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <p className="font-graphik text-[14px] text-[#5b5b5e]">Contact</p>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Slide Up Modal - Lazy loaded with Framer Motion */}
      <Suspense fallback={null}>
        <SlideUpModal
          isOpen={activeModal !== null}
          onClose={() => setActiveModal(null)}
          type={activeModal || 'contact'}
          anchorRef={activeAnchorRef}
        >
          <Suspense fallback={<div className="p-4 text-center text-gray-400" role="status" aria-live="polite">Loading...</div>}>
            {activeModal === 'music' && <MusicModalContent currentTrack={currentTrack} />}
            {activeModal === 'activity' && <ActivityModalContent />}
            {activeModal === 'shortcuts' && <ShortcutsModalContent isMac={isMac} />}
            {activeModal === 'contact' && <ContactModalContent />}
          </Suspense>
        </SlideUpModal>
      </Suspense>
    </div>
    {import.meta.env.DEV && <Agentation />}

    {/* Ambient Context Card - fixed overlay, rendered outside layout */}
    {isClockExpanded && (
      <div
        className="ambient-card-backdrop"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
        onClick={() => setIsClockExpanded(false)}
      >
        <div
          className="ambient-card font-graphik w-[300px] max-w-[calc(100vw-32px)] rounded-[14px] overflow-hidden select-none"
          style={{
            position: 'fixed',
            top: (() => { const el = clockCardRef.current; if (!el) return 0; return el.getBoundingClientRect().top; })(),
            left: (() => { const el = clockCardRef.current; if (!el) return 0; return el.getBoundingClientRect().left; })(),
            background: 'linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)',
            border: '1px solid rgba(235, 238, 245, 0.85)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.02)',
            transformOrigin: 'top left',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="ambient-card-content p-[12px] flex flex-col gap-[10px]">
            {/* Clock Row at top */}
            <div
              onClick={() => setIsClockExpanded(false)}
              className="flex gap-[6px] items-center h-[31px] rounded-[8px] w-fit cursor-pointer"
              style={{ transition: 'background 200ms ease' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="overflow-clip relative shrink-0 size-[18px]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block max-w-none size-full">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i * 6 - 90) * (Math.PI / 180);
                    const isHourMarker = i % 5 === 0;
                    const outerRadius = 9.5;
                    const innerRadius = isHourMarker ? 8.5 : 9;
                    return (
                      <line key={`em-${i}`} x1={10 + Math.cos(angle) * innerRadius} y1={10 + Math.sin(angle) * innerRadius} x2={10 + Math.cos(angle) * outerRadius} y2={10 + Math.sin(angle) * outerRadius} stroke="#C3C3C3" strokeWidth={isHourMarker ? "0.8" : "0.4"} strokeLinecap="round" />
                    );
                  })}
                  <line x1="10" y1="10" x2="10" y2="6" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.hours * 30 + clockTime.minutes * 0.5} 10 10)`} />
                  <line x1="10" y1="10" x2="10" y2="3.5" stroke="#111112" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${clockTime.minutes * 6 + clockTime.seconds * 0.1} 10 10)`} />
                  <line x1="10" y1="10" x2="10" y2="2.5" stroke="#FF0000" strokeWidth="0.6" strokeLinecap="round" transform={`rotate(${(clockTime.seconds + clockTime.milliseconds / 1000) * 6} 10 10)`} />
                  <circle cx="10" cy="10" r="0.8" fill="#111112"/>
                </svg>
              </div>
              <div className="flex gap-[6px] items-center leading-[0] text-[13px] whitespace-nowrap">
                <span className="text-[#5b5b5e] leading-[normal]">{clockTimeString || '2:02 PM'}</span>
                <span className="text-[#c3c3c3] leading-[normal]">{getCopy('clock_location')}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full" style={{ background: 'rgba(235, 238, 245, 0.85)' }} />

            {/* Mini Map */}
            <div className="w-full h-[100px] rounded-[8px] overflow-hidden relative" style={{ background: '#1e1e1f' }}>
              {(() => {
                const zoom = 12;
                const latRad = clockCoords.lat * Math.PI / 180;
                const n = Math.pow(2, zoom);
                const centerX = ((clockCoords.lng + 180) / 360) * n;
                const centerY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
                const baseTileX = Math.floor(centerX);
                const baseTileY = Math.floor(centerY);
                const offsetX = (centerX - baseTileX) * 256;
                const offsetY = (centerY - baseTileY) * 256;
                const shiftX = 138 - offsetX;
                const shiftY = 50 - offsetY;
                const tiles = [];
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    tiles.push(
                      <img key={`${dx}-${dy}`} src={`https://a.basemaps.cartocdn.com/dark_all/${zoom}/${baseTileX + dx}/${baseTileY + dy}@2x.png`} alt="" style={{ position: 'absolute', left: `${shiftX + dx * 256}px`, top: `${shiftY + dy * 256}px`, width: '256px', height: '256px' }} draggable={false} />
                    );
                  }
                }
                return tiles;
              })()}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-[#e6eaee] z-10" style={{ boxShadow: '0 0 4px rgba(230,234,238,0.4)' }} />
            </div>

            {/* Weather */}
            <div className="flex items-baseline gap-[8px] px-[2px]">
              {ambientWeather ? (
                <>
                  <span className="text-[22px] font-medium text-[#1a1a1a] leading-none">{ambientWeather.temperature}°</span>
                  <span className="text-[14px] text-[#999] leading-none">{ambientWeather.condition}</span>
                </>
              ) : (
                <span className="text-[14px] text-[#c3c3c3] leading-none">Loading weather...</span>
              )}
            </div>

            {/* Sun Arc */}
            {ambientSun && (
              <div className="px-[2px]">
                <svg viewBox="0 0 276 52" fill="none" className="w-full">
                  <path d="M 10 46 Q 138 -10 266 46" stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none" />
                  <line x1="10" y1="46" x2="266" y2="46" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  {ambientSun.isUp && (() => {
                    const t = ambientSun.progress;
                    const x = (1-t)*(1-t)*10 + 2*(1-t)*t*138 + t*t*266;
                    const y = (1-t)*(1-t)*46 + 2*(1-t)*t*(-10) + t*t*46;
                    return <circle cx={x} cy={y} r="3.5" fill="#1a1a1a" />;
                  })()}
                </svg>
                <div className="flex justify-between px-[2px] mt-[2px]">
                  <span className="text-[11px] text-[#999] uppercase tracking-wide">{ambientSun.sunriseFormatted}</span>
                  <span className="text-[11px] text-[#999] uppercase tracking-wide">{ambientSun.sunsetFormatted}</span>
                </div>
              </div>
            )}

            {/* Moon Phase */}
            {ambientMoon && (
              <div className="flex items-center gap-[8px] px-[2px]">
                <div className="w-[16px] h-[16px] rounded-full shrink-0" style={{
                  background: (() => {
                    const phase = ambientMoon.phase;
                    const lit = '#e6eaee';
                    const dark = '#c3c3c3';
                    if (phase < 0.03 || phase > 0.97) return dark;
                    if (phase > 0.47 && phase < 0.53) return lit;
                    if (phase < 0.5) { const pct = Math.round(phase * 200); return `linear-gradient(90deg, ${dark} ${100-pct}%, ${lit} ${100-pct}%)`; }
                    else { const pct = Math.round((1-phase) * 200); return `linear-gradient(90deg, ${lit} ${pct}%, ${dark} ${pct}%)`; }
                  })(),
                  border: '1px solid rgba(0,0,0,0.06)',
                }} />
                <span className="text-[14px] text-[#999] leading-none">{ambientMoon.phaseName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default App


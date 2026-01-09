import { useState, useEffect, useRef } from 'react'
import { useLastFm } from './hooks/useLastFm'

// Image URLs from Figma (valid for 7 days)
const imgRectangle316 = "https://www.figma.com/api/mcp/asset/8d33530d-0256-40f5-be5d-e642c6a86c84";
const imgFrame223 = "https://www.figma.com/api/mcp/asset/30286a38-278c-48f0-9f18-06d88761b814";
const imgLine5 = "https://www.figma.com/api/mcp/asset/e24604e5-5571-4d0f-ab1d-aed70112aa6f";
const imgGroup = "https://www.figma.com/api/mcp/asset/61c7aa82-f3ce-422a-beda-513c99c4bdb8";

function App() {
  const [clockTimeString, setClockTimeString] = useState('');
  const [clockTime, setClockTime] = useState({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  
  // Loader state - shows coordinates while videos preload
  const [isLoading, setIsLoading] = useState(true);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [coordFading, setCoordFading] = useState(false);
  const videoCacheRef = useRef(new Set()); // Track which videos are fully cached
  const loaderMinTimeRef = useRef(false); // Minimum loader display time
  
  // Last.fm integration
  const { currentTrack, isLoading: musicLoading, error: musicError } = useLastFm();
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(1); // 1 or 2, tracks which video element is visible
  const video1IndexRef = useRef(0); // Which video data index is in video1
  const video2IndexRef = useRef(1); // Which video data index is in video2
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedComponents, setLoadedComponents] = useState({
    timeComponent: false,
    h1: false,
    bodyParagraphs: false,
    videoFrame: false,
    bottomComponent: false
  });
  const [showJiggle, setShowJiggle] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMusicHovered, setIsMusicHovered] = useState(false);
  const [isModalExiting, setIsModalExiting] = useState(false);
  const [isShortcutsHovered, setIsShortcutsHovered] = useState(false);
  const [isShortcutsModalExiting, setIsShortcutsModalExiting] = useState(false);
  const [isShortcutsActive, setIsShortcutsActive] = useState(false);
  const [isMac, setIsMac] = useState(true);
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
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark">
            {linkMatch[1]}
          </a>
        );
      } else if (spanMatch) {
        return <span key={i} className="dotted-underline-grey text-grey-dark">{spanMatch[1]}</span>;
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
      const isDev = import.meta.env.DEV;
      
      try {
        // Fetch both in parallel with timeout
        const [mediaJson, copyJson] = await Promise.allSettled([
          fetchWithTimeout(isDev ? '/api/collections/homepage-media' : '/cms-data/homepage-media.json', 5000),
          fetchWithTimeout(isDev ? '/api/collections/website-copy' : '/cms-data/website-copy.json', 5000)
        ]);
        
        // Handle media data
        if (mediaJson.status === 'fulfilled') {
          const newMediaHash = JSON.stringify(mediaJson.value.data);
          if (newMediaHash !== lastMediaHashRef.current) {
            lastMediaHashRef.current = newMediaHash;
            setVideoData(mediaJson.value.data || []);
          }
        } else {
          console.warn('Failed to fetch media data:', mediaJson.reason);
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
        } else {
          console.warn('Failed to fetch website copy:', copyJson.reason);
        }
        
        // If both failed, try static imports as fallback
        if (mediaJson.status === 'rejected' && copyJson.status === 'rejected') {
          try {
            const [mediaModule, copyModule] = await Promise.all([
              import('../cms-data/homepage-media.json'),
              import('../cms-data/website-copy.json')
            ]);
            setVideoData(mediaModule.default.data || []);
            const copyObj = {};
            (copyModule.default.data || []).forEach(item => {
              copyObj[item.key] = item.content;
            });
            setWebsiteCopy(copyObj);
          } catch (fallbackError) {
            console.error('Fallback import also failed:', fallbackError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CMS data:', error);
        // Try static imports as last resort
        try {
          const [mediaModule, copyModule] = await Promise.all([
            import('../cms-data/homepage-media.json'),
            import('../cms-data/website-copy.json')
          ]);
          setVideoData(mediaModule.default.data || []);
          const copyObj = {};
          (copyModule.default.data || []).forEach(item => {
            copyObj[item.key] = item.content;
          });
          setWebsiteCopy(copyObj);
        } catch (fallbackError) {
          console.error('All CMS data loading methods failed:', fallbackError);
        }
      }
    };
    
    fetchCmsData();
    
    // In dev mode, poll every 2 seconds for CMS changes (works in Cursor browser)
    const isDev = import.meta.env.DEV;
    let pollInterval;
    if (isDev) {
      pollInterval = setInterval(fetchCmsData, 2000);
    }
    
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

  // Command+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();
        
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
  }, []);

  // Handle video ended event - auto-advance to next video
  const handleVideoEnded = (e) => {
    // Prevent handling if we're already transitioning
    if (isTransitioningRef.current) {
      return;
    }
    
    const video = e.target;
    
    // If hovered, the loop attribute should handle restarting automatically
    // But if loop didn't work for some reason, manually restart
    if (isHoveredRef.current) {
      // When hovered, loop should be true, so video should restart automatically
      // But as a safety measure, if loop is false, manually restart
      if (video && !video.loop) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If play fails and we're no longer hovered, advance
            if (!isHoveredRef.current) {
              changeVideo('next');
            }
          });
        }
      }
      // If loop is true, the video will restart automatically, so we do nothing
    } else {
      // When NOT hovered, ensure loop is false and advance to next video
      if (video) {
        video.loop = false; // Explicitly disable loop
      }
      // Advance to next video
      changeVideo('next');
    }
  };

  // Track transition state for cancellation
  const transitionIdRef = useRef(0);
  const pendingDirectionRef = useRef(null);
  const targetVideoIndexRef = useRef(0); // Track ultimate target when clicking fast
  
  // Preload video on hover for faster transitions
  const preloadVideoOnHover = (direction) => {
    if (videoData.length === 0 || isTransitioningRef.current) return;
    
    const baseIndex = isTransitioningRef.current ? targetVideoIndexRef.current : videoIndex;
    const targetIndex = direction === 'next' 
      ? (baseIndex + 1) % videoData.length 
      : (baseIndex - 1 + videoData.length) % videoData.length;
    
    // Determine which video element to use for preloading
    const inactiveRef = activeVideo === 1 ? videoRef2 : videoRef1;
    
    if (inactiveRef.current) {
      const sourceElement = inactiveRef.current.querySelector('source');
      if (sourceElement && videoData[targetIndex]) {
        const targetVideoSrc = videoData[targetIndex].src;
        const currentSrcFile = (sourceElement.src || '').split('/').pop();
        const targetSrcFile = targetVideoSrc.split('/').pop();
        
        // Only preload if it's a different video
        if (currentSrcFile !== targetSrcFile) {
          sourceElement.src = targetVideoSrc;
          inactiveRef.current.load();
          // Set preload to auto for aggressive preloading on hover
          inactiveRef.current.preload = 'auto';
        }
      }
    }
  };

  const changeVideo = (direction) => {
    // Don't change if no video data
    if (videoData.length === 0) return;
    
    // Cancel any pending transition immediately
    transitionIdRef.current++;
    const thisTransitionId = transitionIdRef.current;
    
    // Calculate target based on current target (for rapid clicking)
    const baseIndex = isTransitioningRef.current ? targetVideoIndexRef.current : videoIndex;
    const nextIndex = direction === 'next' 
      ? (baseIndex + 1) % videoData.length 
      : (baseIndex - 1 + videoData.length) % videoData.length;
    
    // Update target immediately
    targetVideoIndexRef.current = nextIndex;
    
    // If already transitioning, queue this and let current finish or get cancelled
    if (isTransitioningRef.current) {
      pendingDirectionRef.current = direction;
      // Force reset after a short delay to handle rapid clicks
      setTimeout(() => {
        if (transitionIdRef.current === thisTransitionId && pendingDirectionRef.current) {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          const dir = pendingDirectionRef.current;
          pendingDirectionRef.current = null;
          changeVideo(dir);
        }
      }, 50);
      return;
    }
    
    pendingDirectionRef.current = null;
    setIsTransitioning(true);
    isTransitioningRef.current = true;
    
    const currentRef = activeVideo === 1 ? videoRef1 : videoRef2;
    const nextRef = activeVideo === 1 ? videoRef2 : videoRef1;
    const nextActive = activeVideo === 1 ? 2 : 1;
    
    // Update which video is in the next video element
    if (nextActive === 1) {
      video1IndexRef.current = nextIndex;
    } else {
      video2IndexRef.current = nextIndex;
    }
    
    // Process transition
    requestAnimationFrame(() => {
      // Check if this transition was cancelled
      if (transitionIdRef.current !== thisTransitionId) {
        // Process pending if exists
        if (pendingDirectionRef.current) {
          const dir = pendingDirectionRef.current;
          pendingDirectionRef.current = null;
          isTransitioningRef.current = false;
          changeVideo(dir);
        }
        return;
      }
      
      if (!nextRef.current) {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
        return;
      }
      
      // Ensure the correct video source is loaded
      const sourceElement = nextRef.current.querySelector('source');
      const nextVideoSrc = videoData[nextIndex].src;
      const currentSrc = sourceElement?.src || '';
      const needsLoad = !currentSrc.endsWith(nextVideoSrc);
      
      // Complete the switch after video is confirmed rendering
      const completeSwitch = () => {
        if (transitionIdRef.current !== thisTransitionId) {
          // Process pending
          if (pendingDirectionRef.current) {
            const dir = pendingDirectionRef.current;
            pendingDirectionRef.current = null;
            isTransitioningRef.current = false;
            changeVideo(dir);
          }
          return;
        }
        
        // Swap z-index - new video is now on top
        setVideoIndex(nextIndex);
        setActiveVideo(nextActive);
        
        // Pause old video and check for pending
        setTimeout(() => {
          if (currentRef.current) {
            currentRef.current.pause();
          }
          
          setIsTransitioning(false);
          isTransitioningRef.current = false;
          
          // Process any pending direction
          if (pendingDirectionRef.current) {
            const dir = pendingDirectionRef.current;
            pendingDirectionRef.current = null;
            changeVideo(dir);
          }
        }, 30);
      };
      
      // Start playing and wait for rendering - optimized for speed
      const startPlaying = () => {
        if (transitionIdRef.current !== thisTransitionId) return;
        if (!nextRef.current) return;
        
        // Check readyState immediately - if we have enough data, switch right away
        if (nextRef.current.readyState >= 3) {
          // HAVE_FUTURE_DATA - enough data to play smoothly
          nextRef.current.currentTime = 0;
          const playPromise = nextRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => completeSwitch()).catch(() => completeSwitch());
          } else {
            completeSwitch();
          }
          return;
        }
        
        // If readyState >= 2, we have current data - start playing immediately
        if (nextRef.current.readyState >= 2) {
          nextRef.current.currentTime = 0;
          const playPromise = nextRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (transitionIdRef.current !== thisTransitionId) return;
              // Reduced to 1 frame wait for faster transitions
              requestAnimationFrame(() => {
                if (transitionIdRef.current === thisTransitionId && nextRef.current && nextRef.current.currentTime > 0.01) {
                  completeSwitch();
                } else {
                  completeSwitch();
                }
              });
            }).catch(() => completeSwitch());
          } else {
            completeSwitch();
          }
          return;
        }
        
        // Fallback: wait for video to load
        nextRef.current.currentTime = 0;
        const playPromise = nextRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (transitionIdRef.current !== thisTransitionId) return;
            
            // Wait for frames to ensure video is rendering - reduced to 1 frame
            let frameCount = 0;
            const waitForFrames = () => {
              if (transitionIdRef.current !== thisTransitionId) return;
              frameCount++;
              
              // Wait for 1 frame AND currentTime > 0 (optimized for speed)
              if (nextRef.current && nextRef.current.currentTime > 0.01 && frameCount >= 1) {
                completeSwitch();
              } else if (frameCount < 4) {
                requestAnimationFrame(waitForFrames);
              } else {
                completeSwitch();
              }
            };
            requestAnimationFrame(waitForFrames);
          }).catch(() => {
            completeSwitch();
          });
        } else {
          completeSwitch();
        }
      };
      
      // Track if we've started
      let hasStarted = false;
      const tryStart = () => {
        if (hasStarted || transitionIdRef.current !== thisTransitionId) return;
        hasStarted = true;
        startPlaying();
      };
      
      // Check readyState immediately before setting up listeners
      if (!needsLoad && nextRef.current.readyState >= 2) {
        // Video already has data - start immediately
        tryStart();
        return;
      }
      
      // Set up listeners BEFORE calling load
      nextRef.current.addEventListener('canplaythrough', tryStart, { once: true });
      nextRef.current.addEventListener('canplay', tryStart, { once: true });
      
      // If video needs to be loaded, load it
      if (needsLoad) {
        if (sourceElement) {
          sourceElement.src = nextVideoSrc;
        }
        nextRef.current.load();
      } else if (nextRef.current.readyState >= 2) {
        // Video is already loaded and ready - check readyState >= 2 (HAVE_CURRENT_DATA)
        tryStart();
      }
      
      // Faster fallback for rapid clicking - reduced from 500ms to 200ms
      setTimeout(() => {
        if (!hasStarted && transitionIdRef.current === thisTransitionId) {
          tryStart();
        }
      }, 200);
    });
  };

  // Detect Safari and add class for underline fallback
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      document.documentElement.classList.add('safari');
    }
  }, []);

  // Trigger component load animations in sequence
  useEffect(() => {
    // Time component appears first
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, timeComponent: true }));
    }, 50);
    
    // H1 appears second
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, h1: true }));
    }, 120);
    
    // Body paragraphs appear third
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bodyParagraphs: true }));
    }, 190);
    
    // Video frame appears fourth
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, videoFrame: true }));
    }, 260);
    
    // Bottom component appears last
    setTimeout(() => {
      setLoadedComponents(prev => ({ ...prev, bottomComponent: true }));
    }, 330);
  }, []);

  // Trigger subtle jiggle animation: initial after 8s, then every 5s. Pause on hover, then resume 15s after leaving.
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

    const startJiggle = () => {
      // Always check the ref for current hover state
      if (isHoveredRef.current) return;
      setShowJiggle(true);
      jiggleTimeoutRef.current = setTimeout(() => {
        setShowJiggle(false);
        jiggleTimeoutRef.current = null;
      }, 600);
    };

    const startJiggleCycle = () => {
      if (jiggleIntervalRef.current) {
        clearInterval(jiggleIntervalRef.current);
      }
      jiggleIntervalRef.current = setInterval(() => {
        // Always check the ref for current hover state
        if (!isHoveredRef.current) {
          startJiggle();
        }
      }, 5000);
    };

    if (isHovered) {
      // Stop everything immediately
      setShowJiggle(false);
      clearAllJiggleTimers();
    } else {
      // Start jiggle cycle after delay
      jigglePauseTimeoutRef.current = setTimeout(() => {
        // Check ref before starting
        if (!isHoveredRef.current) {
          startJiggle();
          startJiggleCycle();
        }
      }, 8000);
    }

    return () => {
      clearAllJiggleTimers();
    };
  }, [isHovered]);

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


  // Aggressive video preloading: Fully download and cache all videos
  useEffect(() => {
    if (videoData.length === 0) return;
    
    // Preload all videos fully using fetch API with blob storage
    // This ensures videos are completely cached and never need to reload
    const preloadVideo = async (video, index) => {
      try {
        const response = await fetch(video.src);
        if (response.ok) {
          // Read the entire response to cache it
          await response.blob();
          videoCacheRef.current.add(video.src);
        }
      } catch (e) {
        // Silently fail - video will load when needed
      }
    };
    
    // Start preloading all videos immediately
    videoData.forEach((video, index) => {
      // Slight stagger to avoid overwhelming the browser
      setTimeout(() => {
        preloadVideo(video, index);
      }, index * 50);
    });
  }, [videoData]);

  // Loader animation: Cycle through coordinates
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;
    
    // Set minimum loader time (2.5 seconds to show a few coordinates)
    const minTimeTimer = setTimeout(() => {
      loaderMinTimeRef.current = true;
      // Check if we can exit loading
      if (videoCacheRef.current.size >= Math.min(2, videoData.length)) {
        setIsLoading(false);
      }
    }, 2500);
    
    // Cycle through coordinates
    const coordInterval = setInterval(() => {
      setCoordFading(true);
      setTimeout(() => {
        setCurrentCoordIndex(prev => (prev + 1) % videoData.length);
        setCoordFading(false);
      }, 300); // Fade out duration
    }, 600); // Change every 600ms
    
    return () => {
      clearTimeout(minTimeTimer);
      clearInterval(coordInterval);
    };
  }, [isLoading, videoData]);

  // Check if loading is complete
  useEffect(() => {
    if (!isLoading || videoData.length === 0) return;
    
    // Check periodically if we have enough cached videos and minimum time has passed
    const checkLoading = setInterval(() => {
      if (loaderMinTimeRef.current && videoCacheRef.current.size >= Math.min(2, videoData.length)) {
        setIsLoading(false);
      }
    }, 100);
    
    // Maximum loader time (5 seconds) - exit even if videos aren't fully cached
    const maxTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => {
      clearInterval(checkLoading);
      clearTimeout(maxTimer);
    };
  }, [isLoading, videoData]);

  // Ensure Safari-specific attributes are set on video elements
  useEffect(() => {
    if (videoRef1.current) {
      videoRef1.current.setAttribute('playsinline', 'true');
      videoRef1.current.setAttribute('webkit-playsinline', 'true');
    }
    if (videoRef2.current) {
      videoRef2.current.setAttribute('playsinline', 'true');
      videoRef2.current.setAttribute('webkit-playsinline', 'true');
    }
  }, []);

  // Update loop attribute based on hover state (backup to JSX prop)
  useEffect(() => {
    // Ensure loop is set correctly via refs as backup (JSX prop should handle it, but this ensures it)
    if (videoRef1.current) {
      videoRef1.current.loop = isHovered;
    }
    if (videoRef2.current) {
      videoRef2.current.loop = isHovered;
    }
  }, [isHovered]);

  // Preload next AND previous videos in the inactive element for seamless transitions
  useEffect(() => {
    if (isTransitioningRef.current || videoData.length === 0) return;
    
    const nextIndex = (videoIndex + 1) % videoData.length;
    const prevIndex = (videoIndex - 1 + videoData.length) % videoData.length;
    const inactiveRef = activeVideo === 1 ? videoRef2 : videoRef1;
    
    // Update ref for inactive video to next video
    if (activeVideo === 1 && video2IndexRef.current !== nextIndex) {
      video2IndexRef.current = nextIndex;
    } else if (activeVideo === 2 && video1IndexRef.current !== nextIndex) {
      video1IndexRef.current = nextIndex;
    }
    
    // Preload next video with auto preload (full video) for instant transitions
    if (inactiveRef.current) {
      const sourceElement = inactiveRef.current.querySelector('source');
      if (sourceElement && videoData[nextIndex]) {
        const nextVideoSrc = videoData[nextIndex].src;
        // Check if source needs updating (compare just the filename)
        const currentSrcFile = (sourceElement.src || '').split('/').pop();
        const nextSrcFile = nextVideoSrc.split('/').pop();
        
        if (currentSrcFile !== nextSrcFile) {
          sourceElement.src = nextVideoSrc;
          inactiveRef.current.load();
        }
        
        // Use auto preload for next video (full preload) for seamless transitions
        inactiveRef.current.preload = 'auto';
      }
    }
    
    // Also preload previous video in background using fetch API
    // This ensures both directions are ready
    if (videoData[prevIndex]) {
      const prevVideoSrc = videoData[prevIndex].src;
      // Use fetch to preload previous video in browser cache
      fetch(prevVideoSrc, { method: 'HEAD', priority: 'low' }).catch(() => {
        // Silently fail - video will load when needed
      });
    }
  }, [videoIndex, activeVideo, videoData]);

  // Ensure videos play on mount and when videoData loads
  useEffect(() => {
    if (videoData.length === 0) return;
    
    if (videoRef1.current) {
      const source1 = videoRef1.current.querySelector('source');
      if (source1 && videoData[video1IndexRef.current]) {
        source1.src = videoData[video1IndexRef.current].src;
        videoRef1.current.load();
        const playPromise1 = videoRef1.current.play();
        if (playPromise1 !== undefined) {
          playPromise1.catch(error => {
            console.log('Video autoplay prevented:', error);
          });
        }
      }
    }
    if (videoRef2.current) {
      const source2 = videoRef2.current.querySelector('source');
      if (source2 && videoData[video2IndexRef.current]) {
        source2.src = videoData[video2IndexRef.current].src;
        videoRef2.current.load();
        // Don't play video2 initially, it will play when switching
      }
    }
  }, [videoData]);

  // Show loading state only if we have no data at all (allow partial rendering)
  const hasAnyData = videoData.length > 0 || Object.keys(websiteCopy).length > 0;
  
  // Show coordinates loader while videos preload
  if (isLoading || !hasAnyData) {
    const coordinates = videoData.length > 0 
      ? videoData.map(v => v.coordinates)
      : ['6.79770°S, 107.57870°E', '37.82975°N, 122.40606°W', '56.76040°N, 4.69090°W', '10.77700°N, 106.69860°E'];
    
    return (
      <div className="bg-[#FCFCFC] min-h-screen w-full flex items-center justify-center">
        <div className={`coord-loader font-graphik text-[16px] text-[#91918e] ${coordFading ? 'coord-fade-out' : 'coord-fade-in'}`}>
          {coordinates[currentCoordIndex % coordinates.length]}
        </div>
      </div>
    );
  }
  
  // Use fallback data if missing
  const safeVideoData = videoData.length > 0 ? videoData : [];
  const safeWebsiteCopy = Object.keys(websiteCopy).length > 0 ? websiteCopy : {};

  return (
    <div className="bg-[#FCFCFC] min-h-screen w-full">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-[250px] pt-[180px] pb-[150px] text-left" style={{ width: '100%', height: 'fit-content' }}>
        <div className="flex gap-[50px] items-start justify-center w-full h-fit" style={{ width: '100%', height: 'fit-content' }}>
          {/* Left Column - Text Content */}
          <div className="flex flex-col w-[375px]">
            {/* Time Component */}
            <div className={`bg-white border border-[#ebeef5] flex gap-[6px] h-[35px] items-center justify-center pt-[10px] pr-[10px] pb-[10px] pl-[8px] rounded-[20px] mb-[15px] w-fit cursor-pointer select-none ${loadedComponents.timeComponent ? 'component-loaded' : 'component-hidden'}`}>
              <div className="overflow-clip relative shrink-0 size-[20px]">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="block max-w-none size-full"
                >
                  {/* Minute markers (60 small dashes) */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i * 6 - 90) * (Math.PI / 180);
                    const isHourMarker = i % 5 === 0;
                    const outerRadius = 9.5;
                    const innerRadius = isHourMarker ? 8.5 : 9;
                    const x1 = 10 + Math.cos(angle) * innerRadius;
                    const y1 = 10 + Math.sin(angle) * innerRadius;
                    const x2 = 10 + Math.cos(angle) * outerRadius;
                    const y2 = 10 + Math.sin(angle) * outerRadius;
                    
                    return (
                      <line
                        key={`minute-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#C3C3C3"
                        strokeWidth={isHourMarker ? "0.8" : "0.4"}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  
                  {/* Hour hand (shorter, thinner) */}
                  <line
                    x1="10"
                    y1="10"
                    x2="10"
                    y2="6"
                    stroke="#111112"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    transform={`rotate(${clockTime.hours * 30 + clockTime.minutes * 0.5} 10 10)`}
                  />
                  
                  {/* Minute hand (longer, thinner) */}
                  <line
                    x1="10"
                    y1="10"
                    x2="10"
                    y2="3.5"
                    stroke="#111112"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    transform={`rotate(${clockTime.minutes * 6 + clockTime.seconds * 0.1} 10 10)`}
                  />
                  
                  {/* Second hand (thin, red, long) */}
                  <line
                    x1="10"
                    y1="10"
                    x2="10"
                    y2="2.5"
                    stroke="#FF0000"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    transform={`rotate(${(clockTime.seconds + clockTime.milliseconds / 1000) * 6} 10 10)`}
                  />
                  
                  {/* Center pivot dot (smaller) */}
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
            <h1 className={`font-calluna font-normal leading-[29px] text-[#333] text-[21px] w-[317px] whitespace-pre-wrap mb-[10px] ${loadedComponents.h1 ? 'component-loaded' : 'component-hidden'}`}>
              {getCopy('hero_headline')}
            </h1>
            <div className={`font-graphik leading-[25px] text-[#5b5b5e] text-[14px] whitespace-pre-wrap ${loadedComponents.bodyParagraphs ? 'component-loaded' : 'component-hidden'}`}>
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
              className={`group video-frame-hover flex flex-col h-[470px] items-start justify-end rounded-[14px] w-[346px] relative overflow-visible outline outline-1 outline-black/5 cursor-default -mt-[35px] ${loadedComponents.videoFrame ? 'component-loaded' : 'component-hidden'}`}
              onMouseEnter={() => {
                setIsHovered(true);
                isHoveredRef.current = true;
              }}
              onMouseLeave={() => {
                setIsHovered(false);
                isHoveredRef.current = false;
              }}
            >
              {/* Loading indicator during video transitions */}
              {isTransitioning && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 rounded-[14px] pointer-events-none">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                </div>
              )}
            <div className="absolute inset-0 rounded-[14px] overflow-hidden z-0">
              {/* Video 1 - source managed via ref, not React state */}
              <video 
                ref={videoRef1}
                className="absolute inset-0 w-full h-full object-cover brightness-[1.10] group-hover:brightness-[1.20]"
                style={{ 
                  zIndex: activeVideo === 1 ? 20 : 10,
                  transition: 'filter 250ms ease-in-out',
                  transform: 'translateZ(0)'
                }}
                autoPlay
                muted
                playsInline
                preload="metadata"
                controls={false}
                loop={isHovered}
                onEnded={handleVideoEnded}
              >
                {safeVideoData[0] && <source src={safeVideoData[0].src} type="video/mp4" />}
              </video>
              {/* Video 2 - source managed via ref, not React state */}
              <video 
                ref={videoRef2}
                className="absolute inset-0 w-full h-full object-cover brightness-[1.10] group-hover:brightness-[1.20]"
                style={{ 
                  zIndex: activeVideo === 2 ? 20 : 10,
                  transition: 'filter 250ms ease-in-out',
                  transform: 'translateZ(0)'
                }}
                autoPlay
                muted
                playsInline
                preload="metadata"
                controls={false}
                loop={isHovered}
                onEnded={handleVideoEnded}
              >
                {safeVideoData[1] && <source src={safeVideoData[1].src} type="video/mp4" />}
              </video>
            </div>
            <div 
              className="relative z-30 w-full black-box-container" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`bg-[#222122] h-[40px] rounded-[14px] w-full black-box-slide group-hover:h-[145px] overflow-hidden relative outline outline-1 outline-white/5 ${showJiggle ? 'black-box-jiggle' : ''}`}>
                <div className="absolute left-[12px] right-[12px] top-[12px] flex items-center justify-between transition-all duration-300 ease-in-out group-hover:items-start group-hover:justify-between min-w-0 max-w-full z-10">
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
                          className="black-box-text font-graphik leading-[normal] text-[#969494] text-[14px] whitespace-nowrap group-hover/coord-wrapper:text-[#e6eaee] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group-hover/coord-wrapper:-translate-x-[14px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative inline-block"
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
                <div className="absolute left-[12px] right-[12px] bottom-[17px] flex items-end justify-between metadata-fade z-10">
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
                  <div className="flex gap-[6px] items-center">
                    <button 
                      className="arrow-button h-[29px] w-[30px] flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeVideo('prev');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('prev');
                      }}
                    >
                      <svg width="30" height="29" viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg">
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" fill="#222122" className="arrow-fill"/>
                        <rect x="0.7" y="0.7" width="28.6" height="27.6" rx="4.3" stroke="#4A474A" strokeWidth="1.4" className="arrow-stroke"/>
                        <path d="M16.7706 9.24213C16.9175 9.39721 17 9.60751 17 9.8268C17 10.0461 16.9175 10.2564 16.7706 10.4115L12.8915 14.505L16.7706 18.5985C16.9133 18.7545 16.9923 18.9634 16.9905 19.1802C16.9887 19.397 16.9063 19.6045 16.761 19.7578C16.6157 19.9111 16.4192 19.9981 16.2137 20C16.0082 20.0019 15.8103 19.9185 15.6625 19.7679L11.2294 15.0897C11.0825 14.9346 11 14.7243 11 14.505C11 14.2857 11.0825 14.0754 11.2294 13.9203L15.6625 9.24213C15.8094 9.08709 16.0087 9 16.2165 9C16.4243 9 16.6236 9.08709 16.7706 9.24213Z" fill="#4A474A" className="arrow-path"/>
                      </svg>
                    </button>
                    <button 
                      className="arrow-button h-[29px] w-[30px] flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeVideo('next');
                      }}
                      onMouseEnter={() => {
                        preloadVideoOnHover('next');
                      }}
                    >
                      <svg width="30" height="29" viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg">
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
      </div>

      {/* Bottom Component - Born Slippy, Timeline, Shortcuts, Contact */}
      <div className={`fixed bottom-[50px] left-1/2 transform -translate-x-1/2 h-[64px] w-[529px] ${loadedComponents.bottomComponent ? 'component-loaded' : 'component-hidden'}`} style={{ overflow: 'visible' }}>
        <div className="flex h-full bottom-pill-container rounded-[14px] relative">
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
                      <span className="text-[#e6eaee]">Last seen:</span>
                      <span className="text-[#969494]"> {currentTrack.playedAt ? getTimeAgo(currentTrack.playedAt) : 'recently'}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div 
            className="h-[64px] w-[238px] flex items-center pl-[6px] pr-[12px] relative flex-shrink-0"
            style={{ overflow: 'visible' }}
          >
            <button 
              className="music-player-button h-[48px] w-full flex items-center gap-[10px] pl-[6px] pr-[10px] cursor-pointer group/vinyl"
              onMouseEnter={() => {
                if (modalTimeoutRef.current) {
                  clearTimeout(modalTimeoutRef.current);
                  modalTimeoutRef.current = null;
                }
                setIsModalExiting(false);
                setIsMusicHovered(true);
              }}
              onMouseLeave={() => {
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
                <span className="music-note note-1" style={{ color: '#8BA4C7' }}>♪</span>
                <span className="music-note note-2" style={{ color: '#C9A0B0' }}>♫</span>
                <span className="music-note note-3" style={{ color: '#9BB8A0' }}>♪</span>
                <span className="music-note note-4" style={{ color: '#C4AA9A' }}>♬</span>
              </div>
              
              {/* Vinyl record - always spinning */}
              <div className="vinyl-record vinyl-spin absolute inset-0 rounded-full flex items-center justify-center">
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
            <div className="flex flex-col font-graphik text-[14px] justify-center gap-[4px] items-start min-w-0 flex-shrink">
              <p className="text-[#333] leading-none truncate max-w-[154px]">
                {musicLoading ? 'Loading...' : currentTrack?.name || 'No recent track'}
              </p>
              <p className="text-[#c3c3c3] leading-none truncate max-w-[154px]">
                {musicLoading ? '...' : currentTrack?.artist || 'Connect Last.fm'}
              </p>
            </div>
          </button>
          </div>

          {/* Divider line */}
          <div className="pill-divider w-[1px] h-full bg-[#ebeef5] flex-shrink-0"></div>

          {/* Right side - Buttons */}
          <div className="h-[64px] w-[290px] flex items-center gap-[10px] px-[12px] py-[14px] relative flex-shrink-0">
            {/* ⌘K indicator - appears above Shortcuts button on hover */}
            {(isShortcutsHovered || isShortcutsModalExiting) && (
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

            {/* Timeline and Shortcuts buttons */}
            <div className="flex h-[37px] w-[175px]">
              <button className="bottom-button h-[37px] rounded-l-[8px] w-[84px] flex items-center justify-center cursor-pointer">
                <p className="font-graphik text-[14px] text-[#5b5b5e]">Timeline</p>
              </button>
              <button 
                ref={shortcutsButtonRef}
                className={`bottom-button h-[37px] rounded-r-[8px] w-[92px] flex items-center justify-center cursor-pointer ${isShortcutsActive ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (shortcutsModalTimeoutRef.current) {
                    clearTimeout(shortcutsModalTimeoutRef.current);
                    shortcutsModalTimeoutRef.current = null;
                  }
                  setIsShortcutsModalExiting(false);
                  setIsShortcutsHovered(true);
                }}
                onMouseLeave={() => {
                  setIsShortcutsModalExiting(true);
                  shortcutsModalTimeoutRef.current = setTimeout(() => {
                    setIsShortcutsHovered(false);
                    setIsShortcutsModalExiting(false);
                  }, 200);
                }}
              >
                <p className="font-graphik text-[14px] text-[#5b5b5e]">Shortcuts</p>
              </button>
            </div>

            {/* Contact button */}
            <button className="bottom-button h-[37px] rounded-[8px] w-[81px] flex items-center justify-center px-[14px] py-[11px] cursor-pointer">
              <p className="font-graphik text-[14px] text-[#5b5b5e]">Contact</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App


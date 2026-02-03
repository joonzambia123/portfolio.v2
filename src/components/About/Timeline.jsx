// Vertical timeline with photo above and scrolling text below
import { useRef, useState, useEffect, useCallback } from 'react'

const AUTO_ROTATE_MS = 10000

const Timeline = ({ milestones, isVisible = false }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pressedArrow, setPressedArrow] = useState(null)
  const [showSlowDown, setShowSlowDown] = useState(false)
  const containerRef = useRef(null)
  const toggleTimestamps = useRef([])
  const autoRotateTimer = useRef(null)
  const fillRefs = useRef([])

  const rowHeight = 30 // 20px + 10px gap
  const len = milestones.length

  // Direct DOM fill animation — bypasses React rendering entirely
  useEffect(() => {
    fillRefs.current.forEach((el, idx) => {
      if (!el) return
      if (idx === activeIndex) {
        // Reset to 0 instantly
        el.style.transition = 'none'
        el.style.width = '0%'
        el.style.opacity = '1'
        // Use double rAF instead of forced reflow to avoid blocking video playback
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!el) return
            el.style.transition = `width ${AUTO_ROTATE_MS}ms linear`
            el.style.width = '100%'
          })
        })
      } else {
        el.style.transition = 'none'
        el.style.width = '0%'
        el.style.opacity = '0'
      }
    })
  }, [activeIndex])

  // Auto-rotation timer — only runs when visible
  const startAutoRotate = useCallback(() => {
    if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current)
    if (!isVisible) return
    autoRotateTimer.current = setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % len)
    }, AUTO_ROTATE_MS)
  }, [len, isVisible])

  // Restart timer when activeIndex changes or visibility changes
  useEffect(() => {
    if (isVisible) {
      startAutoRotate()
    } else {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current)
        autoRotateTimer.current = null
      }
    }
  }, [activeIndex, startAutoRotate, isVisible])

  // Reset to first slide when becoming visible
  useEffect(() => {
    if (isVisible) {
      setActiveIndex(0)
    }
  }, [isVisible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current)
    }
  }, [])

  // Check if toggling too fast
  const checkSpeed = () => {
    const now = Date.now()
    toggleTimestamps.current.push(now)
    // Keep only last 8 toggles
    if (toggleTimestamps.current.length > 8) {
      toggleTimestamps.current.shift()
    }
    // If 8 toggles in under 1.5 seconds, show message
    if (toggleTimestamps.current.length >= 8) {
      const oldest = toggleTimestamps.current[0]
      if (now - oldest < 1500) {
        setShowSlowDown(true)
        setTimeout(() => setShowSlowDown(false), 2000)
        toggleTimestamps.current = [] // Reset
      }
    }
  }

  const goToNext = () => {
    checkSpeed()
    setActiveIndex(prev => (prev + 1) % len)
  }

  const goToPrev = () => {
    checkSpeed()
    setActiveIndex(prev => (prev - 1 + len) % len)
  }

  // Trigger press animation
  const triggerPress = (dir) => {
    setPressedArrow(dir)
    setTimeout(() => setPressedArrow(null), 100)
  }

  // Keyboard navigation — only active when page is visible
  useEffect(() => {
    if (!isVisible) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (document.activeElement) document.activeElement.blur()
        triggerPress('right')
        goToNext()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (document.activeElement) document.activeElement.blur()
        triggerPress('left')
        goToPrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  // Touch/swipe navigation
  const touchStartY = useRef(0)
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrev()
    }
  }

  // Get current milestone for photo
  const currentMilestone = milestones[activeIndex]

  // Render ALL items for true carousel scrolling
  const allItems = milestones.map((m, i) => ({ ...m, dataIndex: i }))

  // Calculate which items are visible (with wrap-around)
  const getOpacity = (dataIndex) => {
    let diff = dataIndex - activeIndex
    if (diff < -len/2) diff += len
    if (diff > len/2) diff -= len

    if (diff === 0) return 1
    if (diff === 1) return 0.3
    if (diff === 2) return 0.15
    return 0
  }

  // Calculate translateY for each item (circular positioning)
  const getTranslateY = (dataIndex) => {
    let diff = dataIndex - activeIndex
    if (diff < -len/2) diff += len
    if (diff > len/2) diff -= len

    return diff * rowHeight
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo container with navigation arrows */}
      <div className="relative w-full mb-[20px]">
        {/* Left arrow */}
        <button
          onClick={() => { triggerPress('left'); goToPrev() }}
          className="absolute left-[-40px] top-1/2 -translate-y-1/2 z-10 outline-none focus:outline-none transition-all duration-100 hover:opacity-80 hover:scale-110"
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressedArrow === 'left' ? 1 : 0.5,
            cursor: 'pointer',
            transform: pressedArrow === 'left' ? 'translateY(-50%) scale(0.9)' : undefined
          }}
          aria-label="Previous milestone"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="transition-all duration-100">
            <path d="M7 1L1 7L7 13" stroke={pressedArrow === 'left' ? '#333' : '#5B5B5E'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Photo/Video */}
        <div
          className="w-full overflow-hidden outline outline-1 outline-black/5 relative"
          style={{
            height: '259px',
            borderRadius: '8px',
            backgroundColor: '#f0f0f0'
          }}
        >
          {currentMilestone.type === 'video' ? (
            <video
              key={currentMilestone.id}
              src={currentMilestone.src}
              className="w-full h-full object-cover"
              style={{ animation: 'fadeIn 300ms ease' }}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              key={currentMilestone.id}
              src={currentMilestone.image}
              alt={currentMilestone.alt}
              className="w-full h-full object-cover"
              style={{ animation: 'fadeIn 300ms ease' }}
            />
          )}

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center z-10"
            style={{ padding: '0 16px 14px' }}
          >
            <div className="flex items-center" style={{ gap: '4px' }}>
              {milestones.map((_, idx) => {
                const isActive = idx === activeIndex
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden"
                    style={{
                      width: isActive ? '28px' : '16px',
                      height: isActive ? '4px' : '3px',
                      borderRadius: '2px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                      transition: 'width 450ms cubic-bezier(0.34, 1.4, 0.64, 1), height 450ms cubic-bezier(0.34, 1.4, 0.64, 1), background-color 300ms ease'
                    }}
                  >
                    <div
                      ref={el => { fillRefs.current[idx] = el }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        width: '0%',
                        opacity: 0
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Easter egg: slow down message */}
          {showSlowDown && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/60"
              style={{
                animation: 'fadeIn 200ms ease'
              }}
            >
              <span className="font-graphik text-[14px] text-white">
                Slow down there, tiger.
              </span>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => { triggerPress('right'); goToNext() }}
          className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-10 outline-none focus:outline-none transition-all duration-100 hover:opacity-80 hover:scale-110"
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressedArrow === 'right' ? 1 : 0.5,
            cursor: 'pointer',
            transform: pressedArrow === 'right' ? 'translateY(-50%) scale(0.9)' : undefined
          }}
          aria-label="Next milestone"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="transition-all duration-100">
            <path d="M1 1L7 7L1 13" stroke={pressedArrow === 'right' ? '#333' : '#5B5B5E'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Timeline text list - infinite carousel */}
      <div
        className="relative overflow-hidden"
        style={{ height: `${rowHeight * 3 - 11}px` }}
      >
        {allItems.map((item) => (
          <div
            key={item.id}
            className="absolute w-full flex items-center justify-between font-graphik text-[14px]"
            onClick={() => {
              const diff = item.dataIndex - activeIndex
              if (diff === 1 || (diff === 1 - len)) goToNext()
              if (diff === 2 || (diff === 2 - len)) { goToNext(); setTimeout(goToNext, 280) }
            }}
            style={{
              opacity: getOpacity(item.dataIndex),
              transform: `translateY(${getTranslateY(item.dataIndex)}px)`,
              transition: 'transform 280ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 280ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              height: '20px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              pointerEvents: getOpacity(item.dataIndex) > 0 ? 'auto' : 'none'
            }}
          >
            <span style={{
              color: '#5B5B5E',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {item.caption}
            </span>
            <span style={{
              color: '#C3C3C3',
              flexShrink: 0,
              marginLeft: '60px',
              textAlign: 'right'
            }}>
              {item.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Timeline

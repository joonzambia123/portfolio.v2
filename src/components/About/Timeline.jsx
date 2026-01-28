// Vertical timeline with photo above and scrolling text below
import { useRef, useState, useEffect } from 'react'

const Timeline = ({ milestones }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

  const goToNext = () => {
    if (activeIndex < milestones.length - 1) setActiveIndex(prev => prev + 1)
  }

  const goToPrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1)
  }

  // Keyboard navigation (left/right arrows only)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (document.activeElement) document.activeElement.blur()
        goToNext()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (document.activeElement) document.activeElement.blur()
        goToPrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  // Touch/swipe navigation
  const touchStartY = useRef(0)
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrev()
    }
  }

  const currentMilestone = milestones[activeIndex]
  const rowHeight = 20 + 11 // Row content height (20px) + gap (11px)

  // Calculate opacity based on position relative to active
  // Row 1 = 100%, Row 2 = 30%, Row 3 = 15%
  const getOpacity = (index) => {
    const position = index - activeIndex
    if (position === 0) return 1      // Current/active - full opacity
    if (position === 1) return 0.3    // Second row
    if (position === 2) return 0.15   // Third row
    if (position < 0) return 0        // Above active - hidden
    return 0                          // Beyond third - hidden
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
          onClick={goToPrev}
          disabled={activeIndex === 0}
          className={`absolute left-[-40px] top-1/2 -translate-y-1/2 z-10 outline-none focus:outline-none transition-all duration-200 ${activeIndex === 0 ? '' : 'hover:opacity-80 hover:scale-110 active:scale-95'}`}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: activeIndex === 0 ? 0.2 : 0.5,
            cursor: activeIndex === 0 ? 'default' : 'pointer'
          }}
          aria-label="Previous milestone"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#5B5B5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Photo/Video */}
        <div
          className="w-full overflow-hidden outline outline-1 outline-black/5"
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
        </div>

        {/* Right arrow */}
        <button
          onClick={goToNext}
          disabled={activeIndex === milestones.length - 1}
          className={`absolute right-[-40px] top-1/2 -translate-y-1/2 z-10 outline-none focus:outline-none transition-all duration-200 ${activeIndex === milestones.length - 1 ? '' : 'hover:opacity-80 hover:scale-110 active:scale-95'}`}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: activeIndex === milestones.length - 1 ? 0.2 : 0.5,
            cursor: activeIndex === milestones.length - 1 ? 'default' : 'pointer'
          }}
          aria-label="Next milestone"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 1L7 7L1 13" stroke="#5B5B5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Timeline text list - always shows 3 rows */}
      <div
        className="relative overflow-hidden"
        style={{
          height: `${rowHeight * 3 - 11}px` // 3 rows minus last gap
        }}
      >
        <div
          style={{
            transform: `translateY(${-activeIndex * rowHeight}px)`,
            transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {milestones.map((milestone, index) => {
            const isClickable = index >= activeIndex && index <= activeIndex + 2
            return (
            <div
              key={milestone.id}
              className="flex items-center justify-between font-graphik text-[14px]"
              onClick={() => isClickable && setActiveIndex(index)}
              style={{
                opacity: getOpacity(index),
                transition: 'opacity 400ms ease',
                height: '20px',
                marginBottom: '11px',
                whiteSpace: 'nowrap',
                cursor: isClickable ? 'pointer' : 'default'
              }}
            >
              <span style={{
                color: '#5B5B5E',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {milestone.caption}
              </span>
              <span style={{
                color: '#C3C3C3',
                flexShrink: 0,
                marginLeft: '60px',
                textAlign: 'right'
              }}>
                {milestone.year}
              </span>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Timeline

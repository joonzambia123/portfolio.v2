// Vertical timeline with photo above and scrolling text below
import { useRef, useState, useEffect } from 'react'

const Timeline = ({ milestones }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pressedArrow, setPressedArrow] = useState(null) // 'left', 'right', or null
  const [slideDirection, setSlideDirection] = useState(null) // 'up', 'down', or null
  const containerRef = useRef(null)

  const goToNext = () => {
    setSlideDirection('up')
    setActiveIndex(prev => prev < milestones.length - 1 ? prev + 1 : 0)
  }

  const goToPrev = () => {
    setSlideDirection('down')
    setActiveIndex(prev => prev > 0 ? prev - 1 : milestones.length - 1)
  }

  // Trigger press animation
  const triggerPress = (direction) => {
    setPressedArrow(direction)
    setTimeout(() => setPressedArrow(null), 100)
  }

  // Keyboard navigation (left/right arrows only)
  useEffect(() => {
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

  // Get 3 visible indices with wrap-around
  const getVisibleIndices = () => {
    const len = milestones.length
    return [
      activeIndex,
      (activeIndex + 1) % len,
      (activeIndex + 2) % len
    ]
  }

  const visibleIndices = getVisibleIndices()
  const opacities = [1, 0.3, 0.15]

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

      {/* Timeline text list - always shows 3 rows */}
      <div
        className="relative overflow-hidden"
        style={{
          height: `${rowHeight * 3 - 11}px` // 3 rows minus last gap
        }}
      >
        <div
          key={activeIndex}
          className={slideDirection === 'up' ? 'timeline-slide-up' : slideDirection === 'down' ? 'timeline-slide-down' : ''}
        >
          {visibleIndices.map((milestoneIndex, position) => {
            const milestone = milestones[milestoneIndex]
            return (
              <div
                key={`${activeIndex}-${position}`}
                className="flex items-center justify-between font-graphik text-[14px]"
                onClick={() => setActiveIndex(milestoneIndex)}
                style={{
                  opacity: opacities[position],
                  height: '20px',
                  marginBottom: position < 2 ? '11px' : '0px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
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

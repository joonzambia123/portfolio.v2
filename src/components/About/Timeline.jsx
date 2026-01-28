// Clean horizontal timeline - NYT-quality design
import { useRef, useState, useEffect } from 'react'
import TimelineMilestone from './TimelineMilestone'

const Timeline = ({ milestones }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(341)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const goToNext = () => {
    if (activeIndex < milestones.length - 1) setActiveIndex(prev => prev + 1)
  }

  const goToPrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  const touchStartX = useRef(0)
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrev()
    }
  }

  const itemWidth = 140
  const centerOffset = (containerWidth - itemWidth) / 2
  const translateX = centerOffset - (activeIndex * itemWidth)

  // Line position: photo(84) + marginTop(16) + half of circle(2.5) ≈ 102px
  const lineTop = 102

  // Line spans between first and last photo centers
  const lineWidth = (milestones.length - 1) * itemWidth
  const lineLeftOffset = itemWidth / 2

  return (
    <div
      ref={containerRef}
      className="timeline-wrapper relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Viewport with fade edges */}
      <div
        className="timeline-viewport relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 50%, rgba(0,0,0,0.12) 82%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 50%, rgba(0,0,0,0.12) 82%, transparent 100%)'
        }}
      >
        {/* Thin line - only spans between first and last dot */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${lineTop}px`,
            left: `${lineLeftOffset}px`,
            width: `${lineWidth}px`,
            height: '1px',
            transform: `translateX(${translateX}px)`,
            transition: 'transform 380ms cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: '#E0E0E0'
          }}
        />

        {/* Milestones track */}
        <div
          className="flex"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: 'transform 380ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {milestones.map((milestone, index) => (
            <TimelineMilestone
              key={milestone.id}
              milestone={milestone}
              isActive={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div
        className="flex items-center justify-center gap-[10px]"
        style={{ height: '28px', marginTop: '20px' }}
      >
        <button
          onClick={goToPrev}
          disabled={activeIndex === 0}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: activeIndex === 0 ? 0.15 : 0.4,
            cursor: activeIndex === 0 ? 'default' : 'pointer',
            transition: 'opacity 200ms ease'
          }}
          aria-label="Previous"
        >
          <svg width="5" height="9" viewBox="0 0 5 9" fill="none">
            <path d="M4 1L1 4.5L4 8" stroke="#5B5B5E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-[6px]">
          {milestones.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              style={{
                width: index === activeIndex ? '16px' : '4px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: index === activeIndex ? '#5B5B5E' : '#D4D4D4',
                transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              aria-label={`Go to ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={activeIndex === milestones.length - 1}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: activeIndex === milestones.length - 1 ? 0.15 : 0.4,
            cursor: activeIndex === milestones.length - 1 ? 'default' : 'pointer',
            transition: 'opacity 200ms ease'
          }}
          aria-label="Next"
        >
          <svg width="5" height="9" viewBox="0 0 5 9" fill="none">
            <path d="M1 1L4 4.5L1 8" stroke="#5B5B5E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Timeline

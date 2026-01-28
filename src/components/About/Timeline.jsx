// Vertical timeline with photo above and scrolling text below
import { useRef, useState, useEffect } from 'react'

const Timeline = ({ milestones }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [pressedArrow, setPressedArrow] = useState(null)
  const containerRef = useRef(null)

  const rowHeight = 31 // 20px + 11px gap
  const len = milestones.length

  const goToNext = () => {
    setActiveIndex(prev => (prev + 1) % len)
  }

  const goToPrev = () => {
    setActiveIndex(prev => (prev - 1 + len) % len)
  }

  // Trigger press animation
  const triggerPress = (dir) => {
    setPressedArrow(dir)
    setTimeout(() => setPressedArrow(null), 100)
  }

  // Keyboard navigation
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
  }, [])

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
  // Use CSS to position and animate
  const allItems = milestones.map((m, i) => ({ ...m, dataIndex: i }))

  // Calculate which items are visible (with wrap-around)
  const getOpacity = (dataIndex) => {
    let diff = dataIndex - activeIndex
    // Handle wrap-around
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
    // Handle wrap-around for positioning
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
              transition: 'transform 250ms ease-out, opacity 250ms ease-out',
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

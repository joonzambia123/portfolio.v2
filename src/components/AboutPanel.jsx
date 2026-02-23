import { useEffect, useRef, useState } from 'react'
import WatercolorFlowers from './WatercolorFlowers'

const AboutPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const hasRevealedRef = useRef(false)
  const [showFlowers, setShowFlowers] = useState(false)
  const [firstReveal, setFirstReveal] = useState(true)

  // Track if we've animated before (skip on re-open within same session)
  useEffect(() => {
    if (isOpen && hasAnimatedRef.current === false) {
      const timer = setTimeout(() => {
        hasAnimatedRef.current = true
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Mark text reveal as done after first open completes
  useEffect(() => {
    if (isOpen && !hasRevealedRef.current) {
      // Last element (index 7) finishes at: 500ms delay + 7*30ms stagger + 1100ms animation ≈ 1810ms
      const timer = setTimeout(() => {
        hasRevealedRef.current = true
        setFirstReveal(false)
      }, 1900)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Delay flowers until panel has settled; reset immediately on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowFlowers(true), 1900)
      return () => clearTimeout(timer)
    } else {
      setShowFlowers(false)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`about-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`about-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="About"
      >
        {/* Watercolor Flowers — overlaid on the top whitespace, clipped to not overflow into text */}
        <div
          className={`about-flowers-wrap ${showFlowers ? 'visible' : ''}`}
          style={{ height: 'calc(38vh - 40px)' }}
        >
          <WatercolorFlowers
            isVisible={showFlowers}
            hasBeenSeen={hasAnimatedRef.current}
          />
        </div>

        {/* Header */}
        <header className="flex flex-col gap-[7px] px-[24px] pt-[calc(38vh-40px)]">
          <h1 className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#333] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 0 } : undefined}>
            Greetings tourist, I'm Joonseo.
          </h1>
          <p className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#a1a1a1] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 1 } : undefined}>
            But feel free to call me Joon.
          </p>
        </header>

        {/* Divider + body content */}
        <div className="flex flex-col gap-[15px] items-center mt-[16px] w-full">
          {/* Divider - full width */}
          <div className={`${firstReveal ? 'about-reveal' : ''} w-full h-[1px] bg-[#eaeaea]`} style={firstReveal ? { '--reveal-i': 2 } : undefined} />

          {/* Text content - 337px wide centered in 385px */}
          <div className="flex flex-col gap-[5px] w-[337px] leading-[25px] text-[14px]">
            <p className={`${firstReveal ? 'about-reveal' : ''} font-graphik font-medium text-black`} style={firstReveal ? { '--reveal-i': 3 } : undefined}>
              I've had a bit of a nomadic upbringing.
            </p>
            <div className="flex flex-col gap-[10px] font-graphik text-[#5b5b5e]">
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 4 } : undefined}>I was born in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence and a fondness for Potbelly sandwiches, I suddenly found myself in another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.</p>
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 5 } : undefined}>Spanish became my primary language, empanadas my religion, and I earned my first unpaid internship as an 8-year-old altar boy at the local church.</p>
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 6 } : undefined}>But then, after a few years, I somehow popped over to a British school in Weihai, China, where I wore a blazer and tie every day and developed a dizzying international school accent that I am still not used to myself.</p>
            </div>
          </div>
        </div>

        {/* Bottom image */}
        <div className={`${firstReveal ? 'about-reveal' : ''} w-full h-[173px] overflow-hidden mt-[25px]`} style={firstReveal ? { '--reveal-i': 7 } : undefined}>
          <img
            src="/images/about-panel.jpg"
            alt="Personal photo"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      </div>
    </>
  )
}

export default AboutPanel

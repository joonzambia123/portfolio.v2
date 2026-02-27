import { useEffect, useRef, useState } from 'react'
import WatercolorFlowers from './WatercolorFlowers'

const AboutPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const hasRevealedRef = useRef(false)
  const imageRef = useRef(null)
  const [showFlowers, setShowFlowers] = useState(false)
  const [firstReveal, setFirstReveal] = useState(true)
  const [imageColorized, setImageColorized] = useState(false)
  const [decimalAge, setDecimalAge] = useState('')

  useEffect(() => {
    const update = () => {
      const birth = new Date('2000-04-21')
      const years = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      setDecimalAge(years.toFixed(6))
    }
    update()
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [])

  const facts = [
    { label: 'Current city', value: 'Kagoshima' },
    { label: 'Next city', value: 'Saigon' },
    { label: 'Favorite song', value: 'Between The Bars' },
    { label: 'Favorite author', value: 'Kazuo Ishiguro' },
    { label: 'Fluent in', value: '4 languages' },
    { label: 'Learning', value: 'Japanese' },
    { label: 'Military assignment', value: '12th Infantry Division' },
    { label: 'School', value: 'Yonsei University' },
    { label: 'LoL rank', value: 'Platinum (KR)' },
  ]

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

  // Reset image color state when panel closes
  useEffect(() => {
    if (!isOpen) setImageColorized(false)
  }, [isOpen])

  // Colorize image when fully scrolled into view within the panel, revert when out
  useEffect(() => {
    if (!imageRef.current || !panelRef.current) return
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer)
        if (entry.isIntersecting) {
          timer = setTimeout(() => setImageColorized(true), 250)
        } else {
          setImageColorized(false)
        }
      },
      { root: panelRef.current, threshold: 0.85 }
    )
    observer.observe(imageRef.current)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
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
        {/* Watercolor Flowers — archived, not rendered (restore by uncommenting)
        <div
          className={`about-flowers-wrap ${showFlowers ? 'visible' : ''}`}
          style={{ height: 'calc(38vh - 40px)' }}
        >
          <WatercolorFlowers
            isVisible={showFlowers}
            hasBeenSeen={hasAnimatedRef.current}
          />
        </div>
        */}

        {/* Header */}
        <header className="flex flex-col gap-[7px] px-[24px] pt-[calc(38vh-40px)]">
          <h1 className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#333] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 0 } : undefined}>
            Greetings tourist, I'm Joonseo.
          </h1>
          <p className={`${firstReveal ? 'about-reveal' : ''} font-calluna text-[21px] text-[#a1a1a1] leading-[1] whitespace-nowrap`} style={firstReveal ? { '--reveal-i': 1 } : undefined}>
            But feel free to call me Joon.
          </p>
        </header>

        {/* Facts carousel — full-width, right-edge fade */}
        <div
          className="w-full overflow-hidden mt-[18px]"
          style={{
            maskImage: 'linear-gradient(to right, black 0%, black 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)',
          }}
        >
          <div className="fact-carousel-track gap-[25px] pl-[24px]" style={{ willChange: 'transform' }}>
            {[...facts, ...facts].map((fact, i) => (
              <div key={i} className="flex flex-col gap-[6px] shrink-0">
                <span className="font-graphik text-[14px] leading-[15px] text-[#5b5b5e] whitespace-nowrap">{fact.label}</span>
                <span className="font-graphik text-[14px] leading-[15px] text-[#c3c3c3] whitespace-nowrap">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider + body content */}
        <div className="flex flex-col gap-[15px] items-center mt-[16px] w-full">
          {/* Divider - full width, subtle skeuomorphic inset */}
          <div
            className={`${firstReveal ? 'about-reveal' : ''} w-full h-[2px]`}
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(255,255,255,0.8))',
              ...(firstReveal ? { '--reveal-i': 2 } : {}),
            }}
          />

          {/* Text content - 337px wide centered in 385px */}
          <div className="flex flex-col gap-[5px] w-[337px] leading-[25px] text-[14px]">
            <p className={`${firstReveal ? 'about-reveal' : ''} font-graphik font-medium text-black`} style={firstReveal ? { '--reveal-i': 3 } : undefined}>
              I've had a nomadic upbringing.
            </p>
            <div className="flex flex-col gap-[10px] font-graphik text-[#5b5b5e]">
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 4 } : undefined}>I popped into existence in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence and a fondness for Potbelly sandwiches, I suddenly found myself in another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.</p>
              <p className={firstReveal ? 'about-reveal' : ''} style={firstReveal ? { '--reveal-i': 5 } : undefined}>Spanish became my first language, empanadas my religion, and I earned my first unpaid internship as a 6-year-old altar boy at the local church. Up until I boarded yet another plane, this time bound for the province of Shandong, China.</p>
            </div>
          </div>
        </div>

        {/* Bottom image */}
        <div
          ref={imageRef}
          className={`${firstReveal ? 'about-reveal' : ''} w-full h-[240px] overflow-hidden mt-[25px]`}
          style={firstReveal ? { '--reveal-i': 6 } : undefined}
        >
          <img
            src="/images/about-panel.jpg"
            alt="Personal photo"
            className="w-full h-full object-cover"
            style={{
              filter: imageColorized ? 'grayscale(0%) brightness(1) contrast(1)' : 'grayscale(100%) brightness(0.75) contrast(1.05)',
              transform: imageColorized ? 'scale(1)' : 'scale(1.03)',
              transition: 'filter 950ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>

        {/* Placeholder — below image */}
        <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px] px-[24px] mt-[16px]">
          My childhood came under threat once more in another migratory event, this time taking place in the culturally oxymoronic setting of a British-Korean school in Weihai, China, where I wore a blazer and tie everyday while munching on latiao.
        </p>
      </div>
    </>
  )
}

export default AboutPanel

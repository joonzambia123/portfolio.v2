// About3 - mobile about page matching the desktop AboutPanel content
import { useEffect, useRef, useState } from 'react'
import WatercolorFlowers from '../WatercolorFlowers'

// Brush stroke underline for "Joon"
const BrushUnderline = ({ isVisible, hasBeenSeen }) => {
  const [isDrawn, setIsDrawn] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) setIsDrawn(false)
      return
    }
    if (hasBeenSeen) {
      setIsDrawn(true)
      return
    }
    const timer = setTimeout(() => setIsDrawn(true), 1200)
    return () => clearTimeout(timer)
  }, [isVisible, hasBeenSeen])

  return (
    <svg
      className="absolute left-[-2px] pointer-events-none overflow-visible"
      style={{ bottom: '-1px', width: 'calc(100% + 4px)', height: '8px' }}
      viewBox="0 0 50 8"
      preserveAspectRatio="none"
    >
      <path
        d="M -1 5 C 6 3.8, 12 3.2, 18 3.5 C 24 2.8, 30 3, 36 3.4 C 42 3.4, 47 3.8, 51 4.2"
        fill="none"
        stroke="#333333"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.75"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: isDrawn ? 0 : 70,
          transition: hasBeenSeen ? 'none' : 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </svg>
  )
}

const About3 = ({ isVisible = false }) => {
  const hasBeenSeenRef = useRef(false)
  const [hasBeenSeen, setHasBeenSeen] = useState(false)
  const visitedRef = useRef(false)
  const imageRef = useRef(null)
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

  useEffect(() => {
    if (isVisible) {
      visitedRef.current = true
    } else if (visitedRef.current && !hasBeenSeenRef.current) {
      hasBeenSeenRef.current = true
      setHasBeenSeen(true)
    }
  }, [isVisible])

  // Staggered section reveal
  const [loadedSections, setLoadedSections] = useState({
    flowers: false,
    header: false,
    body: false,
    image: false,
  })

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) {
        setLoadedSections({ flowers: false, header: false, body: false, image: false })
      }
      return
    }
    if (hasBeenSeen) {
      const t0 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, flowers: true }))
      }, 100)
      const t1 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, header: true }))
      }, 150)
      const t2 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, body: true }))
      }, 250)
      const t3 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, image: true }))
      }, 350)
      return () => {
        clearTimeout(t0)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
    const t0 = setTimeout(() => {
      setLoadedSections(prev => ({ ...prev, flowers: true }))
    }, 200)
    const t1 = setTimeout(() => {
      setLoadedSections(prev => ({ ...prev, header: true }))
    }, 300)
    const t2 = setTimeout(() => {
      setLoadedSections(prev => ({ ...prev, body: true }))
    }, 420)
    const t3 = setTimeout(() => {
      setLoadedSections(prev => ({ ...prev, image: true }))
    }, 540)
    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isVisible, hasBeenSeen])

  // Reset colorize when page leaves view
  useEffect(() => {
    if (!isVisible) setImageColorized(false)
  }, [isVisible])

  // Colorize image when fully scrolled into viewport, revert when out
  useEffect(() => {
    if (!imageRef.current) return
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
      { threshold: 0.85 }
    )
    observer.observe(imageRef.current)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [loadedSections.image])

  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[44px] pb-[200px] max-[813px]:pt-[20px] max-[813px]:pb-[120px]">
      {/* Header section with flowers */}
      <div className="mx-auto flex flex-col items-center w-full max-w-[403px] px-6 desktop:px-0">
        {/* Watercolor Flowers — archived, not rendered (restore by uncommenting)
        <div className={`w-full ${loadedSections.flowers ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <WatercolorFlowers
            isVisible={loadedSections.flowers}
            hasBeenSeen={hasBeenSeen}
            height={130}
          />
        </div>
        */}

        {/* Top divider */}
        <div className={`w-full h-[1px] bg-[#eaeaea] mb-[16px] ${loadedSections.flowers ? 'component-loaded from-left' : 'component-hidden from-left'}`} />

        {/* Greeting Header */}
        <header className={`w-full ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings tourist, I'm <span className="relative inline-block">Joonseo<BrushUnderline isVisible={isVisible} hasBeenSeen={hasBeenSeen} /></span>.
          </h1>
          <p className="font-calluna text-[21px] text-[#a1a1a1] leading-[29px]">
            But feel free to call me Joon.
          </p>
        </header>
      </div>

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

      {/* Full-width divider */}
      <div className={`w-full h-[1px] bg-[#eaeaea] mt-[18px] mb-[20px] ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`} />

      {/* Body + image section */}
      <div className="mx-auto flex flex-col items-center w-full max-w-[403px] px-6 desktop:px-0">
        {/* Body content */}
        <div className={`w-full ${loadedSections.body ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          {/* Subheading */}
          <p className="font-graphik text-[14px] font-medium text-black mb-[5px]">
            I've had a nomadic upbringing.
          </p>

          {/* Body paragraphs */}
          <div className="flex flex-col gap-[10px]">
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              I popped into existence in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence, I suddenly found myself on another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.
            </p>
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              Spanish became my first language, empanadas my religion, and I earned my first unpaid internship as a 6-year-old altar boy at the local church. Up until a few years later when I boarded yet another plane, this time bound for Weihai, China.
            </p>
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              I settled in the culturally oxymoronic setting of a British-Korean school in Weihai, China, where I wore a blazer and tie every day while munching on latiao.
            </p>
          </div>
        </div>

        {/* Bottom image */}
        <div
          ref={imageRef}
          className={`w-full mt-[12px] h-[240px] rounded-[8px] overflow-hidden ${loadedSections.image ? 'component-loaded from-left' : 'component-hidden from-left'}`}
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

      </div>
    </div>
  )
}

export default About3

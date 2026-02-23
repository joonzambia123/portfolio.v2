// About3 - mobile about page matching the desktop AboutPanel content
import { useEffect, useRef, useState } from 'react'

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
    header: false,
    body: false,
    image: false,
  })

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) {
        setLoadedSections({ header: false, body: false, image: false })
      }
      return
    }
    if (hasBeenSeen) {
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
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
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
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isVisible, hasBeenSeen])

  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[174px] pb-[200px] max-[813px]:pt-[120px] max-[813px]:pb-[120px]">
      {/* Centered content container */}
      <div className="mx-auto flex flex-col items-center w-full max-w-[403px] px-6 desktop:px-0">

        {/* Greeting Header */}
        <header className={`mb-[20px] w-full ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings tourist, I'm <span className="relative inline-block">Joonseo<BrushUnderline isVisible={isVisible} hasBeenSeen={hasBeenSeen} /></span>.
          </h1>
          <p className="font-calluna text-[21px] text-[#a1a1a1] leading-[29px]">
            But feel free to call me Joon.
          </p>
        </header>

        {/* Divider */}
        <div className={`w-full h-[1px] bg-[#eaeaea] mb-[20px] ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`} />

        {/* Body content */}
        <div className={`w-full ${loadedSections.body ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          {/* Subheading */}
          <p className="font-graphik text-[14px] font-medium text-black mb-[5px]">
            I've had a bit of a nomadic upbringing.
          </p>

          {/* Body paragraphs */}
          <div className="flex flex-col gap-[10px]">
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              I was born in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence and a fondness for Potbelly sandwiches, I suddenly found myself in another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.
            </p>
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              Spanish became my primary language, empanadas my religion, and I earned my first unpaid internship as an 8-year-old altar boy at the local church.
            </p>
            <p className="font-graphik text-[14px] text-[#5b5b5e] leading-[25px]">
              But then, after a few years, I somehow popped over to a British school in Weihai, China, where I wore a blazer and tie every day and developed a dizzying international school accent that I am still not used to myself.
            </p>
          </div>
        </div>

        {/* Bottom image */}
        <div className={`w-full mt-[24px] h-[173px] rounded-[8px] overflow-hidden ${loadedSections.image ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <img
            src="/images/about-panel.jpg"
            alt="Personal photo"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>

      </div>
    </div>
  )
}

export default About3

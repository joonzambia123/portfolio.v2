// About3 - experimental about page based on original About design
// Removed: handwritten annotation, Korean name pronunciation overlay
import { useEffect, useRef, useState } from 'react'
import Timeline from '../About/Timeline'
import { timelineData } from '../About/timelineData'

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
    timeline: false,
    closing: false,
  })

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) {
        setLoadedSections({ header: false, timeline: false, closing: false })
      }
      return
    }
    if (hasBeenSeen) {
      const t1 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, header: true }))
      }, 150)
      const t2 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, timeline: true }))
      }, 250)
      const t3 = setTimeout(() => {
        setLoadedSections(prev => ({ ...prev, closing: true }))
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
      setLoadedSections(prev => ({ ...prev, timeline: true }))
    }, 420)
    const t3 = setTimeout(() => {
      setLoadedSections(prev => ({ ...prev, closing: true }))
    }, 540)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isVisible, hasBeenSeen])

  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[174px] pb-[200px] max-[813px]:pt-[120px] max-[813px]:pb-[120px]">
      {/* Centered content container - 403px max, responsive */}
      <div className="mx-auto flex flex-col items-center w-full max-w-[403px] px-6 desktop:px-0">

        {/* Greeting Header */}
        <header className={`flex flex-col gap-[8px] mb-[20px] w-full max-w-[417px] ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings tourist, I'm <span className="relative inline-block">Joon<BrushUnderline isVisible={isVisible} hasBeenSeen={hasBeenSeen} /></span>.
          </h1>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            I make things for screens and occasionally the real world. When I'm not pushing pixels or arguing with TypeScript, I'm out somewhere with a camera. Most of my work sits at the intersection of design and engineering — the kind of craft where a misaligned pixel can ruin your whole afternoon.
          </p>
        </header>

        {/* Timeline Section - full 403px width, no annotation */}
        <div className={`relative w-full max-w-[403px] ${loadedSections.timeline ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <Timeline milestones={timelineData} isVisible={isVisible} />
        </div>

        {/* Closing text */}
        <section className={`mt-[25px] w-full max-w-[417px] ${loadedSections.closing ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Outside of work, I collect hobbies the way some people collect stamps — earnestly, and with no clear endgame. Some are competitive, some are creative, and some are just an excuse to leave the house before noon.
          </p>
        </section>

      </div>
    </div>
  )
}

export default About3

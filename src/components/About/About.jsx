// About page with vertical timeline carousel
import { useEffect, useRef, useState } from 'react'
import Timeline from './Timeline'
import { timelineData } from './timelineData'

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

// Calligraphy animation for 장준서
// Per-character diagonal brush-sweep reveal using clip-path
const PRONUNCIATION_AUDIO = '/audio/name pronunciation.m4a'

const KoreanNameOverlay = ({ isVisible, hasBeenSeen }) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) setIsRevealed(false)
      return
    }
    if (hasBeenSeen) {
      setIsRevealed(true)
      return
    }
    const timer = setTimeout(() => setIsRevealed(true), 2100)
    return () => clearTimeout(timer)
  }, [isVisible, hasBeenSeen])

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(PRONUNCIATION_AUDIO)
    }
    audioRef.current.currentTime = 0
    audioRef.current.play()
  }

  const chars = [
    { char: '장', delay: '0ms' },
    { char: '준', delay: '300ms' },
    { char: '서', delay: '600ms' },
  ]

  return (
    <div
      className="absolute flex"
      style={{
        top: '-28px',
        right: '-10px',
        transform: 'rotate(-7deg)',
        letterSpacing: '-2px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {chars.map(({ char, delay }) => (
        <span
          key={char}
          style={{
            fontFamily: "'Nanum Brush Script', cursive",
            fontSize: '28px',
            color: '#333333',
            WebkitTextStroke: '0.2px #333333',
            opacity: 0.85,
            clipPath: isRevealed ? 'polygon(0% 0%, 120% 0%, 120% 120%, 0% 120%)' : 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 100%)',
            transition: hasBeenSeen ? 'none' : `clip-path 450ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}`,
          }}
        >
          {char}
        </span>
      ))}

      {/* Hover tooltip */}
      <div
        className="absolute"
        style={{
          bottom: '100%',
          left: '50%',
          transform: `translateX(-50%) translateY(${isHovered ? '-4px' : '0px'})`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 200ms ease, transform 200ms ease',
          pointerEvents: 'none',
          fontFamily: "'Graphik', -apple-system, sans-serif",
          fontSize: '11px',
          letterSpacing: 'normal',
          WebkitTextStroke: 'unset',
          lineHeight: '16px',
          color: '#5B5B5E',
          background: 'linear-gradient(180deg, #ffffff 0%, #fefefe 100%)',
          padding: '5px 9px',
          borderRadius: '8px',
          boxShadow: '0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.015)',
          border: '1px solid rgba(235, 238, 245, 0.85)',
          whiteSpace: 'nowrap',
          marginBottom: '6px',
        }}
      >
        Click to hear<br />pronunciation
      </div>
    </div>
  )
}


// Handwritten annotation: "my own little time machine..."
// Sequence: arrowhead draws → line draws → text letter-by-letter → dots
// On revisit: everything shown immediately, no animation replay
const CHAR_DELAY = 55 // ms per character

const HandwrittenAnnotation = ({ isVisible, hasBeenSeen }) => {
  const [arrowDrawn, setArrowDrawn] = useState(false)
  const [lineDrawn, setLineDrawn] = useState(false)
  const [textStarted, setTextStarted] = useState(false)
  const [dotsVisible, setDotsVisible] = useState(false)

  const line1 = 'a little time machine inspired'
  const line2 = 'by the carousel scene in mad men'
  const totalChars = line1.length + line2.length

  useEffect(() => {
    if (!isVisible) {
      if (!hasBeenSeen) {
        setArrowDrawn(false)
        setLineDrawn(false)
        setTextStarted(false)
        setDotsVisible(false)
      }
      return
    }
    // On revisit: snap everything to final state immediately
    if (hasBeenSeen) {
      setArrowDrawn(true)
      setLineDrawn(true)
      setTextStarted(true)
      setDotsVisible(3)
      return
    }
    // First visit: full sequential animation
    const arrowTimer = setTimeout(() => setArrowDrawn(true), 3200)
    const lineTimer = setTimeout(() => setLineDrawn(true), 3450)
    const textTimer = setTimeout(() => setTextStarted(true), 4250)
    const dotsBase = 4250 + totalChars * CHAR_DELAY + 150
    const dot1Timer = setTimeout(() => setDotsVisible(1), dotsBase)
    const dot2Timer = setTimeout(() => setDotsVisible(2), dotsBase + 200)
    const dot3Timer = setTimeout(() => setDotsVisible(3), dotsBase + 400)
    return () => {
      clearTimeout(arrowTimer)
      clearTimeout(lineTimer)
      clearTimeout(textTimer)
      clearTimeout(dot1Timer)
      clearTimeout(dot2Timer)
      clearTimeout(dot3Timer)
    }
  }, [isVisible, hasBeenSeen])

  const renderChars = (text, startIndex) =>
    text.split('').map((char, i) => (
      <span
        key={i}
        style={{
          opacity: textStarted ? 0.85 : 0,
          transition: hasBeenSeen ? 'none' : `opacity 120ms ease ${(startIndex + i) * CHAR_DELAY}ms`,
        }}
      >
        {char}
      </span>
    ))

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        right: '-410px',
        top: '190px',
      }}
    >
      <svg
        width="180"
        height="190"
        viewBox="0 0 180 190"
        fill="none"
        className="overflow-visible"
      >
        {/* Arrowhead — draws first */}
        <path
          d="M 0 0 Q 4 -1, 10 -3"
          stroke="#333333"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeOpacity="0.7"
          fill="none"
          style={{
            strokeDasharray: 12,
            strokeDashoffset: arrowDrawn ? 0 : 12,
            transition: hasBeenSeen ? 'none' : 'stroke-dashoffset 180ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <path
          d="M 0 0 Q 2 4, 6 9"
          stroke="#333333"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeOpacity="0.7"
          fill="none"
          style={{
            strokeDasharray: 12,
            strokeDashoffset: arrowDrawn ? 0 : 12,
            transition: hasBeenSeen ? 'none' : 'stroke-dashoffset 180ms cubic-bezier(0.22, 1, 0.36, 1) 60ms',
          }}
        />
        {/* Main curved line — draws after arrowhead */}
        <path
          d="M 0 0 C 32 8, 55 22, 72 42 C 90 62, 105 85, 125 108 C 138 128, 148 150, 155 175"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
          fill="none"
          style={{
            strokeDasharray: 250,
            strokeDashoffset: lineDrawn ? 0 : 250,
            transition: hasBeenSeen ? 'none' : 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      {/* Text — letter by letter */}
      <div
        style={{
          fontFamily: "'Nanum Brush Script', cursive",
          fontSize: '22px',
          color: '#333333',
          lineHeight: '26px',
          marginTop: '-12px',
          marginLeft: '110px',
          whiteSpace: 'nowrap',
          transform: 'rotate(-3deg)',
        }}
      >
        {renderChars(line1, 0)}
        <br />
        <span style={{ marginLeft: '6px' }}>{renderChars(line2, line1.length)}</span>
        {[
          { cx: 1.5, cy: 2.8, r: 1.1, ml: '2px', dot: 1 },
          { cx: 1.5, cy: 2.6, r: 1.15, ml: '3px', dot: 2 },
          { cx: 1.5, cy: 2.9, r: 1.05, ml: '3px', dot: 3 },
        ].map(({ cx, cy, r, ml, dot }) => (
          <svg
            key={dot}
            width="4"
            height="4"
            viewBox="0 0 4 4"
            fill="#333333"
            style={{
              display: 'inline-block',
              verticalAlign: 'baseline',
              marginLeft: ml,
              position: 'relative',
              top: '0px',
              opacity: dotsVisible >= dot ? 0.85 : 0,
              transition: hasBeenSeen ? 'none' : 'opacity 120ms ease',
            }}
          >
            <circle cx={cx} cy={cy} r={r} />
          </svg>
        ))}
      </div>
    </div>
  )
}

const About = ({ isVisible = false }) => {
  // Track whether the user has visited the about page at least once.
  // Once they navigate away after their first visit, all subsequent visits
  // show decorative elements (brush, Korean, handwritten) in their final state.
  const hasBeenSeenRef = useRef(false)
  const [hasBeenSeen, setHasBeenSeen] = useState(false)
  const visitedRef = useRef(false)

  useEffect(() => {
    if (isVisible) {
      visitedRef.current = true
    } else if (visitedRef.current && !hasBeenSeenRef.current) {
      // User is leaving after their first visit — mark as seen
      hasBeenSeenRef.current = true
      setHasBeenSeen(true)
    }
  }, [isVisible])

  // Staggered section reveal — simpler on revisit
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
      // Revisit: faster stagger, no waiting for elaborate animations
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
    // First visit: standard stagger
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

        {/* Greeting Header - narrower 341px max */}
        <header className={`flex flex-col gap-[8px] mb-[20px] w-full max-w-[341px] ${loadedSections.header ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings tourist, I'm <span className="relative inline-block"><span className="relative inline-block">Joon<BrushUnderline isVisible={isVisible} hasBeenSeen={hasBeenSeen} /></span>.<KoreanNameOverlay isVisible={isVisible} hasBeenSeen={hasBeenSeen} /></span>
          </h1>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            I make things for screens and occasionally the real world. When I'm not pushing pixels or arguing with TypeScript, I'm out somewhere with a camera.
          </p>
        </header>

        {/* Timeline Section - full 403px width, with annotation */}
        <div className={`relative w-full max-w-[403px] ${loadedSections.timeline ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <Timeline milestones={timelineData} isVisible={isVisible} />
          <HandwrittenAnnotation isVisible={isVisible} hasBeenSeen={hasBeenSeen} />
        </div>

        {/* Closing text - narrower 341px max */}
        <section className={`mt-[25px] w-full max-w-[341px] ${loadedSections.closing ? 'component-loaded from-left' : 'component-hidden from-left'}`}>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Outside of work, I collect hobbies the way some people collect stamps — earnestly, and with no clear endgame. Some are competitive, some are creative, and some are just an excuse to leave the house before noon.
          </p>
        </section>

      </div>
    </div>
  )
}

export default About

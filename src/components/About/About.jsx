// About page with vertical timeline carousel
import { useEffect, useRef, useState } from 'react'
import Timeline from './Timeline'
import { timelineData } from './timelineData'

// Brush stroke underline for "Joon"
const BrushUnderline = () => {
  const [isDrawn, setIsDrawn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsDrawn(true), 1500)
    return () => clearTimeout(timer)
  }, [])

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
        stroke="#007AFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.75"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: isDrawn ? 0 : 70,
          transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </svg>
  )
}

// Calligraphy animation for 장준서
// Per-character diagonal brush-sweep reveal using clip-path
const PRONUNCIATION_AUDIO = '/audio/name pronunciation.m4a'

const KoreanNameOverlay = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    // Appears after the underline finishes drawing (~1500 + 700 = 2200ms)
    const timer = setTimeout(() => setIsVisible(true), 2400)
    return () => clearTimeout(timer)
  }, [])

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
            color: '#007AFF',
            WebkitTextStroke: '0.4px #007AFF',
            opacity: 0.85,
            clipPath: isVisible ? 'polygon(0% 0%, 120% 0%, 120% 120%, 0% 120%)' : 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 100%)',
            transition: `clip-path 450ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}`,
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

const hobbiesData = [
  {
    label: "Led Korea's oldest and largest competitive ",
    bold: 'debate society',
    suffix: '.',
  },
  {
    label: 'Trying to tell fun stories through painfully ',
    bold: 'amateur movies',
    suffix: '.',
  },
  {
    label: 'I was once the 2x Chicago ',
    bold: 'taekwondo',
    suffix: ' champion, in poomsae and sparring.',
  },
  {
    label: 'Really like ',
    bold: 'chess',
    suffix: '. Actually a pretty mediocre player tho. Play me here.',
  },
  {
    label: 'Also enjoy playing ',
    bold: 'racket sports',
    suffix: ', both table tennis and just tennis.',
  },
  {
    label: 'Occasionally, I ',
    bold: 'sing',
    suffix: '. Sometimes, if I\'m feeling sadistic, in public. Run.',
  },
]

const HobbyCard = ({ label, bold, suffix, isVisible, delay }) => (
  <div
    className="flex flex-col"
    style={{
      width: '261px',
      gap: '10px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
    }}
  >
    <div
      className="rounded-[8px]"
      style={{
        width: '261px',
        height: '181px',
        backgroundColor: '#c4c4c4',
      }}
    />
    <p
      className="font-graphik"
      style={{
        fontSize: '14px',
        lineHeight: '22px',
        color: '#969494',
      }}
    >
      {label}
      <span style={{ color: '#e6eaee' }}>{bold}</span>
      {suffix}
    </p>
  </div>
)

const About = () => {
  const sectionRef = useRef(null)
  const [sectionVisible, setSectionVisible] = useState(false)
  const closingRef = useRef(null)
  const [closingVisible, setClosingVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = closingRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setClosingVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full min-h-screen bg-[#FCFCFC]">
      {/* Light section */}
      <div className="pt-[174px] pb-[45px]">
        {/* Centered content container - 403px for timeline per Figma */}
        <div className="mx-auto flex flex-col items-center" style={{ width: '403px' }}>

          {/* Greeting Header - narrower 341px */}
          <header className="flex flex-col gap-[8px] mb-[20px]" style={{ width: '341px' }}>
            <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
              Greetings tourist, I'm <span className="relative inline-block"><span className="relative inline-block">Joon<BrushUnderline /></span>.<KoreanNameOverlay /></span>
            </h1>
            <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
              I make things for screens and occasionally the real world. When I'm not pushing pixels or arguing with TypeScript, I'm out somewhere with a camera.
            </p>
          </header>

          {/* Timeline Section - full 403px width */}
          <Timeline milestones={timelineData} />

          {/* Closing text - narrower 341px */}
          <section className="mt-[25px] flex flex-col gap-[16px]" style={{ width: '341px' }}>
            <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
              Outside of work, I collect hobbies the way some people collect stamps — earnestly, and with no clear endgame. Some are competitive, some are creative, and some are just an excuse to leave the house before noon.
            </p>
            <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
              Below are a few of the things I care about when I'm not staring at a code editor. Most started as distractions and quietly became genuine obsessions.
            </p>
          </section>

        </div>
      </div>

      {/* Dark hobbies section */}
      <div
        ref={sectionRef}
        className="w-full dark-section-skeuomorphic"
        style={{
          padding: '45px 0',
        }}
      >
        <div
          className="mx-auto grid grid-cols-3"
          style={{
            gap: '40px 34px',
            width: 'fit-content',
          }}
        >
          {hobbiesData.map((hobby, i) => (
            <HobbyCard key={i} {...hobby} isVisible={sectionVisible} delay={i * 120} />
          ))}
        </div>
      </div>

      {/* Below hobbies text */}
      <div ref={closingRef} className="pt-[45px] pb-[200px]">
        <div className="mx-auto flex flex-col gap-[16px]" style={{ width: '341px' }}>
          <p
            className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]"
            style={{
              opacity: closingVisible ? 1 : 0,
              transform: closingVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 500ms ease, transform 500ms ease',
            }}
          >
            If you've scrolled this far, you're either genuinely curious or procrastinating. Either way, I appreciate it. I'm always open to meeting new people and hearing about what they're working on.
          </p>
          <p
            className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]"
            style={{
              opacity: closingVisible ? 1 : 0,
              transform: closingVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 500ms ease 120ms, transform 500ms ease 120ms',
            }}
          >
            Feel free to reach out if you want to collaborate, talk shop, or challenge me to a chess game you'll probably win.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About

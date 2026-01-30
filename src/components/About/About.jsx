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
const KoreanNameOverlay = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Appears after the underline finishes drawing (~1500 + 700 = 2200ms)
    const timer = setTimeout(() => setIsVisible(true), 2400)
    return () => clearTimeout(timer)
  }, [])

  const chars = [
    { char: '장', delay: '0ms' },
    { char: '준', delay: '300ms' },
    { char: '서', delay: '600ms' },
  ]

  return (
    <div
      className="absolute pointer-events-none flex"
      style={{
        top: '-28px',
        right: '-10px',
        transform: 'rotate(-4deg)',
        letterSpacing: '-2px',
      }}
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
    </div>
  )
}

const About = () => {
  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[174px] pb-[200px]">
      {/* Centered content container - 403px for timeline per Figma */}
      <div className="mx-auto flex flex-col items-center" style={{ width: '403px' }}>

        {/* Greeting Header - narrower 341px */}
        <header className="flex flex-col gap-[8px] mb-[20px]" style={{ width: '341px' }}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings tourist, I'm <span className="relative inline-block"><span className="relative inline-block">Joon<BrushUnderline /></span>.<KoreanNameOverlay /></span>
          </h1>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription.
          </p>
        </header>

        {/* Timeline Section - full 403px width */}
        <Timeline milestones={timelineData} />

        {/* Closing text - narrower 341px */}
        <section className="mt-[25px]" style={{ width: '341px' }}>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription. Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription. To be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription.
          </p>
        </section>

      </div>
    </div>
  )
}

export default About

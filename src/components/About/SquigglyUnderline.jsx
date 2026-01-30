// Animated squiggly underline with pencil-like stroke
import { useEffect, useState } from 'react'

const SquigglyUnderline = ({ children, delay = 600 }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount with configurable delay
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <span className="relative inline-block">
      {children}
      <svg
        className="absolute left-0 w-full overflow-visible pointer-events-none"
        style={{
          bottom: '-2px',
          height: '10px'
        }}
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Blue pencil-like gradient with varying opacity for natural stroke feel */}
          <linearGradient id="bluePencilGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5B8FB9" stopOpacity="0.6" />
            <stop offset="15%" stopColor="#4A7FA8" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#3A6F98" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#2E5F85" stopOpacity="1" />
            <stop offset="65%" stopColor="#3A6F98" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#4A7FA8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#5B8FB9" stopOpacity="0.6" />
          </linearGradient>
          {/* Subtle texture filter for pencil grain effect */}
          <filter id="pencilTexture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {/* Main squiggly stroke */}
        <path
          d="M 0 5 Q 6 2, 12 5 T 24 5 T 36 5 T 48 5 T 60 5 T 72 5 T 84 5 T 96 5 L 100 5"
          fill="none"
          stroke="url(#bluePencilGradient)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pencilTexture)"
          style={{
            strokeDasharray: 160,
            strokeDashoffset: isVisible ? 0 : 160,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />
        {/* Secondary stroke for depth and pencil layering effect */}
        <path
          d="M 1 5.4 Q 7 2.6, 13 5.4 T 25 5.4 T 37 5.4 T 49 5.4 T 61 5.4 T 73 5.4 T 85 5.4 T 97 5.4"
          fill="none"
          stroke="#6B9FC9"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeOpacity="0.35"
          filter="url(#pencilTexture)"
          style={{
            strokeDasharray: 160,
            strokeDashoffset: isVisible ? 0 : 160,
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.05s'
          }}
        />
        {/* Highlight stroke for pencil sheen */}
        <path
          d="M 2 4.6 Q 8 1.8, 14 4.6 T 26 4.6 T 38 4.6 T 50 4.6 T 62 4.6 T 74 4.6 T 86 4.6 T 98 4.6"
          fill="none"
          stroke="#8FBFE0"
          strokeWidth="0.4"
          strokeLinecap="round"
          strokeOpacity="0.25"
          style={{
            strokeDasharray: 160,
            strokeDashoffset: isVisible ? 0 : 160,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.1s'
          }}
        />
      </svg>
    </span>
  )
}

export default SquigglyUnderline

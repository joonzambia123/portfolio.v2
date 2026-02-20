// About2 - experimental about page with home-like frame layout (video LEFT, text RIGHT)
// Text column is independently scrollable with fading last lines
import { useEffect, useRef, useState } from 'react'

const ABOUT_VIDEO_SRC = 'https://joonseo-videos.b-cdn.net/premium/About_Premium.mp4?v=5'
const ABOUT_VIDEO_SRC_SAFARI = 'https://joonseo-videos.b-cdn.net/safari/About_Safari.mp4?v=2'

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const About2 = ({ isVisible = false }) => {
  const textColumnRef = useRef(null)
  const videoRef = useRef(null)

  // Play/pause video based on visibility
  useEffect(() => {
    if (!videoRef.current) return
    if (isVisible) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isVisible])

  // Staggered load animation
  const [loaded, setLoaded] = useState({ video: false, text: false })

  useEffect(() => {
    if (!isVisible) {
      setLoaded({ video: false, text: false })
      return
    }
    const t1 = setTimeout(() => setLoaded(p => ({ ...p, video: true })), 350)
    const t2 = setTimeout(() => setLoaded(p => ({ ...p, text: true })), 480)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isVisible])

  const videoSrc = isSafari() ? ABOUT_VIDEO_SRC_SAFARI : ABOUT_VIDEO_SRC

  return (
    <div
      className="w-full h-screen overflow-hidden bg-[#FCFCFC]"
      style={{ position: 'relative' }}
    >
      {/* Centered content — mirrored layout: video LEFT, text RIGHT */}
      <div
        className="flex gap-[50px] items-start text-left about2-content-wrapper"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Left Column — Video Frame (matching home page skeuomorphic style) */}
        <div
          className={`about2-video-frame group flex flex-col h-[470px] items-start justify-end rounded-[14px] w-[346px] relative overflow-visible outline outline-1 outline-black/5 cursor-default ${loaded.video ? 'component-loaded from-left' : 'component-hidden from-left'}`}
          style={{ flexShrink: 0 }}
        >
          {/* Video area */}
          <div className="absolute inset-0 rounded-[14px] overflow-hidden z-0 bg-[#f5f5f5]">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover brightness-[1.10] group-hover:brightness-[1.20]"
              style={{ transition: 'filter 250ms ease-in-out' }}
              muted
              playsInline
              preload="auto"
              loop
              controls={false}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          </div>

          {/* Light metadata bar at bottom — expanding on hover, Figma design */}
          <div className="relative z-30 w-full">
            <div
              className="about2-metadata-bar rounded-[14px] w-full relative"
              style={{
                height: '40px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #f7f7f7 0%, #f2f2f2 100%)',
                border: '1px solid rgba(235, 238, 245, 0.85)',
                boxShadow: '0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.015)',
              }}
            >
              {/* Top row: location + city — vertically centered in 40px bar */}
              <div className="absolute left-[12px] right-[12px] top-0 h-[40px] flex items-center justify-between min-w-0 max-w-full z-10">
                <p className="font-graphik text-[14px] text-[#333] leading-normal whitespace-nowrap shrink-0">
                  Speaking at Figma office.
                </p>
                <p className="font-graphik text-[14px] text-[#aeaeae] leading-normal whitespace-nowrap">
                  Singapore
                </p>
              </div>

              {/* Bottom row: camera info (fades in on hover) */}
              <div className="absolute left-[12px] right-[12px] bottom-[15px] flex items-end justify-between about2-metadata-fade z-10">
                <div className="flex flex-col gap-[8px]">
                  <p className="font-graphik text-[14px] text-[#888] leading-normal whitespace-nowrap">
                    Sony FX3 · Sigma 24-70
                  </p>
                  <p className="font-graphik text-[14px] text-[#888] leading-normal whitespace-nowrap">
                    f2.8 · 1/60s · ISO <span style={{ color: '#333' }}>270</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Scrollable Text */}
        <div
          className={`flex flex-col w-[375px] relative ${loaded.text ? 'component-loaded from-right' : 'component-hidden from-right'}`}
          style={{ flexShrink: 0, height: '470px' }}
        >
          {/* Scrollable text container */}
          <div
            ref={textColumnRef}
            className="about2-text-scroll overflow-y-auto flex-1 pr-[8px]"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 65%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.15) 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.15) 90%, transparent 100%)',
            }}
          >
            {/* Top whitespace — pushes heading down for breathing room */}
            <div className="h-[35px]" />

            {/* Heading */}
            <h1 className="font-calluna text-[21px] text-[#333] leading-[29px] mb-[10px]">
              Greetings tourist, I'm Joon.
            </h1>

            {/* Bio paragraphs */}
            <div className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
              <p className="mb-[10px]">
                Filming, figmaing, claudeing my way to a second breakfast. No admittance unless on party business.
              </p>
              <p className="mb-[10px]">
                I'm currently building <a href="https://studentmachines.com" target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark">Student Machine Lab</a>, where we craft delightful AI interfaces for local LLMs.
              </p>
              <p className="mb-[10px]">
                Doing fun experiments at <a href="https://mobbin.com" target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark">Mobbin</a> as a growth engineer, previously led a national campaign for Perplexity.
              </p>
              <p className="mb-[10px]">
                I was the sole analyst at <a href="https://www.businesswire.com/news/home/20241022128248/en/HRZ-Han-River-Launches-%24100-Million-Venture-Fund-to-Fuel-Korea-Graph-Tech-Startups" target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark">Han River Partners</a>, working under Chris Koh, co-founder of <a href="https://www.coupang.com" target="_blank" rel="noopener noreferrer" className="dotted-underline-grey text-grey-dark">Coupang (NYSE: CPNG)</a>.
              </p>

              {/* Dummy text for scroll testing */}
              <p className="mb-[10px]">
                Before that, I spent a year traveling through Southeast Asia with a backpack and a camera, documenting street food culture and the people behind every dish.
              </p>
              <p className="mb-[10px]">
                I once tried to learn how to make ramen from scratch in Kagoshima. It took three days and the broth still wasn't right, but the journey was worth every failed batch.
              </p>
              <p className="mb-[10px]">
                On weekends, you'll find me either at a local coffee roaster arguing about extraction times, or deep in a rabbit hole of mechanical keyboard builds that I'll never finish.
              </p>
              <p className="mb-[10px]">
                There's something about putting things on the internet that feels like sending letters to strangers. You never know who'll read them, but you write anyway.
              </p>
              <p className="mb-[10px]">
                I believe the best software feels like it was made by someone who cares — not just about the pixels, but about the person on the other side of the screen.
              </p>
              <p className="mb-[10px]">
                If you've made it this far, we should probably talk. Or at least share a coffee.
              </p>
              {/* Extra bottom padding so content can scroll past the fade */}
              <div className="h-[80px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About2

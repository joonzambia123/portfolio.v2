import { useEffect, useRef } from 'react'

const AboutPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null)

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
        {/* Header */}
        <header className="flex flex-col gap-[7px] px-[24px] pt-[calc(38vh-40px)]">
          <h1 className="font-calluna text-[21px] text-[#333] leading-[1] whitespace-nowrap">
            Greetings tourist, I'm Joonseo.
          </h1>
          <p className="font-calluna text-[21px] text-[#a1a1a1] leading-[1] whitespace-nowrap">
            But feel free to call me Joon.
          </p>
        </header>

        {/* Divider + body content */}
        <div className="flex flex-col gap-[15px] items-center mt-[16px] w-full">
          {/* Divider - full width */}
          <div className="w-full h-[1px] bg-[#eaeaea]" />

          {/* Text content - 337px wide centered in 385px */}
          <div className="flex flex-col gap-[5px] w-[337px] leading-[25px] text-[14px]">
            <p className="font-graphik font-medium text-black">
              I've had a bit of a nomadic upbringing.
            </p>
            <div className="flex flex-col gap-[10px] font-graphik text-[#5b5b5e]">
              <p>I was born in Bundang, South Korea, but then moved to John Hughes' suburbia of Northbrook, Chicago as an infant. Having barely attained object permanence and a fondness for Potbelly sandwiches, I suddenly found myself in another plane to Bogota, Colombia, the birthplace of magical realism and Shakira.</p>
              <p>Spanish became my primary language, empanadas my religion, and I earned my first unpaid internship as an 8-year-old altar boy at the local church.</p>
              <p>But then, after a few years, I somehow popped over to a British school in Weihai, China, where I wore a blazer and tie every day and developed a dizzying international school accent that I am still not used to myself.</p>
            </div>
          </div>
        </div>

        {/* Bottom image */}
        <div className="w-full h-[173px] overflow-hidden mt-[25px]">
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

// About page with NYT-inspired scroll-triggered timeline
import Timeline from './Timeline'
import { timelineData } from './timelineData'

const About = () => {
  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[180px] pb-[200px]">
      {/* Centered content container - 341px max-width per Figma */}
      <div className="mx-auto px-6" style={{ maxWidth: '341px' }}>

        {/* Greeting Header */}
        <header className="flex flex-col gap-[10px] mb-[48px]">
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings wanderer, I'm Joon.
          </h1>
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription.
          </p>
        </header>

        {/* Timeline Section */}
        <Timeline milestones={timelineData} />

        {/* Closing text */}
        <section className="mt-[40px]">
          <p className="font-graphik text-[14px] text-[#5B5B5E] leading-[25px]">
            Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription. Supposed to be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription. To be a jovial little junior at Yonsei University but unfortunately I am currently stuck in the hellish limbo that is military conscription.
          </p>
        </section>

      </div>
    </div>
  )
}

export default About

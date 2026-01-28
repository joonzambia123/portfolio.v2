// About page with vertical timeline carousel
import Timeline from './Timeline'
import { timelineData } from './timelineData'

const About = () => {
  return (
    <div className="w-full min-h-screen bg-[#FCFCFC] pt-[184px] pb-[200px]">
      {/* Centered content container - 403px for timeline per Figma */}
      <div className="mx-auto flex flex-col items-center" style={{ width: '403px' }}>

        {/* Greeting Header - narrower 341px */}
        <header className="flex flex-col gap-[8px] mb-[20px]" style={{ width: '341px' }}>
          <h1 className="font-calluna text-[21px] text-[#333] leading-[29px]">
            Greetings wanderer, I'm Joon.
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

// Timeline milestone - NYT minimal design

const TimelineMilestone = ({ milestone, isActive, onClick }) => {
  const { id, year, image, caption, alt } = milestone

  return (
    <div
      data-milestone-id={id}
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer flex-shrink-0"
      style={{ width: '140px' }}
    >
      {/* Photo container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '70px',
          height: '84px',
          borderRadius: '6px',
          opacity: isActive ? 1 : 0.3,
          transform: isActive ? 'scale(1)' : 'scale(0.95)',
          boxShadow: isActive
            ? '0 1px 6px rgba(0,0,0,0.1)'
            : 'none',
          border: isActive ? 'none' : '1px solid rgba(0,0,0,0.04)',
          transition: 'opacity 400ms ease, transform 400ms ease, box-shadow 400ms ease'
        }}
      >
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable="false"
        />
      </div>

      {/* Circle marker */}
      <div
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          marginTop: '16px',
          marginBottom: '16px',
          backgroundColor: isActive ? '#4A4A4A' : '#D4D4D4',
          transition: 'background-color 400ms ease'
        }}
      />

      {/* Caption container - fixed height */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <p
          className="font-graphik text-center"
          style={{
            fontSize: '12px',
            lineHeight: '1.4',
            maxWidth: '110px',
            color: isActive ? '#4A4A4A' : '#B0B0B0',
            transition: 'color 400ms ease'
          }}
        >
          {caption}
        </p>
      </div>

      {/* Year */}
      <span
        className="font-graphik"
        style={{
          fontSize: '10px',
          letterSpacing: '0.04em',
          marginTop: '4px',
          color: isActive ? '#9A9A9A' : '#CDCDCD',
          transition: 'color 400ms ease'
        }}
      >
        {year}
      </span>
    </div>
  )
}

export default TimelineMilestone

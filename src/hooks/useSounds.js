import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for generating warm, beautiful synth sound effects
 * Uses Web Audio API with layered harmonics for richer tones
 */
export function useSounds() {
  const audioContextRef = useRef(null)
  const isEnabledRef = useRef(true)
  const isInitializedRef = useRef(false)

  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      isInitializedRef.current = true
    } catch (e) {}
  }, [])

  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown']
    const handleInteraction = () => {
      initAudio()
      events.forEach(event => document.removeEventListener(event, handleInteraction))
    }
    events.forEach(event => document.addEventListener(event, handleInteraction, { once: true }))

    return () => {
      events.forEach(event => document.removeEventListener(event, handleInteraction))
    }
  }, [initAudio])

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  /**
   * Create a rich tone with optional harmonics
   */
  const createTone = useCallback((options = {}) => {
    const {
      frequency = 440,
      type = 'sine',
      duration = 0.15,
      volume = 0.04,
      attack = 0.02,
      decay = 0.1,
      filterFreq = 2000,
      filterQ = 0.5,
      harmonics = [], // Array of { ratio, volume } for overtones
    } = options

    if (!isEnabledRef.current) return

    try {
      const ctx = getAudioContext()
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime

      // Master gain for this sound
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0, now)
      masterGain.gain.linearRampToValueAtTime(volume, now + attack)
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)
      masterGain.connect(ctx.destination)

      // Lowpass filter for warmth
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterFreq, now)
      filter.Q.setValueAtTime(filterQ, now)
      filter.connect(masterGain)

      // Fundamental oscillator
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, now)
      osc.connect(filter)
      osc.start(now)
      osc.stop(now + duration + 0.2)

      // Add harmonics for richness
      harmonics.forEach(h => {
        const harmOsc = ctx.createOscillator()
        const harmGain = ctx.createGain()
        harmOsc.type = 'sine'
        harmOsc.frequency.setValueAtTime(frequency * h.ratio, now)
        harmGain.gain.setValueAtTime(h.volume, now)
        harmOsc.connect(harmGain)
        harmGain.connect(filter)
        harmOsc.start(now)
        harmOsc.stop(now + duration + 0.2)
      })
    } catch (e) {}
  }, [getAudioContext])

  // ============================================
  // Beautiful Sound Presets
  // ============================================

  /**
   * Hover - gentle bell-like chime
   */
  const playHover = useCallback(() => {
    createTone({
      frequency: 880,
      type: 'sine',
      duration: 0.12,
      volume: 0.025,
      attack: 0.005,
      decay: 0.1,
      filterFreq: 3000,
      harmonics: [
        { ratio: 2, volume: 0.008 },    // Octave
        { ratio: 3, volume: 0.004 },    // Fifth above octave
      ],
    })
  }, [createTone])

  /**
   * Click - soft, satisfying confirmation
   */
  const playClick = useCallback(() => {
    // Fundamental with warm overtones
    createTone({
      frequency: 440,
      type: 'triangle',
      duration: 0.1,
      volume: 0.04,
      attack: 0.002,
      decay: 0.08,
      filterFreq: 1800,
      harmonics: [
        { ratio: 2, volume: 0.015 },
        { ratio: 2.5, volume: 0.008 },  // Minor third color
      ],
    })
  }, [createTone])

  /**
   * Arrow navigation - gentle whoosh with pitch
   */
  const playArrow = useCallback(() => {
    createTone({
      frequency: 523, // C5
      type: 'sine',
      duration: 0.1,
      volume: 0.035,
      attack: 0.008,
      decay: 0.08,
      filterFreq: 1600,
      harmonics: [
        { ratio: 1.5, volume: 0.012 },  // Perfect fifth
        { ratio: 2, volume: 0.006 },
      ],
    })
  }, [createTone])

  /**
   * Video card hover - dreamy pad entrance
   */
  const playCardHover = useCallback(() => {
    // Play a soft major 7th chord spread over time
    const notes = [
      { freq: 349, delay: 0 },      // F4
      { freq: 440, delay: 15 },     // A4
      { freq: 523, delay: 30 },     // C5
      { freq: 659, delay: 45 },     // E5
    ]
    notes.forEach(({ freq, delay }) => {
      setTimeout(() => {
        createTone({
          frequency: freq,
          type: 'sine',
          duration: 0.25,
          volume: 0.018,
          attack: 0.04,
          decay: 0.2,
          filterFreq: 1200,
          harmonics: [{ ratio: 2, volume: 0.005 }],
        })
      }, delay)
    })
  }, [createTone])

  /**
   * Music player hover - playful ascending arpeggio
   */
  const playMusicHover = useCallback(() => {
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createTone({
          frequency: freq,
          type: 'sine',
          duration: 0.12,
          volume: 0.02,
          attack: 0.008,
          decay: 0.1,
          filterFreq: 2200,
          harmonics: [{ ratio: 2, volume: 0.006 }],
        })
      }, i * 45)
    })
  }, [createTone])

  /**
   * Link hover - subtle sparkle
   */
  const playLinkHover = useCallback(() => {
    createTone({
      frequency: 1047, // C6
      type: 'sine',
      duration: 0.06,
      volume: 0.015,
      attack: 0.003,
      decay: 0.05,
      filterFreq: 4000,
    })
  }, [createTone])

  const setEnabled = useCallback((enabled) => {
    isEnabledRef.current = enabled
  }, [])

  return {
    playHover,
    playClick,
    playArrow,
    playLinkHover,
    playCardHover,
    playMusicHover,
    setEnabled,
  }
}

export default useSounds

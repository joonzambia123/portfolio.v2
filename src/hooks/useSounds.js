import { useRef, useCallback, useEffect } from 'react'

/**
 * Refined sound effects - digital liquid, tactile
 * Warm, smooth, professional
 */
export function useSounds() {
  const audioContextRef = useRef(null)
  const isEnabledRef = useRef(true)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  useEffect(() => {
    const initOnInteraction = () => {
      getAudioContext()
    }
    document.addEventListener('click', initOnInteraction, { once: true })
    return () => document.removeEventListener('click', initOnInteraction)
  }, [getAudioContext])

  /**
   * Create a warm, liquid tone with smooth envelope
   */
  const createTone = useCallback((options = {}) => {
    const {
      frequency = 220,
      duration = 0.15,
      volume = 0.04,
      attack = 0.03,
      decay = 0.12,
      filterFreq = 800,
      pitchDecay = 0, // Pitch drops by this amount over duration
    } = options

    if (!isEnabledRef.current) return

    try {
      const ctx = getAudioContext()
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime

      // Main oscillator - sine for smoothness
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, now)
      if (pitchDecay > 0) {
        osc.frequency.exponentialRampToValueAtTime(frequency - pitchDecay, now + duration)
      }

      // Sub oscillator for depth (octave below, quieter)
      const subOsc = ctx.createOscillator()
      subOsc.type = 'sine'
      subOsc.frequency.setValueAtTime(frequency / 2, now)
      if (pitchDecay > 0) {
        subOsc.frequency.exponentialRampToValueAtTime((frequency - pitchDecay) / 2, now + duration)
      }

      // Low-pass filter - cuts brightness, keeps warmth
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterFreq, now)
      filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.3, now + duration)
      filter.Q.setValueAtTime(0.7, now)

      // Main gain envelope - smooth attack, natural decay
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + attack)
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

      // Sub gain - quieter
      const subGain = ctx.createGain()
      subGain.gain.setValueAtTime(volume * 0.3, now)
      subGain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

      // Connect
      osc.connect(filter)
      subOsc.connect(subGain)
      subGain.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      // Play
      osc.start(now)
      subOsc.start(now)
      osc.stop(now + duration + 0.1)
      subOsc.stop(now + duration + 0.1)
    } catch (e) {}
  }, [getAudioContext])

  // ============================================
  // Sound Presets - Liquid, Tactile, Refined
  // ============================================

  /**
   * Hover - soft, warm drop
   */
  const playHover = useCallback(() => {
    createTone({
      frequency: 440,
      duration: 0.12,
      volume: 0.025,
      attack: 0.015,
      decay: 0.1,
      filterFreq: 600,
      pitchDecay: 40,
    })
  }, [createTone])

  /**
   * Click - tactile pop with body
   */
  const playClick = useCallback(() => {
    createTone({
      frequency: 280,
      duration: 0.1,
      volume: 0.04,
      attack: 0.005,
      decay: 0.09,
      filterFreq: 900,
      pitchDecay: 60,
    })
  }, [createTone])

  /**
   * Arrow - smooth slide
   */
  const playArrow = useCallback(() => {
    createTone({
      frequency: 330,
      duration: 0.11,
      volume: 0.03,
      attack: 0.01,
      decay: 0.1,
      filterFreq: 700,
      pitchDecay: 50,
    })
  }, [createTone])

  /**
   * Card hover - warm ambient wash
   */
  const playCardHover = useCallback(() => {
    // Staggered warm tones
    const notes = [220, 277, 330]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createTone({
          frequency: freq,
          duration: 0.2,
          volume: 0.015,
          attack: 0.04,
          decay: 0.16,
          filterFreq: 500,
          pitchDecay: 20,
        })
      }, i * 25)
    })
  }, [createTone])

  /**
   * Music hover - gentle rising sequence
   */
  const playMusicHover = useCallback(() => {
    const notes = [262, 330, 392]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createTone({
          frequency: freq,
          duration: 0.14,
          volume: 0.02,
          attack: 0.02,
          decay: 0.12,
          filterFreq: 650,
          pitchDecay: 30,
        })
      }, i * 50)
    })
  }, [createTone])

  /**
   * Link hover - subtle tick
   */
  const playLinkHover = useCallback(() => {
    createTone({
      frequency: 520,
      duration: 0.06,
      volume: 0.015,
      attack: 0.008,
      decay: 0.05,
      filterFreq: 700,
      pitchDecay: 80,
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

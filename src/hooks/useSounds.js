import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for generating warm, retro synth sound effects
 * Uses Web Audio API to create cozy, lo-fi synthesized sounds
 */
export function useSounds() {
  const audioContextRef = useRef(null)
  const isEnabledRef = useRef(true)
  const isInitializedRef = useRef(false)

  // Initialize audio context on first user interaction
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
    } catch (e) {
      // Audio not supported
    }
  }, [])

  // Set up global listeners to initialize audio on first interaction
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown']

    const handleInteraction = () => {
      initAudio()
      // Remove listeners after first interaction
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [initAudio])

  // Get or create audio context
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
   * Create a warm, filtered oscillator with envelope
   */
  const createSynthTone = useCallback((options = {}) => {
    const {
      frequency = 440,
      type = 'sine',
      duration = 0.08,
      volume = 0.06,
      attack = 0.01,
      decay = 0.05,
      filterFreq = 1500,
      filterQ = 0.7,
      detune = 0,
    } = options

    if (!isEnabledRef.current) return

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const now = ctx.currentTime

      // Create oscillator
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, now)
      osc.detune.setValueAtTime(detune, now)

      // Create filter for warmth (lower frequency = warmer/cozier)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterFreq, now)
      filter.Q.setValueAtTime(filterQ, now)

      // Create gain for envelope
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + attack)
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

      // Connect: osc -> filter -> gain -> destination
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      // Play
      osc.start(now)
      osc.stop(now + duration + 0.1)
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }, [getAudioContext])

  /**
   * Create a chord (multiple tones)
   */
  const createChord = useCallback((frequencies, options = {}) => {
    frequencies.forEach((freq, i) => {
      createSynthTone({
        ...options,
        frequency: freq,
        volume: (options.volume || 0.04) / frequencies.length,
        detune: (i - frequencies.length / 2) * 3,
      })
    })
  }, [createSynthTone])

  /**
   * Create a tone with frequency sweep (for more dynamic sounds)
   */
  const createSweepTone = useCallback((options = {}) => {
    const {
      startFreq = 440,
      endFreq = 440,
      type = 'sine',
      duration = 0.08,
      volume = 0.06,
      attack = 0.01,
      decay = 0.05,
      filterFreq = 1500,
      filterQ = 0.7,
    } = options

    if (!isEnabledRef.current) return

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(startFreq, now)
      if (startFreq !== endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + attack + decay * 0.5)
      }

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterFreq, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + attack)
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration + 0.1)
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext])

  // ============================================
  // Sound Presets - Apple-Inspired Refined Design
  // ============================================

  /**
   * Hover sound - crisp, subtle, almost imperceptible
   */
  const playHover = useCallback(() => {
    createSweepTone({
      startFreq: 440,
      endFreq: 523.25, // A4 to C5 - clean musical interval
      type: 'sine',
      duration: 0.04,
      volume: 0.015,
      attack: 0.001,
      decay: 0.035,
      filterFreq: 3000,
      filterQ: 0.3,
    })
  }, [createSweepTone])

  /**
   * Click sound - precise, clean tap with subtle harmonic
   */
  const playClick = useCallback(() => {
    // Main tone - clean and crisp
    createSynthTone({
      frequency: 600,
      type: 'sine',
      duration: 0.03,
      volume: 0.03,
      attack: 0.0005,
      decay: 0.028,
      filterFreq: 4000,
      filterQ: 0.2,
    })
    // Subtle harmonic - adds richness without brightness
    createSynthTone({
      frequency: 1200,
      type: 'sine',
      duration: 0.02,
      volume: 0.008,
      attack: 0.0003,
      decay: 0.018,
      filterFreq: 5000,
    })
  }, [createSynthTone])

  /**
   * Arrow navigation - clean directional sweep
   */
  const playArrow = useCallback(() => {
    createSweepTone({
      startFreq: 392.00, // G4
      endFreq: 493.88, // B4
      type: 'sine',
      duration: 0.06,
      volume: 0.025,
      attack: 0.002,
      decay: 0.055,
      filterFreq: 3500,
      filterQ: 0.25,
    })
  }, [createSweepTone])

  /**
   * Link hover - whisper quiet, refined
   */
  const playLinkHover = useCallback(() => {
    createSweepTone({
      startFreq: 523.25, // C5
      endFreq: 587.33, // D5
      type: 'sine',
      duration: 0.035,
      volume: 0.012,
      attack: 0.001,
      decay: 0.032,
      filterFreq: 3500,
    })
  }, [createSweepTone])

  /**
   * Video card hover - soft ambient pad (kept for potential future use)
   */
  const playCardHover = useCallback(() => {
    createChord([261.63, 329.63, 392.00], { // C4, E4, G4 - clean major triad
      type: 'sine',
      duration: 0.12,
      volume: 0.03,
      attack: 0.01,
      decay: 0.1,
      filterFreq: 2500,
    })
  }, [createChord])

  /**
   * Music player hover - elegant, refined arpeggio
   */
  const playMusicHover = useCallback(() => {
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5 - clean major triad
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createSweepTone({
          startFreq: freq * 0.98,
          endFreq: freq,
          type: 'sine',
          duration: 0.08,
          volume: 0.018,
          attack: 0.002,
          decay: 0.075,
          filterFreq: 4000,
          filterQ: 0.2,
        })
      }, i * 30)
    })
  }, [createSweepTone])

  /**
   * Toggle/enable sounds
   */
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

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

  // ============================================
  // Sound Presets - Quieter, Cozier vibes
  // ============================================

  /**
   * Soft hover sound - very gentle blip
   */
  const playHover = useCallback(() => {
    createSynthTone({
      frequency: 740,
      type: 'sine',
      duration: 0.05,
      volume: 0.03,
      attack: 0.008,
      decay: 0.04,
      filterFreq: 1800,
    })
  }, [createSynthTone])

  /**
   * Click sound - soft, muted pop
   */
  const playClick = useCallback(() => {
    createSynthTone({
      frequency: 520,
      type: 'triangle',
      duration: 0.06,
      volume: 0.045,
      attack: 0.003,
      decay: 0.05,
      filterFreq: 1400,
    })
    createSynthTone({
      frequency: 780,
      type: 'sine',
      duration: 0.04,
      volume: 0.02,
      attack: 0.002,
      decay: 0.03,
      filterFreq: 2000,
    })
  }, [createSynthTone])

  /**
   * Navigation arrow sound - subtle, warm
   */
  const playArrow = useCallback(() => {
    createSynthTone({
      frequency: 440,
      type: 'triangle',
      duration: 0.08,
      volume: 0.04,
      attack: 0.008,
      decay: 0.06,
      filterFreq: 1200,
      filterQ: 0.5,
    })
  }, [createSynthTone])

  /**
   * Link hover - whisper quiet
   */
  const playLinkHover = useCallback(() => {
    createSynthTone({
      frequency: 880,
      type: 'sine',
      duration: 0.035,
      volume: 0.02,
      attack: 0.005,
      decay: 0.025,
      filterFreq: 2000,
    })
  }, [createSynthTone])

  /**
   * Video card hover - very soft ambient pad
   */
  const playCardHover = useCallback(() => {
    createChord([330, 440, 550], { // Warm Am-ish voicing
      type: 'sine',
      duration: 0.18,
      volume: 0.045,
      attack: 0.03,
      decay: 0.14,
      filterFreq: 1000,
    })
  }, [createChord])

  /**
   * Music player hover - gentle ascending notes
   */
  const playMusicHover = useCallback(() => {
    const notes = [440, 550, 660] // A4, C#5, E5 - softer voicing
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createSynthTone({
          frequency: freq,
          type: 'sine',
          duration: 0.07,
          volume: 0.025,
          attack: 0.008,
          decay: 0.05,
          filterFreq: 1600,
        })
      }, i * 35)
    })
  }, [createSynthTone])

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

import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for generating warm, retro synth sound effects
 * Uses Web Audio API to create cozy, lo-fi synthesized sounds
 */
export function useSounds() {
  const audioContextRef = useRef(null)
  const isEnabledRef = useRef(true)
  const isInitializedRef = useRef(false)
  const lastPlayRef = useRef(0)

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
  // Returns null if the context was just resumed from suspension —
  // callers should skip the sound to avoid the loud crackling burst
  // that happens when oscillators are scheduled on a stale currentTime.
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
      return null
    }
    return audioContextRef.current
  }, [])

  // ============================================
  // Sound Presets - Apple-Inspired Refined Design
  // ============================================

  /**
   * Hover sound - disabled (no-op)
   */
  const playHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Click sound - warm octave pop (C3→C4)
   */
  const playClick = useCallback(() => {
    if (!isEnabledRef.current) return
    const now = performance.now()
    if (now - lastPlayRef.current < 80) return
    lastPlayRef.current = now

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const now = ctx.currentTime

      // First tone: sine settling to C3 (~131Hz)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(195, now)
      osc1.frequency.exponentialRampToValueAtTime(131, now + 0.04)
      const og1 = ctx.createGain()
      og1.gain.setValueAtTime(0, now)
      og1.gain.linearRampToValueAtTime(0.38, now + 0.005)
      og1.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
      osc1.connect(og1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.055)

      // Second tone: C4 (262Hz) — octave up, delayed
      const d = 0.085
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 262
      const og2 = ctx.createGain()
      og2.gain.setValueAtTime(0, now + d)
      og2.gain.linearRampToValueAtTime(0.2, now + d + 0.005)
      og2.gain.exponentialRampToValueAtTime(0.001, now + d + 0.05)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1100
      osc2.connect(og2).connect(lp).connect(ctx.destination)
      osc2.start(now + d)
      osc2.stop(now + d + 0.05)
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext])

  /**
   * Arrow navigation - same octave pop, slightly softer
   */
  const playArrow = useCallback(() => {
    if (!isEnabledRef.current) return
    const now = performance.now()
    if (now - lastPlayRef.current < 80) return
    lastPlayRef.current = now

    try {
      const ctx = getAudioContext()
      if (!ctx || ctx.state === 'suspended') return

      const now = ctx.currentTime

      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(195, now)
      osc1.frequency.exponentialRampToValueAtTime(131, now + 0.04)
      const og1 = ctx.createGain()
      og1.gain.setValueAtTime(0, now)
      og1.gain.linearRampToValueAtTime(0.28, now + 0.005)
      og1.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
      osc1.connect(og1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.055)

      const d = 0.085
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 262
      const og2 = ctx.createGain()
      og2.gain.setValueAtTime(0, now + d)
      og2.gain.linearRampToValueAtTime(0.15, now + d + 0.005)
      og2.gain.exponentialRampToValueAtTime(0.001, now + d + 0.05)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1100
      osc2.connect(og2).connect(lp).connect(ctx.destination)
      osc2.start(now + d)
      osc2.stop(now + d + 0.05)
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext])

  /**
   * Link hover - disabled (no-op)
   */
  const playLinkHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Video card hover - disabled (no-op)
   */
  const playCardHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

  /**
   * Music player hover - disabled (no-op)
   */
  const playMusicHover = useCallback(() => {
    // No-op: hover sounds removed
  }, [])

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

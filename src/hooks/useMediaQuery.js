import { useState, useEffect } from 'react'

/**
 * Hook that tracks whether a CSS media query matches.
 * Returns true when the media query matches, false otherwise.
 *
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 480px)')
 *   const isTablet = useMediaQuery('(max-width: 813px)')
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)

    // Set initial value
    setMatches(mql.matches)

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }
    // Fallback for older browsers
    mql.addListener(handler)
    return () => mql.removeListener(handler)
  }, [query])

  return matches
}

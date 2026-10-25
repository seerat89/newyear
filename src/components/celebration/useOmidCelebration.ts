import { useEffect } from 'react'
import { usePrefersReducedMotion } from '../omid/usePrefersReducedMotion'
import { VOLLEYS } from './sustainedScript'

// Omid's celebration is a short score of the motion system's own behaviours,
// started through its `omid-behave` event, so his joy is the same smooth
// character animation as every other move (and his halo, light pool and the
// scene's reactions come with it). Times are seconds after midnight; moves
// already in the past are skipped, so a page opened late just joins in.
//
// Everywhere: a jump timed so he hangs in the star pose as the first major
// firework opens (about 1.6 s), and a second to follow it as the peak builds.
// On wide screens he then travels through the scene with the crescendo: across
// the sky, up and over, a long glide, a final jump at the climax, and home.
// Later, he jumps again as each volley of the long display begins.
type Move = [number, 'jump' | 'cross' | 'fly' | 'glide' | 'lookout']

const COMPACT: Move[] = [
  [0.55, 'jump'],
  [3.2, 'jump'],
]
const WIDE: Move[] = [
  [0.55, 'jump'],
  [3.1, 'cross'],
  [5.9, 'fly'],
  [8.6, 'glide'],
  [11.3, 'jump'],
  [14.6, 'lookout'],
]
const VOLLEY_JUMPS: Move[] = VOLLEYS.map((t) => [t + 0.4, 'jump'])

/** Makes Omid celebrate through the new year's first minutes. */
export function useOmidCelebration(startedAt: number | null) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (startedAt === null || reduced) return
    const wide = window.matchMedia('(orientation: landscape) and (min-width: 900px)').matches
    const timers = [...(wide ? WIDE : COMPACT), ...VOLLEY_JUMPS].flatMap(([t, name]) => {
      const wait = startedAt + t * 1000 - Date.now()
      if (wait <= 0) return []
      return [
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('omid-behave', { detail: name }))
        }, wait),
      ]
    })
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [startedAt, reduced])
}

import { useEffect, useState } from 'react'
import { SUSTAIN_END_MS } from '../../lib/celebration'
import { usePrefersReducedMotion } from '../omid/usePrefersReducedMotion'
import { createSustainedScore } from './sustainedScript'
import type { Burst } from './showScript'

// Plays the long display (sustainedScript.ts): each burst is added to the live
// list at its moment and removed once it has faded, so only a handful of
// fireworks are ever in the page. Times come from the clock, so a page opened
// late skips what has already happened, and a tab that was asleep skips the
// bursts it missed instead of firing them all at once.

export type LiveBurst = { id: number; burst: Burst }

const LIFETIME_MS = 12_000
const STALE_MS = 2_500

/** The bursts that are in the sky right now (none under reduced motion). */
export function useSustainedBursts(startedAt: number | null): LiveBurst[] {
  const reduced = usePrefersReducedMotion()
  const [live, setLive] = useState<LiveBurst[]>([])

  useEffect(() => {
    if (startedAt === null || reduced) return
    const next = createSustainedScore(new Date(startedAt).getFullYear())
    const timers = new Set<number>()
    let id = 0
    let stopped = false

    const due = (b: Burst) => startedAt + b.t * 1000
    let current = next()
    while (due(current) < Date.now() - STALE_MS) current = next()

    const schedule = () => {
      if (stopped || due(current) - startedAt > SUSTAIN_END_MS) return
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        if (stopped) return
        if (Date.now() - due(current) < STALE_MS) {
          const mine = ++id
          const entry = { id: mine, burst: current }
          setLive((list) => [...list, entry])
          const gone = window.setTimeout(() => {
            timers.delete(gone)
            setLive((list) => list.filter((e) => e.id !== mine))
          }, LIFETIME_MS)
          timers.add(gone)
        }
        current = next()
        schedule()
      }, Math.max(0, due(current) - Date.now()))
      timers.add(timer)
    }
    schedule()

    return () => {
      stopped = true
      timers.forEach((t) => window.clearTimeout(t))
      setLive([])
    }
  }, [startedAt, reduced])

  return live
}

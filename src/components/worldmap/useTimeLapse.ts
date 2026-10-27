import { useEffect, useState } from 'react'

/** The time-lapse covers the whole wave in this long, redrawn this often. */
const LAPSE_MS = 26_000
const TICK_MS = 80

/**
 * The map's clock: live, or (a development aid) the whole night played as a time-lapse
 * between `start` and `end`. Leaving the map puts it back to live.
 */
export function useTimeLapse(active: boolean, liveNow: number, start: number, end: number) {
  // null while live, otherwise how far through the night it is (0..1).
  const [lapse, setLapse] = useState<number | null>(null)
  const playing = lapse !== null
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setLapse((p) => (p === null || p + TICK_MS / LAPSE_MS >= 1 ? null : p + TICK_MS / LAPSE_MS))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [playing])
  if (!active && lapse !== null) setLapse(null)
  const now = lapse === null ? liveNow : start + lapse * (end - start)
  return { now, playing, toggle: () => setLapse(playing ? null : 0) }
}

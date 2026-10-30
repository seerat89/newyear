import { useEffect, useState } from 'react'

/**
 * Current time in epoch ms, re-read from the clock on every tick. Ticks fall on whole
 * multiples of the interval of the clock itself (not "every 250 ms from whenever the page
 * opened"), so a whole second, and midnight, is seen at most a few ms after it happens.
 */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let id: number
    const update = () => setNow(Date.now())
    const tick = () => {
      update()
      id = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 1)
    }
    id = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 1)
    document.addEventListener('visibilitychange', update)

    return () => {
      window.clearTimeout(id)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])

  return now
}

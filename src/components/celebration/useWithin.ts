import { useEffect, useState } from 'react'

/**
 * True until `ms` after `startedAt`, then false for good. Lets the pieces that
 * only matter in the opening minute drop out of the page once their animations
 * are over, instead of staying mounted for the whole long display.
 */
export function useWithin(startedAt: number, ms: number): boolean {
  const [within, setWithin] = useState(() => Date.now() - startedAt < ms)

  useEffect(() => {
    const left = startedAt + ms - Date.now()
    if (left <= 0) return
    const id = window.setTimeout(() => setWithin(false), left)
    return () => window.clearTimeout(id)
  }, [startedAt, ms])

  return within
}

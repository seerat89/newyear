import { useLayoutEffect, useRef, useState } from 'react'

/**
 * The clock for a piece of the show that is put in the page around midnight: how long
 * ago midnight was (negative before it), read once at mount, with the matching
 * high-resolution time, and a ref for the element holding its animations.
 *
 * Every animation start is offset by `since`, which is right at the moment it was read.
 * Mounting dozens of bursts takes a while, though, and CSS animations only begin once
 * the page has drawn, so on their own they would run that late. Re-basing them all to the
 * moment `since` was read puts the whole show back on the clock.
 */
export function useOnTheDot(startedAt: number) {
  const [clock] = useState(() => ({ since: (Date.now() - startedAt) / 1000, at: performance.now() }))
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    root.current?.getAnimations({ subtree: true }).forEach((animation) => {
      animation.startTime = clock.at
    })
  }, [clock])
  return { since: clock.since, root }
}

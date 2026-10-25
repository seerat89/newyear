// Pure helpers for the midnight celebration sequence. Like the rest of lib/,
// they take `now` as a parameter and never read the clock themselves.

import type { CountdownState } from './countdown'

/** The grand opening show, with its crescendo and climax. */
export const SHOW_MS = 32_000
/** Then a long, gentler display of fireworks that thins out as the night goes on. */
export const SUSTAIN_END_MS = 17 * 60_000
/** And a final minute in which everything eases back to the ordinary January 1. */
export const SETTLE_MS = 60_000

export type CelebrationStage = 'show' | 'sustain' | 'settle'

export type Celebration = {
  stage: CelebrationStage
  /** Epoch ms of local January 1 00:00, when the sequence started. */
  startedAt: number
}

/**
 * Where the midnight sequence is: the grand show for the first seconds of
 * January 1, about seventeen minutes of sustained fireworks, a final calm
 * minute, then null (the ordinary January 1 state). It is derived from time
 * alone, so a page opened late joins in wherever the night has got to.
 */
export function getCelebration(state: CountdownState, now: number): Celebration | null {
  if (state.phase !== 'celebrating') return null
  const elapsed = now - state.startedAt
  if (elapsed < 0 || elapsed >= SUSTAIN_END_MS + SETTLE_MS) return null
  const stage = elapsed < SHOW_MS ? 'show' : elapsed < SUSTAIN_END_MS ? 'sustain' : 'settle'
  return { stage, startedAt: state.startedAt }
}

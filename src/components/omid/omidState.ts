// Pure helpers for Omid's mood. They take plain numbers (days left) so they stay
// independent of the countdown engine and easy to test.

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

// Days left at (or beyond) which Omid is at his dimmest.
const FAR_DAYS = 270

/** Warm inner light, 0.2 (far away) to 1 (midnight). Steps in 0.05, so it changes rarely. */
export function glowForDaysLeft(days: number): number {
  const closeness = 1 - clamp(days / FAR_DAYS, 0, 1)
  const glow = 0.2 + 0.8 * Math.pow(closeness, 1.5)
  return Math.round(glow * 20) / 20
}

/**
 * Omid's glow through the afterglow (January 2-7): full celebration brightness at its start,
 * easing down to what the ordinary countdown gives for `endDays` days left at its end, so
 * there is no jump when the normal countdown resumes. `progress` is 0 to 1.
 */
export function glowForAfterglow(progress: number, endDays: number): number {
  const t = clamp(progress, 0, 1)
  const eased = t * t * (3 - 2 * t)
  return Math.round((1 + (glowForDaysLeft(endDays) - 1) * eased) * 20) / 20
}

/** How lively the idle motion is, 0.45 (calm) to 1. Kept simple on purpose. */
export function energyForGlow(glow: number): number {
  return 0.45 + 0.55 * clamp(glow, 0, 1)
}

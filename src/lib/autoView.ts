import { getNewYearStart } from './countdown'

/** The countdown takes over this long before the viewer's local midnight... */
const LEAD_MS = 5 * 60_000
/** ...and gives the screen back to the world map this long after it. */
const TAIL_MS = 20 * 60_000

/**
 * The viewer's local New Year (the local midnight, epoch ms) when `now` is inside
 * the window around it, otherwise null. The midnight doubles as the window's id.
 */
export function getNewYearWindow(now: number, tz?: string): number | null {
  const year = new Date(now).getUTCFullYear()
  // This year's and next year's midnight cover every zone, whichever side of UTC it is on.
  for (const midnight of [getNewYearStart(year, tz), getNewYearStart(year + 1, tz)]) {
    if (now >= midnight - LEAD_MS && now < midnight + TAIL_MS) return midnight
  }
  return null
}

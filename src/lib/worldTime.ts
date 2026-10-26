// Pure time zone logic for the world map: when each place reaches New Year, and
// where it stands right now. Zones are IANA names ("America/New_York") resolved
// by the browser's own Intl, so daylight saving, half-hour and 45-minute offsets
// and zones that changed their rules are all handled by the platform's time zone
// database, not by hand. Like the rest of lib/, every function takes `now`.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** A place is "celebrating" for this long after its local midnight. */
export const CELEBRATING_MS = HOUR

export type ZoneStatus = 'waiting' | 'celebrating' | 'arrived'

const formatters = new Map<string, Intl.DateTimeFormat>()
function wallClock(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    formatters.set(tz, f)
  }
  return f
}

/** Offset of a zone from UTC at an instant, in ms (positive east of Greenwich). */
export function utcOffsetMs(tz: string, at: number): number {
  const p: Record<string, number> = {}
  for (const part of wallClock(tz).formatToParts(at)) {
    if (part.type !== 'literal') p[part.type] = Number(part.value)
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(at / 1000) * 1000
}

const newYears = new Map<string, number>()

/**
 * The instant a zone's wall clock reads January 1 00:00 of `year`. The offset is
 * looked up at the guessed instant and once more at the result, so a zone whose
 * offset changes near that moment still lands on the right instant.
 */
export function newYearInstant(tz: string, year: number): number {
  const key = `${tz}|${year}`
  const cached = newYears.get(key)
  if (cached !== undefined) return cached
  const wall = Date.UTC(year, 0, 1)
  let at = wall - utcOffsetMs(tz, wall)
  const corrected = wall - utcOffsetMs(tz, at)
  if (corrected !== at) at = corrected
  newYears.set(key, at)
  return at
}

/**
 * The year the world is welcoming. The wave runs from UTC+14 (first) to UTC-12
 * (last), so it spans Dec 31 10:00 UTC to Jan 1 12:00 UTC. The map keeps showing
 * that year for a day after the last place has arrived, then turns to the next.
 */
export function getWorldYear(now: number): number {
  const year = new Date(now).getUTCFullYear()
  return now < Date.UTC(year, 0, 1, 12) + DAY ? year : year + 1
}

/** Where a place stands, given the instant its new year begins. */
export function getZoneStatus(newYearAt: number, now: number): ZoneStatus {
  if (now < newYearAt) return 'waiting'
  return now - newYearAt < CELEBRATING_MS ? 'celebrating' : 'arrived'
}

/** "UTC+5:30" for an offset in ms. */
export function formatOffset(offsetMs: number): string {
  const total = Math.round(offsetMs / MINUTE)
  const sign = total < 0 ? '-' : '+'
  const hours = Math.floor(Math.abs(total) / 60)
  const minutes = Math.abs(total) % 60
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

/** A short span for a countdown or an elapsed time: "3h 12m", "12m 04s", "2d 3h". */
export function formatSpan(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/** The local date and time in a zone, in the viewer's own language and style. */
export function formatLocalTime(tz: string, at: number): { day: string; time: string } {
  const day = new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'long', month: 'short', day: 'numeric' })
  const time = new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit' })
  return { day: day.format(at), time: time.format(at) }
}

// Pure countdown/date logic. No React, DOM or implicit clock access:
// every function takes `now` (epoch ms) so it can be unit tested later.
// "Local" means the time zone given as `tz` (an IANA name, the viewer's chosen city)
// or, when none is given, the runtime's (the browser's) current time zone.
import { newYearInstant } from './worldTime'

export type TimeRemaining = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

export type CountdownState =
  | {
      phase: 'counting'
      /** The year being counted down to (the year of `target`), not the current year. */
      year: number
      /** Epoch ms of the upcoming local January 1 00:00. */
      target: number
      remaining: TimeRemaining
    }
  | {
      phase: 'celebrating'
      /** The year that began at the local January 1 00:00 being celebrated. */
      year: number
      /** Epoch ms when the celebration began (local January 1 00:00). */
      startedAt: number
      /** Epoch ms when it ends (local January 2 00:00). */
      endsAt: number
    }
  | {
      phase: 'afterglow'
      /** The year that has begun. */
      year: number
      /** Epoch ms when the afterglow began (local January 2 00:00). */
      startedAt: number
      /** Epoch ms when it ends (local January 8 00:00). */
      endsAt: number
      /** Secondary info: the following local January 1 00:00 and time left. */
      nextTarget: number
      nextRemaining: TimeRemaining
    }

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400

const DAY_MS = 24 * 60 * 60 * 1000

/** Epoch ms of local January 1 00:00 of the given year. */
export function getNewYearStart(year: number, tz?: string): number {
  return tz ? newYearInstant(tz, year) : new Date(year, 0, 1).getTime()
}

/** Epoch ms of local 00:00 on the given day of January. */
function januaryDay(year: number, day: number, tz?: string): number {
  return tz ? newYearInstant(tz, year) + (day - 1) * DAY_MS : new Date(year, 0, day).getTime()
}

const calendars = new Map<string, Intl.DateTimeFormat>()

/** The local calendar date (year, month 0-11, day) at `now`. */
function calendarDate(now: number, tz?: string): { year: number; month: number; day: number } {
  if (!tz) {
    const d = new Date(now)
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
  }
  let f = calendars.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' })
    calendars.set(tz, f)
  }
  const p: Record<string, number> = {}
  for (const part of f.formatToParts(now)) if (part.type !== 'literal') p[part.type] = Number(part.value)
  return { year: p.year, month: p.month - 1, day: p.day }
}

/** Last local day of January that still belongs to the afterglow phase. */
const AFTERGLOW_LAST_DAY = 7

/** True when `now` falls on local January 1. */
export function isNewYearDay(now: number, tz?: string): boolean {
  const { month, day } = calendarDate(now, tz)
  return month === 0 && day === 1
}

/** True when `now` falls on local January 2 through January 7. */
export function isAfterglow(now: number, tz?: string): boolean {
  const { month, day } = calendarDate(now, tz)
  return month === 0 && day > 1 && day <= AFTERGLOW_LAST_DAY
}

/**
 * Splits the millisecond difference into display units. Remaining time is
 * rounded up to whole seconds so "00" is never shown while time is left;
 * completion is decided on the actual millisecond difference.
 */
export function getTimeRemaining(target: number, now: number): TimeRemaining {
  const totalMs = Math.max(0, target - now)
  const totalSeconds = Math.ceil(totalMs / MS_PER_SECOND)

  return {
    totalMs,
    days: Math.floor(totalSeconds / SECONDS_PER_DAY),
    hours: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
    isComplete: totalMs === 0,
  }
}

/**
 * Derives the whole countdown state from the current time alone.
 * - Local January 1: celebrating.
 * - Local January 2 through 7: afterglow.
 * - Otherwise (January 8 onwards): counting to the next January 1.
 */
export function getCountdownState(now: number, tz?: string): CountdownState {
  const { year } = calendarDate(now, tz)

  if (isNewYearDay(now, tz)) {
    return {
      phase: 'celebrating',
      year,
      startedAt: getNewYearStart(year, tz),
      endsAt: januaryDay(year, 2, tz),
    }
  }

  const target = getNewYearStart(year + 1, tz)

  if (isAfterglow(now, tz)) {
    return {
      phase: 'afterglow',
      year,
      startedAt: januaryDay(year, 2, tz),
      endsAt: januaryDay(year, AFTERGLOW_LAST_DAY + 1, tz),
      nextTarget: target,
      nextRemaining: getTimeRemaining(target, now),
    }
  }

  return {
    phase: 'counting',
    year: year + 1,
    target,
    remaining: getTimeRemaining(target, now),
  }
}

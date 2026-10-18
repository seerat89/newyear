// Pure countdown/date logic. No React, DOM or implicit clock access:
// every function takes `now` (epoch ms) so it can be unit tested later.
// "Local" always means the runtime's current timezone.

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

/** Epoch ms of local January 1 00:00 of the given year. */
export function getNewYearStart(year: number): number {
  return new Date(year, 0, 1).getTime()
}

/** Last local day of January that still belongs to the afterglow phase. */
const AFTERGLOW_LAST_DAY = 7

/** True when `now` falls on local January 1. */
export function isNewYearDay(now: number): boolean {
  const date = new Date(now)
  return date.getMonth() === 0 && date.getDate() === 1
}

/** True when `now` falls on local January 2 through January 7. */
export function isAfterglow(now: number): boolean {
  const date = new Date(now)
  return (
    date.getMonth() === 0 &&
    date.getDate() > 1 &&
    date.getDate() <= AFTERGLOW_LAST_DAY
  )
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
export function getCountdownState(now: number): CountdownState {
  const year = new Date(now).getFullYear()

  if (isNewYearDay(now)) {
    return {
      phase: 'celebrating',
      year,
      startedAt: getNewYearStart(year),
      endsAt: new Date(year, 0, 2).getTime(),
    }
  }

  const target = getNewYearStart(year + 1)

  if (isAfterglow(now)) {
    return {
      phase: 'afterglow',
      year,
      startedAt: new Date(year, 0, 2).getTime(),
      endsAt: new Date(year, 0, AFTERGLOW_LAST_DAY + 1).getTime(),
      nextTarget: target,
      nextRemaining: getTimeRemaining(target, now),
    }
  }

  return { phase: 'counting', target, remaining: getTimeRemaining(target, now) }
}

import { calendarDate } from './countdown'

export type Season = 'christmas'

/**
 * The seasonal mode for the viewer's local date (their chosen city's zone, or the
 * device's): Christmas from December 24 through 26, otherwise none (normal New Year
 * mode, which returns on December 27).
 */
export function getSeason(now: number, tz?: string): Season | null {
  const { month, day } = calendarDate(now, tz)
  return month === 11 && day >= 24 && day <= 26 ? 'christmas' : null
}

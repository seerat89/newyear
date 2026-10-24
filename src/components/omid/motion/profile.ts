import { smootherstep } from './math'

// Speed profiles for a trip: how far along its path the carrot is at a given
// fraction of the trip's time. The speed ramps up smoothly, holds, and ramps
// down smoothly, so a trip never starts or stops abruptly. `up` and `down` are
// the fractions of the trip spent speeding up and slowing down: a small `up`
// and a big `down` is the reference's float (a quick pick-up and a long, easing
// glide to a stop), 0.5 and 0.5 is a single symmetric bell, and two small ones
// leave a long steady cruise (a glide).

const SAMPLES = 128
const cache = new Map<string, { cumulative: Float64Array; total: number }>()

function table(up: number, down: number) {
  const key = `${Math.round(up * 100)}-${Math.round(down * 100)}`
  const hit = cache.get(key)
  if (hit) return hit
  const accelUp = Math.round(up * 100) / 100
  const accelDown = Math.round(down * 100) / 100
  const cumulative = new Float64Array(SAMPLES + 1)
  for (let i = 1; i <= SAMPLES; i++) {
    const u = (i - 0.5) / SAMPLES
    const speed = smootherstep(0, accelUp, u) * smootherstep(0, accelDown, 1 - u)
    cumulative[i] = cumulative[i - 1] + speed / SAMPLES
  }
  const entry = { cumulative, total: cumulative[SAMPLES] }
  cache.set(key, entry)
  return entry
}

/** Fraction (0..1) of the path covered at time fraction `u` (0..1). */
export function profile(u: number, up: number, down: number): number {
  const { cumulative, total } = table(up, down)
  const x = Math.min(1, Math.max(0, u)) * SAMPLES
  const i = Math.min(SAMPLES - 1, Math.floor(x))
  const f = x - i
  return (cumulative[i] + (cumulative[i + 1] - cumulative[i]) * f) / total
}

/** Average speed as a fraction of the peak speed, to turn a distance into a duration. */
export function averageSpeedFactor(up: number, down: number): number {
  return table(up, down).total
}

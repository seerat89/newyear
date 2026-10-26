import { MAP_WIDTH, project } from './geometry'
import { PLACES } from './places'

// The New Year frontier: the moving point on the map where midnight is arriving.
// The places are grouped by the instant they begin the year (all places on the
// same offset share one). The frontier waits at the first group before the wave
// starts, glides from each group to the next in step with the clock, and comes to
// rest at the last. Because it follows the clock it can be played faster for the
// time-lapse, and Omid simply rides it.

export type Frontier = {
  /** Map units. */
  x: number
  y: number
  /** The places that most recently rang in the year (or the first to, before it starts). */
  places: number[]
  /** `before` the wave starts, `during` it, or `after` the last place has arrived. */
  phase: 'before' | 'during' | 'after'
}

type Wave = { at: number; places: number[]; x: number; y: number }

/** The waves of a year, in the order midnight reaches them, with the centre of each. */
export function getWaves(instants: number[]): Wave[] {
  const byInstant = new Map<number, number[]>()
  instants.forEach((at, i) => byInstant.set(at, [...(byInstant.get(at) ?? []), i]))
  return [...byInstant.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([at, places]) => {
      // Average the longitudes as angles, so a wave that straddles the date line stays put.
      let sin = 0
      let cos = 0
      let lat = 0
      for (const i of places) {
        const lon = (PLACES[i].lon * Math.PI) / 180
        sin += Math.sin(lon)
        cos += Math.cos(lon)
        lat += PLACES[i].lat
      }
      const [x, y] = project((Math.atan2(sin, cos) * 180) / Math.PI, lat / places.length)
      return { at, places, x, y }
    })
}

export function getFrontier(waves: Wave[], now: number): Frontier {
  const first = waves[0]
  const last = waves[waves.length - 1]
  if (now < first.at) return { x: first.x, y: first.y, places: first.places, phase: 'before' }
  if (now >= last.at) return { x: last.x, y: last.y, places: last.places, phase: 'after' }

  let k = 0
  while (waves[k + 1].at <= now) k++
  const from = waves[k]
  const to = waves[k + 1]
  const p = (now - from.at) / (to.at - from.at)
  // Take the short way round the globe.
  let dx = to.x - from.x
  if (dx > MAP_WIDTH / 2) dx -= MAP_WIDTH
  if (dx < -MAP_WIDTH / 2) dx += MAP_WIDTH
  return {
    x: (from.x + dx * p + MAP_WIDTH) % MAP_WIDTH,
    y: from.y + (to.y - from.y) * p,
    places: from.places,
    phase: 'during',
  }
}

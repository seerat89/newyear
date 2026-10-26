import { LAND_ROWS, MASK_LEFT, MASK_STEP, MASK_TOP } from './landMask'
import { PLACES } from './places'

// The map is a plain equirectangular halftone: one unit of the viewBox is one
// degree, longitude -180..180 across and latitude 80..-58 down. Every land dot
// belongs to the nearest place, so each place lights the land around it with its
// own status. (A real time zone border is political; this is the visual
// approximation of one, while the times themselves come from the zone database.)

export const MAP_WIDTH = 360
export const MAP_HEIGHT = 138
const TOP_LAT = 80

export const project = (lon: number, lat: number): [number, number] => [lon + 180, TOP_LAT - lat]

/** Unit vector for a point on the globe, so "nearest" respects the date line and the poles. */
function unit(lon: number, lat: number): [number, number, number] {
  const a = (lat * Math.PI) / 180
  const b = (lon * Math.PI) / 180
  return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]
}

const anchors = PLACES.map((place) => unit(place.lon, place.lat))

function nearestPlace(lon: number, lat: number): number {
  const [x, y, z] = unit(lon, lat)
  let best = 0
  let bestDot = -2
  for (let i = 0; i < anchors.length; i++) {
    const dot = x * anchors[i][0] + y * anchors[i][1] + z * anchors[i][2]
    if (dot > bestDot) {
      bestDot = dot
      best = i
    }
  }
  return best
}

/** For each place, the dots of the land around it as one SVG path of zero-length round-capped strokes. */
export const DOT_PATHS: string[] = (() => {
  const paths = PLACES.map(() => '')
  LAND_ROWS.forEach((row, r) => {
    const lat = MASK_TOP - r * MASK_STEP
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue
      const lon = MASK_LEFT + c * MASK_STEP
      const [x, y] = project(lon, lat)
      paths[nearestPlace(lon, lat)] += `M${x} ${y}h0`
    }
  })
  return paths
})()

/** Positions of the places in map units. */
export const MARKERS: [number, number][] = PLACES.map((place) => project(place.lon, place.lat))

/** The graticule: a faint line every 15° of longitude (one hour of sun) and the equator and tropics. */
export const GRATICULE = (() => {
  let d = ''
  for (let lon = -180; lon <= 180; lon += 15) d += `M${lon + 180} 0V${MAP_HEIGHT}`
  for (const lat of [23.4, 0, -23.4]) {
    const [, y] = project(0, lat)
    d += `M0 ${y}H${MAP_WIDTH}`
  }
  return d
})()

/** The index of the place nearest to a point on the map (in map units), if one is close enough. */
export function placeAt(x: number, y: number, within = 7): number | null {
  let best: number | null = null
  let bestDistance = within
  MARKERS.forEach(([mx, my], i) => {
    const dx = Math.min(Math.abs(mx - x), MAP_WIDTH - Math.abs(mx - x))
    const distance = Math.hypot(dx, my - y)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  })
  return best
}

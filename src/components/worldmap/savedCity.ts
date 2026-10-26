import { CITIES } from './places'

// The viewer's chosen city is remembered in this browser only (localStorage), as a
// city name, never as coordinates. Everything is wrapped in try/catch because
// storage can be blocked or unavailable.

const KEY = 'newyear.city'

const keyOf = (i: number) => `${CITIES[i].name}|${CITIES[i].country}`

export function loadCity(): number | null {
  try {
    const saved = window.localStorage.getItem(KEY)
    const i = CITIES.findIndex((_, n) => keyOf(n) === saved)
    return i >= 0 ? i : null
  } catch {
    return null
  }
}

export function saveCity(i: number | null) {
  try {
    if (i === null) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, keyOf(i))
  } catch {
    // Not remembered; the app still works.
  }
}

/** The listed city nearest to a position (great-circle distance). The position is not kept. */
export function nearestCity(lat: number, lon: number): number {
  const rad = Math.PI / 180
  let best = 0
  let bestDistance = Infinity
  CITIES.forEach((city, i) => {
    const a =
      Math.sin(((city.lat - lat) * rad) / 2) ** 2 +
      Math.cos(lat * rad) * Math.cos(city.lat * rad) * Math.sin(((city.lon - lon) * rad) / 2) ** 2
    if (a < bestDistance) {
      bestDistance = a
      best = i
    }
  })
  return best
}

import { createRandom } from '../scene/ridge'
import type { Burst, Hue, Style } from './showScript'

// The long display that follows the opening show: a steady stream of bursts that
// thins out as the night goes on, with a short "volley" of mirrored pairs and a
// closing willow every few minutes so it keeps building and releasing like a real
// display. It is generated, not stored, from a seeded random sequence, so every
// screen showing the same new year sees the same display. Times are seconds after
// midnight and increase with every burst.

/** The stream begins just as the opening show ends. */
const START = 34
/** Seconds after midnight at which a volley begins. */
export const VOLLEYS = [150, 330, 600, 900]

/** The midnight recording (lib/midnightAudio.ts) ends about this long after midnight. */
const AUDIO_END = 204

/**
 * Seconds between bursts: liveliest early, clearly calmer by the time the recording
 * ends, then slower and slower as the night goes on.
 */
function gapAt(t: number): number {
  if (t < AUDIO_END) return 2.4 + (2.4 * (t - START)) / (AUDIO_END - START)
  if (t < 600) return 4.8 + (3.2 * (t - AUDIO_END)) / (600 - AUDIO_END)
  return 8 + (7 * Math.min(t - 600, 420)) / 420
}

const STYLES: [Style, number][] = [
  ['ring', 0.22], ['peony', 0.2], ['willow', 0.16], ['double', 0.12], ['glitter', 0.18], ['palm', 0.06], ['comet', 0.06],
]
const HUES: [Hue, number][] = [['gold', 0.5], ['white', 0.22], ['red', 0.1], ['blue', 0.18]]

function pick<T>(table: [T, number][], r: number): T {
  let acc = 0
  for (const [value, weight] of table) {
    acc += weight
    if (r < acc) return value
  }
  return table[0][0]
}

/**
 * A function that returns the next burst of the long display each time it is
 * called, in time order. Seed it with something that identifies the year.
 */
export function createSustainedScore(seed: number): () => Burst {
  const random = createRandom(seed * 7919 + 13)
  const queue: Burst[] = []
  let t = START
  let volley = 0

  return () => {
    const queued = queue.shift()
    if (queued) return queued

    if (volley < VOLLEYS.length && t >= VOLLEYS[volley]) {
      // A volley: mirrored pairs closing in from the edges, then a willow.
      const t0 = Math.max(VOLLEYS[volley++], t)
      for (let i = 0; i < 6; i++) {
        const d = 44 - 7 * i
        const style: Style = i % 3 === 0 ? 'ring' : i % 3 === 1 ? 'peony' : 'double'
        const hue: Hue = i % 2 ? 'white' : 'gold'
        for (const x of [50 - d, 50 + d]) {
          queue.push({ t: t0 + 0.9 * i, x, y: 0.5 + 0.1 * (i % 3), size: 1, hue, style, wide: i % 2 === 1, tv: false })
        }
      }
      queue.push({ t: t0 + 7, x: 50, y: 0.55, size: 1.7, hue: 'gold', style: 'willow', wide: false, tv: false })
      t = t0 + 9
      return queue.shift()!
    }

    t += gapAt(t) * (0.65 + 0.7 * random())
    const decay = 1 - 0.2 * Math.min(1, (t - START) / (AUDIO_END - START)) - 0.15 * Math.min(1, Math.max(0, t - AUDIO_END) / 700)
    const y = 0.38 + 0.42 * random()
    let x = 6 + 88 * random()
    // Keep the middle of the upper sky, where the message is, mostly clear.
    if (y < 0.5 && Math.abs(x - 50) < 22) x = random() < 0.5 ? 8 + 18 * random() : 74 + 18 * random()
    return {
      t,
      x,
      y,
      size: (0.55 + 0.75 * random() ** 1.3) * decay,
      hue: pick(HUES, random()),
      style: pick(STYLES, random()),
      wide: random() < 0.5,
      tv: false,
    }
  }
}

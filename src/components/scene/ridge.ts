// Small pure helpers for the scene art: the height of a ridge at x, and a seeded
// random generator (also used for the stars and the sustained fireworks), so the
// art is identical on every render.

export type Pt = [number, number]

/** Height of a ridge at x (straight interpolation between its points). */
export function ridgeY(points: Pt[], x: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return points[points.length - 1][1]
}

/** Small seeded generator so the art is identical on every render. */
export function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

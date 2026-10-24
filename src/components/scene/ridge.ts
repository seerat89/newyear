// Small pure helpers for drawing the hills. Everything here is plain numbers in,
// SVG path strings out, so the scene art stays data, not hand-written paths.

export type Pt = [number, number]

/** Smooth open path through the points (Catmull-Rom converted to cubic Beziers). */
export function smoothPath(points: Pt[]): string {
  return `M${points[0][0]},${points[0][1]} ${curveTo(points)}`
}

/** Just the curve commands of a smooth path, to continue an existing path. */
export function curveTo(points: Pt[]): string {
  const d: string[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`)
  }
  return d.join(' ')
}

/** A road as a filled shape: a centre line with a half-width at each point. */
export function roadPath(points: [number, number, number][]): string {
  const left: Pt[] = points.map(([x, y, hw]) => [x - hw, y])
  const right: Pt[] = points.map(([x, y, hw]) => [x + hw, y]).reverse() as Pt[]
  return `${smoothPath(left)} L${right[0][0]},${right[0][1]} ${curveTo(right)} Z`
}

/** The same ridge closed down to the bottom edge, for filling. */
export function filledPath(points: Pt[], bottom: number): string {
  const first = points[0]
  const last = points[points.length - 1]
  return `${smoothPath(points)} L${last[0]},${bottom} L${first[0]},${bottom} Z`
}

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

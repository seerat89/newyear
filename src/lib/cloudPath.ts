// Geometry for Omid's speech balloon: a minimal cloud, an oval ring of round bumps with an odd
// number on each half (5 on top, 5 below on a short cloud, 7 and 7 on a long one), a single big
// bump at the top and at the bottom, plus a small tail at the lower right pointing down
// toward him. The ring is centred on the text. Pure geometry, sized to the text.

const f = (n: number) => +n.toFixed(1)

export type Cloud = { body: string; tail: string }

/** Height of the bubble's lower strip that the tail occupies (the text is centred above it). */
export const TAIL_ZONE = 14

/** The cloud for a box `w` x `h` (the lower TAIL_ZONE is left for the tail). */
export function cloud(w: number, h: number): Cloud {
  const bodyH = h - TAIL_ZONE
  const cx = w / 2
  const cy = bodyH / 2
  const rx = w / 2 - 8
  const ry = bodyH / 2 - 6
  // Bump count 4k + 2 puts a bump at the very top and the very bottom and a notch at each
  // side, so each half has an odd number (2k + 1).
  const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
  const k = Math.max(2, Math.round((perimeter / 44 - 2) / 4))
  const n = 4 * k + 2
  // Notches sit half a step either side of each bump centre, starting from the top bump.
  const at = (i: number): [number, number] => {
    const a = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / n
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
  }
  const [x0, y0] = at(0)
  let body = `M${f(x0)} ${f(y0)}`
  for (let i = 1; i <= n; i++) {
    const [x, y] = i === n ? [x0, y0] : at(i)
    const [px, py] = at(i - 1)
    const r = Math.hypot(x - px, y - py) * 0.6
    body += `A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y)}`
  }
  body += 'Z'
  const tip = [w - 2, h - 2]
  const [ax, ay] = [cx + rx * 0.8, cy + ry * 0.55]
  const [bx, by] = [cx + rx * 0.3, cy + ry * 0.9]
  return {
    body,
    tail: `M${f(ax)} ${f(ay)}C${f(ax + 6)} ${f(ay + 5)} ${f(tip[0] - 6)} ${f(tip[1] - 9)} ${f(tip[0])} ${f(tip[1])}C${f(tip[0] - 11)} ${f(tip[1] - 2)} ${f(bx + 6)} ${f(by + 2)} ${f(bx)} ${f(by)}Z`,
  }
}

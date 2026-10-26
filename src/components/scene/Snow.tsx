import { memo } from 'react'
import type { CSSProperties } from 'react'

// Christmas snow, in depth: a fine far layer of tiny flakes, a mid layer, a few large
// soft out-of-focus flakes up close, six-armed crystals that turn as they fall, and
// slow golden bokeh lights. Every flake is a CSS loop (transform only); the positions
// and timings come from a fixed sequence, so every render is the same. The whole
// thing is hidden under reduced motion (the static snowscape stays).

const rand = (i: number, n: number) => {
  const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const make = (count: number, salt: number, f: (r: (n: number) => number) => CSSProperties) =>
  Array.from({ length: count }, (_, i) => f((n) => rand(i + salt * 100, n)))

const flake = (r: (n: number) => number, size: [number, number], fall: [number, number], op: [number, number]) =>
  ({
    '--x': `${(r(1) * 104 - 2).toFixed(1)}%`,
    '--s': `${(size[0] + r(2) * (size[1] - size[0])).toFixed(1)}px`,
    '--o': (op[0] + r(3) * (op[1] - op[0])).toFixed(2),
    '--d': `${(fall[0] + r(4) * (fall[1] - fall[0])).toFixed(1)}s`,
    '--dl': `${(-r(5) * fall[1]).toFixed(1)}s`,
    '--dx': `${(r(6) * 120 - 60).toFixed(0)}px`,
    '--sw': `${(8 + r(7) * 26).toFixed(0)}px`,
    '--sd': `${(3 + r(8) * 4).toFixed(1)}s`,
    '--tilt': `${(r(9) * 360).toFixed(0)}deg`,
  }) as CSSProperties

const FAR = make(130, 1, (r) => flake(r, [2, 4], [20, 36], [0.35, 0.8]))
const MID = make(64, 2, (r) => flake(r, [4, 8], [13, 22], [0.5, 0.9]))
const NEAR = make(20, 3, (r) => flake(r, [14, 36], [8, 15], [0.25, 0.55]))
const CRYSTALS = make(30, 4, (r) => flake(r, [16, 36], [15, 26], [0.6, 1]))
const GLOWS = make(10, 5, (r) => ({
  '--x': `${(r(1) * 100).toFixed(1)}%`,
  '--y': `${(r(2) * 80).toFixed(1)}%`,
  '--s': `${(50 + r(3) * 90).toFixed(0)}px`,
  '--d': `${(9 + r(4) * 9).toFixed(1)}s`,
  '--dl': `${(-r(5) * 14).toFixed(1)}s`,
}) as CSSProperties)

function Snow() {
  return (
    <div className="snow" aria-hidden="true">
      {GLOWS.map((style, i) => (
        <span key={`g${i}`} className="snow-glow" style={style} />
      ))}
      {FAR.map((style, i) => (
        <span key={`f${i}`} className="fl fl-far" style={style}>
          <i />
        </span>
      ))}
      {MID.map((style, i) => (
        <span key={`m${i}`} className="fl fl-mid" style={style}>
          <i />
        </span>
      ))}
      {CRYSTALS.map((style, i) => (
        <span key={`c${i}`} className="fl fl-crystal" style={style}>
          <svg viewBox="-12 -12 24 24">
            <path
              d="M0 -11V11M-9.5 -5.5L9.5 5.5M-9.5 5.5L9.5 -5.5M-2.6 -8.6L0 -6L2.6 -8.6M-2.6 8.6L0 6L2.6 8.6M-8.7 -1.6L-6 -3.2L-6.6 -6.4M8.7 1.6L6 3.2L6.6 6.4M-8.7 1.6L-6 3.2L-6.6 6.4M8.7 -1.6L6 -3.2L6.6 -6.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ))}
      {NEAR.map((style, i) => (
        <span key={`n${i}`} className="fl fl-near" style={style}>
          <i />
        </span>
      ))}
    </div>
  )
}

export default memo(Snow)

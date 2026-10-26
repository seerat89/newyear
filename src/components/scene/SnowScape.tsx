import { memo } from 'react'

// The Christmas foreground: snow-laden pines with warm lights at either side, and
// soft drifts of snow along the bottom. Static art (no animation, so it also serves
// reduced motion); only the lights twinkle, in CSS.

// Small coloured bulbs strung along each tier, like a string of Christmas lights.
const BULBS = ['#ff5a5f', '#ffd166', '#5be08a', '#5ab4ff', '#ff8fd0', '#b48cff']

type Tier ={ y: number; w: number; h: number }

/** One pine: stacked tiers, each with a cap of snow and a few warm lights. */
function Pine({ x, base, w, h, seed }: { x: number; base: number; w: number; h: number; seed: number }) {
  const tiers: Tier[] = Array.from({ length: 4 }, (_, i) => {
    const t = i / 4
    return { y: base - h + h * t * 0.78, w: w * (0.42 + 0.58 * ((i + 1) / 4)), h: h * 0.4 }
  })
  return (
    <g>
      <rect x={x - w * 0.05} y={base - h * 0.1} width={w * 0.1} height={h * 0.12} fill="#0b1230" />
      {tiers.map((t, i) => (
        <g key={i}>
          <path d={`M${x} ${t.y} L${x + t.w / 2} ${t.y + t.h} L${x - t.w / 2} ${t.y + t.h}Z`} fill="#0f1a45" />
          <path
            d={`M${x} ${t.y} L${x + t.w / 2} ${t.y + t.h} L${x + t.w * 0.18} ${t.y + t.h * 0.82} Z`}
            fill="#1a2a63"
            opacity="0.7"
          />
          <path
            d={`M${x} ${t.y} L${x + t.w * 0.27} ${t.y + t.h * 0.5} Q${x + t.w * 0.1} ${t.y + t.h * 0.62} ${x} ${t.y + t.h * 0.5} Q${x - t.w * 0.12} ${t.y + t.h * 0.66} ${x - t.w * 0.27} ${t.y + t.h * 0.5}Z`}
            fill="#e8ebff"
          />
          {[0.25, 0.62, 0.9].map((k, j) => (
            <circle
              key={j}
              className="snowscape-light"
              style={{ animationDelay: `${-((seed + i * 3 + j) % 7) * 0.6}s` }}
              cx={x + (j === 1 ? 0.12 : j === 0 ? -0.22 : 0.2) * t.w * (0.5 + k * 0.4)}
              cy={t.y + t.h * (0.35 + k * 0.5)}
              r={w * 0.028}
              fill="#ffd27a"
            />
          ))}
          {(i === 0 ? [-0.3, 0, 0.3] : [-0.4, -0.2, 0, 0.2, 0.4]).map((f, j) => {
            const colour = BULBS[(seed + i * 2 + j) % BULBS.length]
            return (
              <circle
                key={`b${j}`}
                className="snowscape-bulb"
                style={{
                  color: colour,
                  animationDelay: `${-((seed * 3 + i * 5 + j * 7) % 11) * 0.37}s`,
                  animationDuration: `${1.6 + ((seed + j) % 4) * 0.45}s`,
                }}
                cx={x + f * t.w}
                cy={t.y + t.h * (0.93 - 0.1 * (1 - (f / 0.44) ** 2))}
                r={Math.max(2.6, w * 0.036)}
                fill="currentColor"
              />
            )
          })}
        </g>
      ))}
      <path d={`M${x - 5} ${base - h - 2} l5 -12 l5 12 l-10 0Z`} fill="#ffe29a" opacity="0.9" />
    </g>
  )
}

function Trees({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`snowscape-trees snowscape-trees--${side}`} viewBox="0 0 240 380" aria-hidden="true">
      <Pine x={150} base={376} w={118} h={330} seed={1} />
      <Pine x={64} base={376} w={86} h={236} seed={4} />
      <Pine x={206} base={376} w={64} h={168} seed={7} />
    </svg>
  )
}

function SnowScape() {
  return (
    <div className="snowscape" aria-hidden="true">
      <Trees side="left" />
      <Trees side="right" />
      <svg className="snowscape-drift" viewBox="0 0 1000 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="drift-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#aab2ee" />
            <stop offset="1" stopColor="#7d86d0" />
          </linearGradient>
          <linearGradient id="drift-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9ecff" />
            <stop offset="1" stopColor="#a9b1ec" />
          </linearGradient>
        </defs>
        <path
          d="M0 52 C120 22 230 46 360 34 C500 20 600 52 740 36 C860 24 940 40 1000 30 V120 H0Z"
          fill="url(#drift-back)"
          opacity="0.75"
        />
        <path
          d="M0 74 C140 48 250 78 390 62 C520 48 640 84 780 64 C890 50 950 66 1000 58 V120 H0Z"
          fill="url(#drift-front)"
        />
      </svg>
    </div>
  )
}

export default memo(SnowScape)

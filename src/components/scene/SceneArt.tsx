import { memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createRandom, ridgeY } from './ridge'
import type { SceneArt as Art } from './scenes'

// One composition of the midnight scene as static SVG, in four layers: `far`
// (celebration glow, haze and a pale distant city), `mid` (the lit city, its
// landmark tower and the bay with the city's reflections), `ground` (bokeh and
// glints on the water, still behind Omid) and `near` (the quay and a garland of
// festoon lights in front of him, for depth). Each layer is a separate element
// so the motion system can nudge them by different amounts (a little parallax)
// on the compositor. Colours come from the --theme-* tokens.

const Stop = ({ at, color, alpha = 1 }: { at: number; color: string; alpha?: number }) => (
  <stop offset={at} style={{ stopColor: color, stopOpacity: alpha }} />
)

// The city runs on past both edges, so a stage narrower than the screen (short
// screens) still has buildings all the way across.
const REACH = 520
// Water and haze are plain fills and can run much further.
const WIDE = 3000

function Defs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <radialGradient id={`${prefix}-glow`}>
        <Stop at={0} color="#ffd89a" alpha={0.7} />
        <Stop at={0.28} color="#f2a85e" alpha={0.4} />
        <Stop at={0.6} color="#6a4a90" alpha={0.16} />
        <Stop at={1} color="#3a2a7a" alpha={0} />
      </radialGradient>
      <radialGradient id={`${prefix}-cool`}>
        <Stop at={0} color="#8fb4ff" alpha={0.34} />
        <Stop at={1} color="#2b4a9a" alpha={0} />
      </radialGradient>
      <linearGradient id={`${prefix}-haze`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="#4a4fa8" alpha={0.5} />
        <Stop at={1} color="#8a5a9a" alpha={0.78} />
      </linearGradient>
      <linearGradient id={`${prefix}-city`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="var(--theme-city-top)" />
        <Stop at={1} color="var(--theme-city-base)" />
      </linearGradient>
      <linearGradient id={`${prefix}-water`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="var(--theme-water-top)" />
        <Stop at={0.35} color="var(--theme-water-mid)" />
        <Stop at={1} color="var(--theme-water-deep)" />
      </linearGradient>
      <linearGradient id={`${prefix}-mirror`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="#ffcd84" alpha={0.55} />
        <Stop at={1} color="#ffcd84" alpha={0} />
      </linearGradient>
      <linearGradient id={`${prefix}-mirror-cool`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="#9db8ff" alpha={0.35} />
        <Stop at={1} color="#9db8ff" alpha={0} />
      </linearGradient>
      <radialGradient id={`${prefix}-shine`}>
        <Stop at={0} color="#ffc878" alpha={0.5} />
        <Stop at={1} color="#f0a04b" alpha={0} />
      </radialGradient>
      <radialGradient id={`${prefix}-bokeh-gold`}>
        <Stop at={0} color="#ffe2a8" alpha={0.55} />
        <Stop at={0.7} color="#ffc66e" alpha={0.4} />
        <Stop at={0.9} color="#ffb85a" alpha={0.5} />
        <Stop at={1} color="#ffb85a" alpha={0} />
      </radialGradient>
      <radialGradient id={`${prefix}-bokeh-cool`}>
        <Stop at={0} color="#cfe0ff" alpha={0.4} />
        <Stop at={0.75} color="#9cb8ff" alpha={0.3} />
        <Stop at={0.92} color="#9cb8ff" alpha={0.4} />
        <Stop at={1} color="#9cb8ff" alpha={0} />
      </radialGradient>
      <radialGradient id={`${prefix}-bulb`}>
        <Stop at={0} color="#fff2cc" alpha={1} />
        <Stop at={0.22} color="#ffd98a" alpha={0.85} />
        <Stop at={1} color="#ffb85a" alpha={0} />
      </radialGradient>
      <linearGradient id={`${prefix}-fade`} x1="0" y1="0" x2="0" y2="1">
        <Stop at={0} color="var(--theme-water-deep)" alpha={0} />
        <Stop at={1} color="var(--theme-water-deep)" alpha={0.85} />
      </linearGradient>
    </defs>
  )
}

function Layer({ art, prefix, children }: { art: Art; prefix: string; children: ReactNode }) {
  return (
    <svg
      className="scene-art"
      data-art={art.id}
      viewBox={`0 0 ${art.width} ${art.height}`}
      preserveAspectRatio="xMidYMax slice"
      focusable="false"
    >
      <Defs prefix={prefix} />
      {children}
    </svg>
  )
}

type CityOptions = {
  seed: number
  /** Scales the crest envelope of the art (taller = nearer the viewer's eye line). */
  height: number
  /** Building width range multiplier. */
  wide: number
  /** Share of windows that are lit, as a [min, max] per building. */
  lit: [number, number]
  /** Draw a landmark tower at this fraction of the stage width. */
  tower?: number
}

// A city along the shore as a few single paths (silhouette, lit windows, pale
// windows, spires, aviation lights), so it costs a handful of elements, not
// hundreds. Buildings come in plain blocks, stepped tops and spired towers.
function city(art: Art, o: CityOptions) {
  const random = createRandom(o.seed)
  const u = art.unit
  const base = art.shore + 1
  let body = ''
  let gold = ''
  let gold2 = ''
  let pale = ''
  let spires = ''
  let beacons = ''
  const rect = (x: number, y: number, w: number, h: number) =>
    `M${x.toFixed(1)},${y.toFixed(1)} h${w.toFixed(1)} v${h.toFixed(1)} h${(-w).toFixed(1)} Z `
  for (let x = -REACH; x < art.width + REACH; ) {
    const w = (5 + 12 * random()) * u * o.wide
    const crest = ridgeY(art.skyline, Math.min(Math.max(x, -20), art.width + 20))
    const roll = random()
    const h = Math.max(5 * u, (base - crest) * o.height * (0.4 + 0.9 * random() ** 1.4))
    body += rect(x, base - h, w, h)
    let top = base - h
    if (roll < 0.3 && h > 14 * u) {
      // A stepped crown.
      const sw = w * 0.6
      const sh = h * (0.12 + 0.12 * random())
      body += rect(x + (w - sw) / 2, top - sh, sw, sh)
      top -= sh
    }
    if (roll > 0.88) {
      // A spired tower with a small red aviation light.
      const cx = x + w / 2
      const sl = (8 + 10 * random()) * u
      spires += `M${cx.toFixed(1)},${top.toFixed(1)} V${(top - sl).toFixed(1)} `
      beacons += `M${(cx - 0.9 * u).toFixed(1)},${(top - sl).toFixed(1)} h${(1.8 * u).toFixed(1)} v${(1.8 * u).toFixed(1)} h${(-1.8 * u).toFixed(1)} Z `
    }
    const litShare = o.lit[0] + (o.lit[1] - o.lit[0]) * random()
    const cols = Math.max(1, Math.floor(w / (3.3 * u)))
    const rows = Math.floor(h / (4 * u))
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const lit = random()
        if (lit > litShare) continue
        const wx = x + (1.1 + c * 3.3) * u
        const wy = base - h + (1.6 + r * 4) * u
        const d = rect(wx, wy, 1.4 * u, 1.9 * u)
        if (random() < 0.14) pale += d
        else if (random() < 0.5) gold += d
        else gold2 += d
      }
    }
    x += w + random() * 1.6 * u
  }
  if (o.tower !== undefined) {
    // The landmark: a slim shaft, an observation pod that glows, a spire.
    const cx = art.width * o.tower
    const h = (base - art.skyline[3][1]) * 1.5
    const sw = 3.4 * u
    body += rect(cx - sw / 2, base - h, sw, h)
    body += `M${(cx - 8 * u).toFixed(1)},${(base - h * 0.78).toFixed(1)} h${(16 * u).toFixed(1)} l${(-3 * u).toFixed(1)},${(7 * u).toFixed(1)} h${(-10 * u).toFixed(1)} Z `
    spires += `M${cx.toFixed(1)},${(base - h * 0.78).toFixed(1)} V${(base - h - 14 * u).toFixed(1)} `
    beacons += `M${(cx - 1 * u).toFixed(1)},${(base - h - 15 * u).toFixed(1)} h${(2 * u).toFixed(1)} v${(2 * u).toFixed(1)} h${(-2 * u).toFixed(1)} Z `
    gold += rect(cx - 6 * u, base - h * 0.78 + 2 * u, 12 * u, 1.6 * u)
  }
  return { body, gold, gold2, pale, spires, beacons }
}

// A cluster of out-of-focus lights: soft discs of varied size, drifting in
// brightness slowly (see .bokeh in index.css).
function bokeh(
  prefix: string,
  seed: number,
  box: { x: number; y: number; w: number; h: number },
  count: number,
  size: [number, number],
  cool: number,
) {
  const random = createRandom(seed)
  return Array.from({ length: count }, (_, i) => {
    const r = size[0] + (size[1] - size[0]) * random() ** 1.6
    const kind = random() < cool ? 'cool' : 'gold'
    return (
      <circle
        key={i}
        cx={box.x + box.w * random()}
        cy={box.y + box.h * random()}
        r={r}
        fill={`url(#${prefix}-bokeh-${kind})`}
        opacity={0.35 + 0.65 * random()}
      />
    )
  })
}

// Far layer: the celebration glow, a cool moonlit haze beside it and a pale,
// hazy city far away (it drifts the least).
function Far({ art }: { art: Art }) {
  const prefix = `${art.id}-far`
  const u = art.unit
  const far = city(art, { seed: art.width * 3 + 1, height: 1.25, wide: 1.5, lit: [0.04, 0.16] })
  const cool = { x: art.glow.x - art.glow.rx * 0.6, y: art.glow.y - art.glow.ry * 0.5 }
  const cool2 = { x: art.glow.x + art.glow.rx * 0.7, y: art.glow.y - art.glow.ry * 0.7 }
  return (
    <Layer art={art} prefix={prefix}>
      <ellipse cx={cool.x} cy={cool.y} rx={art.glow.rx * 0.55} ry={art.glow.ry * 1.1} fill={`url(#${prefix}-cool)`} />
      <ellipse cx={cool2.x} cy={cool2.y} rx={art.glow.rx * 0.4} ry={art.glow.ry * 0.9} fill={`url(#${prefix}-cool)`} opacity={0.6} />
      <ellipse className="glow-breathe" cx={art.glow.x} cy={art.glow.y} rx={art.glow.rx} ry={art.glow.ry} fill={`url(#${prefix}-glow)`} />
      <path d={far.body} fill={`url(#${prefix}-haze)`} />
      <path className="win-a" d={far.gold} fill="#ffe0a0" opacity={0.5} />
      <path className="win-b" d={far.gold2} fill="#ffe0a0" opacity={0.5} />
      <g className="bokeh" style={{ '--bokeh-dur': '9s' } as CSSProperties}>
        {bokeh(prefix, art.width * 13, { x: art.glow.x - art.glow.rx * 0.5, y: art.shore - 46 * u, w: art.glow.rx, h: 40 * u }, 22, [2.5 * u, 7 * u], 0.25)}
      </g>
    </Layer>
  )
}

// Mid layer: the lit city with its landmark, and the bay with the city's
// reflections in vertical shimmering columns. It stays put.
function Mid({ art }: { art: Art }) {
  const prefix = `${art.id}-mid`
  const { width, height, unit: u, shore } = art
  const random = createRandom(width * 5 + height)
  const near = city(art, { seed: width * 7 + 3, height: 0.7, wide: 1, lit: [0.12, 0.5], tower: 0.8 })
  const columns = Array.from({ length: 70 }, () => {
    const spread = art.glow.rx * 0.9
    const x = art.glow.x + (random() - 0.5) * 2 * spread * random() ** 0.7
    return {
      x,
      w: (0.9 + 2.6 * random()) * u,
      h: (22 + 70 * random()) * u,
      cool: random() < 0.22,
      a: 0.3 + 0.7 * random(),
    }
  })
  const ripples = Array.from({ length: 34 }, (_, i) => {
    const t = (i + random()) / 34
    return {
      x: art.glow.x + (random() - 0.5) * art.glow.rx * 2.2,
      y: shore + (4 + t * 96) * u,
      w: (30 + 120 * random()) * u * (0.5 + t),
    }
  })
  return (
    <Layer art={art} prefix={prefix}>
      <path d={near.body} fill={`url(#${prefix}-city)`} />
      <path d={near.spires} fill="none" stroke="var(--theme-city-top)" strokeWidth={0.9 * u} />
      <path className="win-a" d={near.gold} fill="#ffd488" opacity={0.9} />
      <path className="win-b" d={near.gold2} fill="#ffd488" opacity={0.9} />
      <path d={near.pale} fill="#dfeaff" opacity={0.85} />
      <path d={near.beacons} fill="#ff5a4e" opacity={0.85} />
      <rect x={-WIDE} y={shore} width={width + WIDE * 2} height={height - shore + 60} fill={`url(#${prefix}-water)`} />
      <ellipse cx={art.glow.x} cy={shore + 18 * u} rx={art.glow.rx * 0.6} ry={46 * u} fill={`url(#${prefix}-shine)`} />
      {/* The reflections shimmer by themselves and brighten a little when Omid moves about. */}
      <g className="reflect">
        <g className="shimmer">
          {columns.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={shore}
              width={c.w}
              height={c.h}
              fill={`url(#${prefix}-mirror${c.cool ? '-cool' : ''})`}
              opacity={c.a}
            />
          ))}
        </g>
      </g>
      {/* Breaks in the reflection: dark ripples across the columns. */}
      {ripples.map((r, i) => (
        <rect key={i} x={r.x - r.w / 2} y={r.y} width={r.w} height={1.4 * u} fill="var(--theme-water-mid)" opacity={0.7} />
      ))}
      <rect x={-WIDE} y={shore - 0.4 * u} width={width + WIDE * 2} height={1.1 * u} fill="#a9c0ff" opacity={0.3} />
    </Layer>
  )
}

// Ground layer: out-of-focus lights and faint glints on the water, behind Omid.
function Ground({ art }: { art: Art }) {
  const prefix = `${art.id}-ground`
  const { width, height, unit: u, shore } = art
  const random = createRandom(width * 11 + height)
  const glints = Array.from({ length: 14 }, () => ({
    x: random() * width,
    y: shore + (70 + 150 * random()) * u,
    w: (30 + 90 * random()) * u,
    a: 0.07 + 0.12 * random(),
  }))
  return (
    <Layer art={art} prefix={prefix}>
      {glints.map((g, i) => (
        <rect key={i} x={g.x - g.w / 2} y={g.y} width={g.w} height={1.6 * u} rx={0.8 * u} fill="#9fb8ff" opacity={g.a} />
      ))}
      <g className="bokeh" style={{ '--bokeh-dur': '7s' } as CSSProperties}>
        {bokeh(prefix, width * 17, { x: art.glow.x - art.glow.rx * 0.55, y: shore + 6 * u, w: art.glow.rx * 1.1, h: 70 * u }, 26, [2.5 * u, 9 * u], 0.3)}
      </g>
    </Layer>
  )
}

// Near layer: the quay and a garland of festoon lights across the foreground,
// in front of Omid, so the bay has a near edge and the scene has depth (it
// drifts the most). The bottom falls away into the night.
function Near({ art }: { art: Art }) {
  const prefix = `${art.id}-near`
  const { width, height, unit: u } = art
  const random = createRandom(width * 19 + height)
  const poleTop = height * 0.74
  const left = { x: width * 0.03, y: poleTop }
  const right = { x: width * 0.97, y: poleTop }
  const sag = height * 0.97
  const bulbs = Array.from({ length: 19 }, (_, i) => {
    const t = (i + 1) / 20
    const x = (1 - t) * (1 - t) * left.x + 2 * (1 - t) * t * (width / 2) + t * t * right.x
    const y = (1 - t) * (1 - t) * left.y + 2 * (1 - t) * t * sag + t * t * right.y
    return { x, y: y + 1.6 * u, r: (4.2 + 1.6 * random()) * u }
  })
  const top = height * 0.7
  return (
    <Layer art={art} prefix={prefix}>
      <rect x={-WIDE} y={top} width={width + WIDE * 2} height={height - top + 60} fill={`url(#${prefix}-fade)`} />
      {/* Quay poles and the wire between them. */}
      <rect x={left.x - 1.2 * u} y={left.y - 3 * u} width={2.4 * u} height={height - left.y + 60} fill="var(--theme-water-deep)" />
      <rect x={right.x - 1.2 * u} y={right.y - 3 * u} width={2.4 * u} height={height - right.y + 60} fill="var(--theme-water-deep)" />
      <path
        d={`M${left.x},${left.y} Q${width / 2},${sag} ${right.x},${right.y}`}
        fill="none"
        stroke="var(--theme-water-deep)"
        strokeWidth={0.9 * u}
      />
      {bulbs.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={b.r * 2.6} fill={`url(#${prefix}-bulb)`} opacity={0.55} />
          <circle cx={b.x} cy={b.y} r={b.r * 0.38} fill="#fff4d6" />
        </g>
      ))}
      <g className="bokeh" style={{ '--bokeh-dur': '11s' } as CSSProperties}>
        {bokeh(prefix, width * 23, { x: 0, y: height * 0.82, w: width, h: height * 0.2 }, 9, [9 * u, 20 * u], 0.35)}
      </g>
    </Layer>
  )
}

function SceneArt({ art, layer }: { art: Art; layer: 'far' | 'mid' | 'ground' | 'near' }) {
  if (layer === 'far') return <Far art={art} />
  if (layer === 'mid') return <Mid art={art} />
  if (layer === 'ground') return <Ground art={art} />
  return <Near art={art} />
}

export default memo(SceneArt)

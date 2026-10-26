import { memo } from 'react'
import type { CSSProperties } from 'react'

// The New Year night's atmosphere, in front of the city: slow gold and cool-blue
// bokeh, a few large soft lights in the foreground, fine gold dust rising on the
// air, and glints on the water. All CSS loops on transform and opacity, with
// positions from a fixed sequence (the same every render). Hidden under reduced
// motion, and the water glints and haze fade out on the map page.

const rand = (i: number, n: number) => {
  const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const make = (count: number, salt: number, f: (r: (n: number) => number) => CSSProperties) =>
  Array.from({ length: count }, (_, i) => f((n) => rand(i + salt * 100, n)))

const TINTS = ['255 204 130', '255 190 110', '140 176 255', '176 150 255']

const BOKEH = make(12, 1, (r) => ({
  '--x': `${(r(1) * 100).toFixed(1)}%`,
  '--y': `${(8 + r(2) * 62).toFixed(1)}%`,
  '--s': `${(46 + r(3) * 90).toFixed(0)}px`,
  '--d': `${(10 + r(4) * 10).toFixed(1)}s`,
  '--dl': `${(-r(5) * 18).toFixed(1)}s`,
  '--t': TINTS[Math.floor(r(6) * TINTS.length)],
}) as CSSProperties)

const FORE = make(7, 2, (r) => ({
  '--x': `${(r(1) * 100).toFixed(1)}%`,
  '--b': `${(-2 + r(2) * 16).toFixed(1)}%`,
  '--s': `${(70 + r(3) * 110).toFixed(0)}px`,
  '--d': `${(12 + r(4) * 10).toFixed(1)}s`,
  '--dl': `${(-r(5) * 20).toFixed(1)}s`,
  '--t': TINTS[Math.floor(r(6) * 3)],
}) as CSSProperties)

const DUST = make(46, 3, (r) => ({
  '--x': `${(r(1) * 100).toFixed(1)}%`,
  '--s': `${(1.5 + r(2) * 2.5).toFixed(1)}px`,
  '--d': `${(16 + r(3) * 22).toFixed(1)}s`,
  '--dl': `${(-r(4) * 30).toFixed(1)}s`,
  '--dx': `${(r(5) * 80 - 40).toFixed(0)}px`,
  '--o': (0.35 + r(6) * 0.5).toFixed(2),
}) as CSSProperties)

const GLINTS = make(26, 4, (r) => ({
  '--x': `${(r(1) * 96).toFixed(1)}%`,
  '--y': `${(r(2) * 100).toFixed(1)}%`,
  '--w': `${(18 + r(3) * 60).toFixed(0)}px`,
  '--d': `${(3 + r(4) * 5).toFixed(1)}s`,
  '--dl': `${(-r(5) * 8).toFixed(1)}s`,
}) as CSSProperties)

function Atmosphere() {
  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-haze" />
      <div className="atmo-glints">
        {GLINTS.map((style, i) => (
          <span key={i} style={style} />
        ))}
      </div>
      {BOKEH.map((style, i) => (
        <span key={`b${i}`} className="atmo-bokeh" style={style} />
      ))}
      {DUST.map((style, i) => (
        <span key={`d${i}`} className="atmo-dust" style={style} />
      ))}
      <div className="atmo-fore" />
      {FORE.map((style, i) => (
        <span key={`f${i}`} className="atmo-bokeh atmo-bokeh--fore" style={style} />
      ))}
    </div>
  )
}

export default memo(Atmosphere)

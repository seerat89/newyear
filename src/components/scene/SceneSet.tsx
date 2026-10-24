import { memo } from 'react'
import type { CSSProperties } from 'react'
import { lampCenter } from './scenes'
import type { SceneArt } from './scenes'

// The living parts of one composition: the drifting warm motes and the distant
// firework's flash, as real elements the motion system can drive (the city and water are
// static art). Positions are percentages of the stage; sizes use --vb, the size
// of one art unit on screen. Fireflies drift and pulse by themselves (plain CSS,
// ambient); the motion system only adds its reactions on top, through the
// outer element's transform, so the two never fight.

const pct = (value: number, of: number) => `${((value / of) * 100).toFixed(3)}%`

function SceneSet({ art }: { art: SceneArt }) {
  const lamp = lampCenter(art)
  const lampSize = 240 * art.unit
  const lampStyle: CSSProperties = {
    left: pct(lamp.x, art.width),
    top: pct(lamp.y, art.height),
    width: `calc(var(--vb) * ${lampSize})`,
    height: `calc(var(--vb) * ${lampSize})`,
    marginLeft: `calc(var(--vb) * ${-lampSize / 2})`,
    marginTop: `calc(var(--vb) * ${-lampSize / 2})`,
  }
  return (
    <div
      className="scene-art scene-set"
      data-art={art.id}
      style={{ '--vb': `calc(var(--stage-w) / ${art.width})` } as CSSProperties}
    >
      <div className="lantern-flare" style={lampStyle} />
      {art.fireflies.map((f, i) => {
        const size = f.r * 11 * art.unit
        const style = {
          left: pct(f.x, art.width),
          top: pct(f.y, art.height),
          width: `calc(var(--vb) * ${size})`,
          height: `calc(var(--vb) * ${size})`,
          marginLeft: `calc(var(--vb) * ${-size / 2})`,
          marginTop: `calc(var(--vb) * ${-size / 2})`,
          opacity: f.a,
          '--ff-dur': `${(7 + ((i * 1.7) % 6)).toFixed(1)}s`,
          '--ff-delay': `${(-i * 1.3).toFixed(1)}s`,
          '--ff-dx': `calc(var(--vb) * ${(((i * 7) % 11) - 5) * 1.2 * art.unit})`,
          '--ff-dy': `calc(var(--vb) * ${(((i * 5) % 9) - 4) * 1.4 * art.unit})`,
        } as CSSProperties
        return (
          <div key={i} className="ff" style={style}>
            <div className="ff-glow" />
          </div>
        )
      })}
    </div>
  )
}

export default memo(SceneSet)

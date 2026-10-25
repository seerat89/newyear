import { memo, useState } from 'react'
import type { CSSProperties } from 'react'
import { FireworkBurst } from './Burst'
import { SHOW } from './showScript'
import { useWithin } from './useWithin'

// The opening fireworks in the sky: a warm flash, a bloom of light on the
// horizon, and the composed show from showScript.ts (the same CSS bursts as the
// ambient ones in scene/Fireworks.tsx, played once, larger and doubled up for
// brightness). Every animation start is offset by how long ago midnight was when
// it mounted, so a page opened a few seconds late joins the show part-way instead
// of replaying it. It drops out of the page once it has played; the long display
// that follows is Sustained.tsx.

function MidnightShow({ startedAt }: { startedAt: number }) {
  // How long ago midnight was, read once at mount.
  const [sinceMidnight] = useState(() => Math.max(0, (Date.now() - startedAt) / 1000))
  const offset = (t: number) => `${(t - sinceMidnight).toFixed(2)}s`
  if (!useWithin(startedAt, 62_000)) return null

  return (
    <div className="scene-show">
      <div className="scene-flash" style={{ '--show-delay': offset(0) } as CSSProperties} />
      <div className="scene-bloom" style={{ '--show-delay': offset(0) } as CSSProperties} />
      {SHOW.map((b, i) => (
        <FireworkBurst key={i} burst={b} delay={offset(b.t)} />
      ))}
    </div>
  )
}

export default memo(MidnightShow)

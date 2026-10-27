import { memo, useRef } from 'react'
import type { CSSProperties } from 'react'
import Omid from '../omid/Omid'
import { TRAIL_DOTS, useOmidMotion } from '../omid/useOmidMotion'
import type { CelebrationStage } from '../../lib/celebration'
import MidnightPulse from '../celebration/MidnightPulse'
import MidnightShow from '../celebration/MidnightShow'
import { SustainedGlow, SustainedSky } from '../celebration/Sustained'
import { useSustainedBursts } from '../celebration/useSustainedBursts'
import Atmosphere from './Atmosphere'
import Cassette from './Cassette'
import Fireworks from './Fireworks'
import SceneArt from './SceneArt'
import SceneSet from './SceneSet'
import Snow from './Snow'
import SnowScape from './SnowScape'
import Stars from './Stars'
import { SCENES } from './scenes'

// The midnight world, behind the countdown. Back to front: sky, stars, distant
// fireworks, the far, mid and ground layers (skyline and water), the warm light
// pool, the drifting motes and the firework flash, a trail, Omid himself, and
// the near layer (a dark foreground fade), then a soft vignette. Every composition's art is rendered once; CSS shows
// the one that matches the screen (index.css), and the same CSS places Omid on that
// composition's lookout. useOmidMotion is the one system that moves him and the
// parts of the scene that answer him.

// Omid's place in each composition, handed to CSS as custom properties.
const stageStyle = Object.fromEntries(
  SCENES.flatMap(({ id, width, height, omid }) => [
    [`--${id}-omid-x`, `${((omid.x / width) * 100).toFixed(2)}%`],
    [`--${id}-omid-b`, `${(((height - omid.feet) / height) * 100).toFixed(2)}%`],
    [`--${id}-omid-w`, `${((omid.width / width) * 100).toFixed(2)}%`],
  ]),
) as CSSProperties

type SceneProps = {
  glow: number
  /** The midnight sequence stage (null outside it), and when midnight was. */
  celebration: CelebrationStage | null
  celebrationStart: number | null
  /** Christmas mode: snow, and the cassette player is decorated (by CSS). */
  christmas?: boolean
}

function Scene({ glow, celebration, celebrationStart, christmas = false }: SceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  useOmidMotion(sceneRef)
  const live = useSustainedBursts(celebrationStart)

  return (
    <div ref={sceneRef} aria-hidden="true" className="scene" data-celebrate={celebration ?? undefined}>
      <div className="scene-sky" />
      <Stars />
      <Fireworks />
      {celebrationStart !== null && <MidnightShow startedAt={celebrationStart} />}
      <SustainedSky live={live} />
      <div className="scene-stage" style={stageStyle}>
        <div className="scene-layer" data-layer="far">
          {SCENES.map((art) => (
            <SceneArt key={art.id} art={art} layer="far" />
          ))}
        </div>
        <div className="scene-layer" data-layer="mid">
          {SCENES.map((art) => (
            <SceneArt key={art.id} art={art} layer="mid" />
          ))}
        </div>
        <div className="scene-layer" data-layer="ground">
          {SCENES.map((art) => (
            <SceneArt key={art.id} art={art} layer="ground" />
          ))}
        </div>
        <div className="scene-pool" />
        {SCENES.map((art) => (
          <SceneSet key={art.id} art={art} />
        ))}
        <div className="scene-trail">
          {Array.from({ length: TRAIL_DOTS }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <Cassette />

        <div className="scene-omid">
          <div className="scene-omid-body">
            <Omid glow={glow} className="relative w-full" />
          </div>
        </div>
        <div className="scene-layer" data-layer="near">
          {SCENES.map((art) => (
            <SceneArt key={art.id} art={art} layer="near" />
          ))}
        </div>
      </div>
      {!christmas && <Atmosphere />}
      {christmas && (
        <>
          <Snow />
          <SnowScape />
        </>
      )}
      {celebrationStart !== null && <MidnightPulse startedAt={celebrationStart} />}
      <SustainedGlow live={live} />
      <div className="scene-vignette" />
    </div>
  )
}

export default memo(Scene)

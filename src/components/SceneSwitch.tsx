export type SceneName = 'countdown' | 'map'

type SceneSwitchProps = {
  scene: SceneName
  onChange: (scene: SceneName) => void
}

/** Manual Countdown | World Map switch; the screen also changes scene by itself. */
function SceneSwitch({ scene, onChange }: SceneSwitchProps) {
  return (
    <nav className="scene-switch" aria-label="Scene">
      <button type="button" aria-pressed={scene === 'countdown'} onClick={() => onChange('countdown')}>
        Countdown
      </button>
      <button type="button" aria-pressed={scene === 'map'} onClick={() => onChange('map')}>
        World Map
      </button>
    </nav>
  )
}

export default SceneSwitch

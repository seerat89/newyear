import { useT } from '../lib/strings'

export type SceneName = 'countdown' | 'map'

type SceneSwitchProps = {
  scene: SceneName
  onChange: (scene: SceneName) => void
}

/** Manual Countdown | World Map switch; the screen also changes scene by itself. */
function SceneSwitch({ scene, onChange }: SceneSwitchProps) {
  const { t } = useT()
  return (
    <nav className="scene-switch" aria-label={`${t('countdown')} / ${t('worldMap')}`}>
      <button type="button" aria-pressed={scene === 'countdown'} onClick={() => onChange('countdown')}>
        {t('countdown')}
      </button>
      <button type="button" aria-pressed={scene === 'map'} onClick={() => onChange('map')}>
        {t('worldMap')}
      </button>
    </nav>
  )
}

export default SceneSwitch

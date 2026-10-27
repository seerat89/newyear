import { setMusic, useMusic } from '../hooks/useMusic'
import { useT } from '../lib/strings'

/** A small round play/pause control for the cassette player's music (no audio yet). */
function MusicToggle() {
  const { t } = useT()
  const on = useMusic()
  return (
    <button
      type="button"
      className="music-toggle"
      aria-label={t('music')}
      aria-pressed={on}
      title={t('music')}
      onClick={() => setMusic(!on)}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M8 14.5V5.2l7-1.7v9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="14.6" r="2.2" fill="currentColor" />
        <circle cx="13" cy="12.8" r="2.2" fill="currentColor" />
        {!on && <path d="M3 17 17 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
      </svg>
    </button>
  )
}

export default MusicToggle

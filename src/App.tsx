import { useState } from 'react'
import CountdownDisplay from './components/CountdownDisplay'
import { glowForDaysLeft } from './components/omid/omidState'
import NewYearMessage from './components/celebration/NewYearMessage'
import { useOmidCelebration } from './components/celebration/useOmidCelebration'
import PhaseMessage from './components/PhaseMessage'
import Scene from './components/scene/Scene'
import { InfoPage } from './components/InfoPage'
import CornerMenu from './components/CornerMenu'
import { useCity } from './hooks/useCity'
import { usePage } from './hooks/usePage'
import MusicToggle from './components/MusicToggle'
import SceneSwitch from './components/SceneSwitch'
import type { SceneName } from './components/SceneSwitch'
import WorldMap from './components/worldmap/WorldMap'
import { useMidnightAudio } from './hooks/useMidnightAudio'
import { useChristmasMusic } from './hooks/useChristmasMusic'
import { useMusic } from './hooks/useMusic'
import { useSoundNudge } from './hooks/useSoundNudge'
import { useNow } from './hooks/useNow'
import { getNewYearWindow } from './lib/autoView'
import { getCelebration } from './lib/celebration'
import { audioOffset } from './lib/midnightAudio'
import { getCountdownState } from './lib/countdown'
import { getGreeting } from './lib/greetings'
import { useT } from './lib/strings'
import { getSeason } from './lib/season'
import { CITIES } from './components/worldmap/places'

/** How long before midnight the show is put in the page (hidden, delayed to the dot). */
const SHOW_PREROLL_MS = 4000

function App() {
  const now = useNow()
  // The countdown follows the viewer's chosen city; with none chosen, the device's time zone.
  const [city, setCity] = useCity()
  const tz = city === null ? undefined : CITIES[city].tz
  const state = getCountdownState(now, tz)
  const season = getSeason(now, tz)
  const { t, lang } = useT()
  const xmas = getGreeting('christmas', lang)
  const celebration = getCelebration(state, now)
  // The show is mounted a few seconds early so it starts from CSS on the dot of midnight.
  const upcoming = state.phase === 'counting' && state.target - now <= SHOW_PREROLL_MS ? state.target : null
  useOmidCelebration(state.phase === 'celebrating' ? state.startedAt : upcoming)
  const glow = state.phase === 'counting' ? glowForDaysLeft(state.remaining.days) : 1

  // Two fullscreen scenes, no scrolling, and the viewer's choice is never overridden,
  // with one exception: when the viewer's own midnight is 5 minutes away the screen
  // moves to the countdown for the celebration (lib/autoView.ts). They can switch back.
  const [scene, setScene] = useState<SceneName>('countdown')
  const midnight = getNewYearWindow(now, tz)
  const page = usePage()
  const [seen, setSeen] = useState<number | null>(null)
  if (midnight !== seen) {
    setSeen(midnight)
    if (midnight !== null) setScene('countdown')
  }

  // The midnight recording (on unless the viewer switched music off) starts 36 s
  // before their midnight (the spoken 10 at T-10) so "Happy New Year" lands on the celebration; when it
  // starts the screen goes to the countdown, even if they had gone back to the map.
  const music = useMusic()
  const audioMidnight = state.phase === 'counting' ? state.target : state.phase === 'celebrating' ? state.startedAt : null
  const soundBlocked = useMidnightAudio(audioMidnight, music)
  const sequence = music && audioMidnight !== null && audioOffset(now, audioMidnight) !== null
  // Omid asks for a tap if the browser has not allowed sound yet (hooks/useSoundNudge.ts).
  const nearMidnight = state.phase === 'counting' && state.target - now <= 5 * 60_000
  const carolsBlocked = useChristmasMusic(season === 'christmas', music)
  const speech = useSoundNudge(music, nearMidnight, (soundBlocked && sequence) || carolsBlocked) && scene === 'countdown'
  const [wasSequence, setWasSequence] = useState(false)
  if (sequence !== wasSequence) {
    setWasSequence(sequence)
    if (sequence) setScene('countdown')
  }

  return (
    <>
    <div className="app" data-scene={scene} data-season={season ?? undefined} inert={page !== null}>
      <Scene
        glow={glow}
        celebration={celebration?.stage ?? null}
        celebrationStart={celebration?.startedAt ?? upcoming}
        christmas={season === 'christmas'}
        speech={speech ? t('soundNudge') : null}
      />
      <div className="bottom-bar">
        <MusicToggle />
        <SceneSwitch scene={scene} onChange={setScene} />
      </div>
      <CornerMenu />
      <p className="sr-only" role="status">{speech ? t('soundNudge') : ''}</p>
      <main className="hero" inert={scene !== 'countdown'}>
        {state.phase === 'counting' && (
          <>
            {season === 'christmas' ? (
              <>
                <h1 data-omid-keepout className="hero-title xmas-title" lang={xmas.lang} dir={xmas.dir}>
                  {xmas.text}
                </h1>
                <p data-omid-keepout className="xmas-sub">{t('newYearIn')}</p>
              </>
            ) : (
              <h1 data-omid-keepout className="hero-title">{t('untilYear', { year: state.year })}</h1>
            )}
            <CountdownDisplay
              days={state.remaining.days}
              hours={state.remaining.hours}
              minutes={state.remaining.minutes}
              seconds={state.remaining.seconds}
            />
          </>
        )}
        {state.phase === 'celebrating' && <NewYearMessage year={state.year} stage={celebration?.stage ?? null} />}
        {state.phase === 'afterglow' && <PhaseMessage title={t('yearBegun', { year: state.year })} />}
        {city !== null && (
          <p className="hero-place">
            {t('midnightIn', { city: CITIES[city].name, country: CITIES[city].country })}
          </p>
        )}
      </main>
      <section className="map-section" aria-label="New Year around the world" inert={scene !== 'map'}>
        <WorldMap now={scene === 'map' ? now : Math.floor(now / 60_000) * 60_000} active={scene === 'map'} city={city} onCity={setCity} />
      </section>
    </div>
    {page && <InfoPage page={page} />}
    </>
  )
}

export default App

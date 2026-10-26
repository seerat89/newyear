import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { formatLocalTime, formatSpan, getWorldYear, getZoneStatus, newYearInstant } from '../../lib/worldTime'
import type { ZoneStatus } from '../../lib/worldTime'
import { usePrefersReducedMotion } from '../omid/usePrefersReducedMotion'
import { getFrontier, getWaves } from './frontier'
import { DOT_PATHS, GRATICULE, MAP_HEIGHT, MAP_WIDTH, MARKERS, placeAt, project } from './geometry'
import PlaceSearch from './PlaceSearch'
import { nearestCity } from './savedCity'
import { CITIES, PLACES } from './places'

// New Year moving around the world. Every land dot takes the status of the place
// nearest to it: already in the new year (warm gold, with a soft wake of light
// behind the frontier), celebrating right now (the first hour, bright and
// glowing), still waiting (dim blue), and the next to reach midnight (cool
// silver, with a pulsing ring). A glowing line marks the frontier, where midnight
// is arriving, and a beacon star marks it (frontier.ts); "Watch New Year travel"
// plays the whole night as a time-lapse. The times come from lib/worldTime.ts,
// which reads each place's IANA zone from the browser, so daylight saving and
// half-hour zones are right. Pick a place from the list or tap the map.

type Status = ZoneStatus | 'next'

const ORDER: Status[] = ['waiting', 'arrived', 'celebrating', 'next']

/** The time-lapse covers the whole wave in this long, redrawn this often. */
const LAPSE_MS = 26_000
const TICK_MS = 80
/** It starts a little before the first midnight and ends a little after the last. */
const LEAD_MS = 25 * 60_000
const TAIL_MS = 50 * 60_000

/** The key: a different simple shape for each state, tinted with its map colour. */
const LEGEND: [Status, string, string, ReactNode][] = [
  ['arrived', 'arrived', 'In ', <circle key="s" cx="5" cy="5" r="3.6" fill="currentColor" />],
  [
    'celebrating',
    'Celebrating now',
    'Now',
    <path key="s" d="M5 .4 6.2 3.8 9.6 5 6.2 6.2 5 9.6 3.8 6.2.4 5 3.8 3.8Z" fill="currentColor" />,
  ],
  ['next', 'Next to midnight', 'Next', <path key="s" d="M2.4 1 8.4 5 2.4 9Z" fill="currentColor" />],
  ['waiting', 'Waiting', 'Waiting', <circle key="s" cx="5" cy="5" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.4" />],
]

const names =(places: number[], count = 3) =>
  places.slice(0, count).map((i) => PLACES[i].name).join(', ') + (places.length > count ? '…' : '')

type WorldMapProps = {
  now: number
  active: boolean
  /** The viewer's chosen city (it also sets the countdown), and how to change it. */
  city: number | null
  onCity: (city: number | null) => void
}

function WorldMap({ now: liveNow, active, city: picked, onCity: choose }: WorldMapProps) {
  const reduced = usePrefersReducedMotion()
  const year = getWorldYear(liveNow)

  // When each place begins the year, and the order midnight reaches them.
  const { instants, waves, start, end } = useMemo(() => {
    const at = CITIES.map((place) => newYearInstant(place.tz, year))
    // The map's places come first; the extra search cities only add to the list.
    return { instants: at, waves: getWaves(at.slice(0, PLACES.length)), start: Math.min(...at) - LEAD_MS, end: Math.max(...at) + TAIL_MS }
  }, [year])

  // The time-lapse: null while live, otherwise how far through the night it is (0..1).
  const [lapse, setLapse] = useState<number | null>(null)
  const playing = lapse !== null
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setLapse((p) => (p === null || p + TICK_MS / LAPSE_MS >= 1 ? null : p + TICK_MS / LAPSE_MS))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [playing])
  const now = lapse === null ? liveNow : start + lapse * (end - start)

  const statuses: ZoneStatus[] = instants.map((at) => getZoneStatus(at, now))
  const frontier = getFrontier(waves, now)

  // The next to reach midnight: the earliest start still ahead (all places that share it).
  const mapInstants = instants.slice(0, PLACES.length)
  const upcoming = mapInstants.filter((at) => at > now)
  const nextAt = upcoming.length ? Math.min(...upcoming) : null
  const nextPlaces = nextAt === null ? [] : mapInstants.map((_, i) => i).filter((i) => instants[i] === nextAt)
  const latestAt = instants[frontier.places[0]]

  // Omid, who roams the scene, glances over when midnight reaches a new place while
  // the map is on screen (at most every few seconds, even in the time-lapse).
  const lead = frontier.places[0]
  const reactedAt = useRef(0)
  useEffect(() => {
    if (reduced || !active || Date.now() - reactedAt.current < 6000) return
    reactedAt.current = Date.now()
    window.dispatchEvent(new CustomEvent('omid-behave', { detail: 'glide' }))
  }, [lead, reduced, active])

  // The viewer's city is chosen by hand or (optionally) from their location; it is
  // owned by App, which remembers it and counts down to its midnight.
  const [detailOpen, setDetailOpen] = useState(false)
  const [locating, setLocating] = useState<'idle' | 'asking' | 'failed'>('idle')
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return setLocating('failed')
    setLocating('asking')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        choose(nearestCity(position.coords.latitude, position.coords.longitude))
        setLocating('idle')
      },
      () => setLocating('failed'),
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }
  // Leaving the map puts it back to live with the picker closed.
  if (!active && lapse !== null) setLapse(null)
  const selected = picked ?? frontier.places[0]

  const selectedAt = selected < PLACES.length ? MARKERS[selected] : project(CITIES[selected].lon, CITIES[selected].lat)
  const states: Status[] = statuses.slice(0, PLACES.length).map((s, i) => (nextPlaces.includes(i) ? 'next' : s))
  // The dots of each state, joined into one path per state (a few thousand characters).
  const paths: Record<Status, string> = { waiting: '', arrived: '', celebrating: '', next: '' }
  states.forEach((state, i) => (paths[state] += DOT_PATHS[i]))

  const sorted = CITIES.map((_, i) => i).sort((a, b) => instants[a] - instants[b] || CITIES[a].name.localeCompare(CITIES[b].name))

  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * MAP_WIDTH
    const y = ((event.clientY - box.top) / box.height) * MAP_HEIGHT
    const hit = placeAt(x, y)
    if (hit !== null) {
      choose(hit)
    }
  }

  const utc = formatLocalTime('UTC', now)
  const left = (frontier.x / MAP_WIDTH) * 100
  const top = (frontier.y / MAP_HEIGHT) * 100

  return (
    <div className="wm">
      {/* The time-lapse is a development aid, parked in a corner and left out of production builds. */}
      {import.meta.env.DEV && !reduced && (
        <button type="button" className="wm-btn wm-dev" onClick={() => setLapse(playing ? null : 0)}>
          {playing ? `${utc.time} UTC · Back to live` : 'Time-lapse (dev)'}
        </button>
      )}
      <div className="wm-status">
        {/* Both lines are always in the layout (an empty one is a hidden "ghost" on
            phones), so the dock never changes height and the map never jumps. */}
        {nextAt !== null ? (
          <p className="wm-next">
            <b>Next to midnight</b>
            <strong>{nextPlaces.length > 1 ? `${PLACES[nextPlaces[0]].name} +${nextPlaces.length - 1}` : names(nextPlaces, 1)}</strong>
            <span>in {formatSpan(nextAt - now)}</span>
          </p>
        ) : (
          <p className="wm-next wm-ghost" aria-hidden="true">
            <b>Next to midnight</b>
            <strong>-</strong>
          </p>
        )}
        {frontier.phase !== 'before' ? (
          <p className="wm-just">
            <b>{frontier.phase === 'after' ? `${year} has reached everyone` : `Just rang in ${year}`}</b>
            <strong>{names(frontier.places, 2)}</strong>
            <span>{formatSpan(now - latestAt)} ago</span>
          </p>
        ) : (
          <p className="wm-just wm-ghost" aria-hidden="true">
            <b>Just rang in</b>
            <strong>-</strong>
          </p>
        )}
      </div>
        <div className="wm-find">
          <PlaceSearch order={sorted} onSelect={choose} />
          <p className="wm-result" aria-live="polite" data-empty={picked === null ? '' : undefined}>
          {picked === null ? (
            <button type="button" className="wm-link" onClick={useMyLocation} disabled={locating === 'asking'}>
              {locating === 'asking'
                ? 'Finding the nearest city…'
                : locating === 'failed'
                  ? 'Location unavailable. Choose a city above, or try again'
                  : 'Or use my location'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="wm-city"
                aria-expanded={detailOpen}
                onClick={() => setDetailOpen(!detailOpen)}
              >
                <strong>
                  {CITIES[picked].name}, {CITIES[picked].country}
                </strong>
                <svg viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M2 3.5 5 6.8 8 3.5Z" fill="currentColor" />
                </svg>
              </button>
              <span className="wm-detail" data-open={detailOpen ? '' : undefined}>
              <span>
                Local time {formatLocalTime(CITIES[picked].tz, now).time.replace(/:\d\d(?=\s|$)/, '')}
              </span>
              <span>
                {statuses[picked] === 'waiting'
                  ? `Welcomes ${year} in ${formatSpan(instants[picked] - now)}`
                  : `Entered ${year} ${formatSpan(now - instants[picked])} ago`}
              </span>
              <button type="button" className="wm-link" onClick={() => choose(null)}>
                Clear
              </button>
              </span>
            </>
          )}
        </p>
        </div>

      <div className="wm-view">
        <div
          className="wm-stage"
          data-phase={frontier.phase}
          data-lapse={playing ? '' : undefined}
          style={{ '--x': `${left}%` } as CSSProperties}
        >
        <div className="wm-haze" />
        <svg
          className="wm-map"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label={`World map of who is already in ${year}, who is celebrating, and who is still waiting`}
          onClick={pick}
        >
          <defs>
            <linearGradient id="wm-wake" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ffd88a" stopOpacity="0.15" />
              <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wm-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fff2cc" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff6dc" stopOpacity="0.2" />
              <stop offset="1" stopColor="#fff2cc" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="wm-grid" d={GRATICULE} />
          {/* The frontier: a wake of warm light behind midnight, and the line itself. */}
          <g className="wm-frontier" data-lapse={playing ? '' : undefined} style={{ transform: `translateX(${frontier.x}px)` }}>
            <rect className="wm-wake" x={0} y={0} width={110} height={MAP_HEIGHT} fill="url(#wm-wake)" />
            <rect className="wm-frontier-line" x={-4} y={0} width={8} height={MAP_HEIGHT} fill="url(#wm-line)" />
            <rect className="wm-frontier-core" x={-0.4} y={0} width={0.8} height={MAP_HEIGHT} />
          </g>
          {ORDER.map((state) => (
            <path key={state} className={`wm-dots wm-dots--${state}`} d={paths[state]} />
          ))}
          {MARKERS.map(([x, y], i) => (
            <circle key={i} className={`wm-pin wm-pin--${states[i]}`} cx={x} cy={y} r={0.9} />
          ))}
          {nextPlaces.map((i) => (
            <circle key={`n${i}`} className="wm-next-ring" cx={MARKERS[i][0]} cy={MARKERS[i][1]} r={3} />
          ))}
          <circle className="wm-selected-ring" cx={selectedAt[0]} cy={selectedAt[1]} r={3.6} />
        </svg>

        {/* A beacon of light marks where midnight is arriving. */}
        <div className="wm-beacon" data-lapse={playing ? '' : undefined} style={{ left: `${left}%`, top: `${top}%` }}>
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 1 24 16 39 20 24 24 20 39 16 24 1 20 16 16Z" />
          </svg>
        </div>
        </div>
      </div>

      <div className="wm-dock">
      <div className="wm-controls">
        <ul className="wm-legend" aria-label="Map key">
          {LEGEND.map(([state, label, short, shape]) => (
            <li key={state} data-state={state}>
              <svg viewBox="0 0 10 10" aria-hidden="true">
                {shape}
              </svg>
              <span className="lg-long">{label === 'arrived' ? `Already in ${year}` : label}</span>
              <span className="lg-short" aria-hidden="true">
                {short === 'In ' ? `In ${year}` : short}
              </span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  )
}

export default WorldMap

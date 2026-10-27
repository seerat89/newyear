import { formatSpan } from '../../lib/worldTime'
import { spanUnits, useT } from '../../lib/strings'
import type { Frontier } from './frontier'
import { PLACES } from './places'

const names = (places: number[], count = 3) =>
  places.slice(0, count).map((i) => PLACES[i].name).join(', ') + (places.length > count ? '…' : '')

type MapStatusProps = {
  now: number
  year: number
  frontier: Frontier
  /** The next place(s) to reach midnight and when (null once everyone is in). */
  nextAt: number | null
  nextPlaces: number[]
  /** When the most recent place rang in the year. */
  latestAt: number
}

/** The two status lines over the map: next to midnight, and who just rang in the year. */
function MapStatus({ now, year, frontier, nextAt, nextPlaces, latestAt }: MapStatusProps) {
  const { t, lang } = useT()
  const span = (ms: number) => formatSpan(ms, spanUnits(lang))
  return (
    <div className="wm-status">
      {/* Both lines are always in the layout (an empty one is a hidden "ghost" on
          phones), so the dock never changes height and the map never jumps. */}
      {nextAt !== null ? (
        <p className="wm-next">
          <b>{t('nextToMidnight')}</b>
          <strong>{nextPlaces.length > 1 ? `${PLACES[nextPlaces[0]].name} +${nextPlaces.length - 1}` : names(nextPlaces, 1)}</strong>
          <span>{t('inSpan', { span: span(nextAt - now) })}</span>
        </p>
      ) : (
        <p className="wm-next wm-ghost" aria-hidden="true">
          <b>{t('nextToMidnight')}</b>
          <strong>-</strong>
        </p>
      )}
      {frontier.phase !== 'before' ? (
        <p className="wm-just">
          <b>{frontier.phase === 'after' ? t('reachedEveryone', { year }) : t('justRangIn', { year })}</b>
          <strong>{names(frontier.places, 2)}</strong>
          <span>{t('agoSpan', { span: span(now - latestAt) })}</span>
        </p>
      ) : (
        <p className="wm-just wm-ghost" aria-hidden="true">
          <b>{t('justRangIn', { year })}</b>
          <strong>-</strong>
        </p>
      )}
    </div>
  )
}

export default MapStatus

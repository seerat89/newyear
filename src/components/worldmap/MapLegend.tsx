import type { ReactNode } from 'react'
import type { ZoneStatus } from '../../lib/worldTime'
import { useT } from '../../lib/strings'
import type { StringKey } from '../../lib/strings'

/** The key: a different simple shape for each state, tinted with its map colour. */
const LEGEND: [ZoneStatus | 'next', StringKey, StringKey, ReactNode][] = [
  ['arrived', 'legendArrived', 'shortArrived', <circle key="s" cx="5" cy="5" r="3.6" fill="currentColor" />],
  [
    'celebrating',
    'legendNow',
    'shortNow',
    <path key="s" d="M5 .4 6.2 3.8 9.6 5 6.2 6.2 5 9.6 3.8 6.2.4 5 3.8 3.8Z" fill="currentColor" />,
  ],
  ['next', 'nextToMidnight', 'shortNext', <path key="s" d="M2.4 1 8.4 5 2.4 9Z" fill="currentColor" />],
  ['waiting', 'legendWaiting', 'legendWaiting', <circle key="s" cx="5" cy="5" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.4" />],
]

function MapLegend({ year }: { year: number }) {
  const { t } = useT()
  return (
    <ul className="wm-legend" aria-label={t('mapKey')}>
      {LEGEND.map(([state, label, short, shape]) => (
        <li key={state} data-state={state}>
          <svg viewBox="0 0 10 10" aria-hidden="true">
            {shape}
          </svg>
          <span className="lg-long">{t(label, { year })}</span>
          <span className="lg-short" aria-hidden="true">
            {t(short, { year })}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default MapLegend

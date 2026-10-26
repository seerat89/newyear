import type { CSSProperties } from 'react'
import type { CelebrationStage } from '../../lib/celebration'
import { getGreeting } from '../../lib/greetings'
import { useLanguage } from '../../lib/locale'

type NewYearMessageProps = {
  year: number
  /** The sequence stage, which only changes how brightly the year glows. */
  stage: CelebrationStage | null
}

// The New Year greeting (in the browser's language, lib/greetings.ts) and the new year, revealed in three beats (CSS, on mount):
// the greeting settles in, the digits of the year rise out of the light one by
// one, and a soft shine passes over them. The glow on the year is strongest
// during the show and eases back to the ordinary January 1 look.
function NewYearMessage({ year, stage }: NewYearMessageProps) {
  const text = String(year)
  const greeting = getGreeting('newyear', useLanguage())
  return (
    <h1 data-omid-keepout className="hero-title ny-message">
      <span className="ny-kicker" lang={greeting.lang} dir={greeting.dir}>
        {greeting.text}
      </span>{' '}
      <span className="ny-year" data-stage={stage ?? undefined} data-year={text}>
        {[...text].map((digit, i) => (
          <span key={i} className="ny-digit" style={{ '--i': i } as CSSProperties}>
            {digit}
          </span>
        ))}
      </span>
    </h1>
  )
}

export default NewYearMessage

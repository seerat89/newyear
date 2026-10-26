import { useEffect, useRef, useState } from 'react'

// A small cassette tape, a Christmas prop that rests on the shore beside Omid. It
// answers him and he answers it, using only the existing omid-behave events:
// tapping it makes Omid jump, and it hops when he jumps. Now and then (never while
// the tab is hidden or the page is on the map) a short routine plays on its own:
// Omid comes to his resting place beside it and then either nudges it (a jump, and
// the cassette rolls a little), listens to it (the reels turn and a few notes rise,
// with no sound) or leans in to look (it tilts up toward him).
type Play = 'nudge' | 'listen' | 'inspect'

const PLAYS: Play[] = ['nudge', 'listen', 'inspect', 'listen', 'nudge']
const behave = (name: string) => window.dispatchEvent(new CustomEvent('omid-behave', { detail: name }))

function Cassette() {
  const [play, setPlay] = useState<Play | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const all = timers.current
    const later = (ms: number, fn: () => void) => {
      all.push(window.setTimeout(fn, ms))
    }
    let n = 0
    const schedule = () =>
      later(38_000 + Math.random() * 40_000, () => {
        const onMap = document.querySelector('.app')?.getAttribute('data-scene') === 'map'
        if (!document.hidden && !onMap) {
          const next = PLAYS[n++ % PLAYS.length]
          behave('lookout')
          later(3_200, () => {
            setPlay(next)
            if (next === 'nudge') behave('jump')
            later(next === 'listen' ? 7_000 : 3_000, () => setPlay(null))
          })
        }
        schedule()
      })
    schedule()
    return () => all.forEach((id) => window.clearTimeout(id))
  }, [])

  return (
    <div className="cassette" data-play={play ?? undefined} onClick={() => behave('jump')}>
      <svg viewBox="0 0 80 54" aria-hidden="true">
        <rect x="2" y="2" width="76" height="50" rx="7" fill="#7a2a4a" stroke="#f6c56e" strokeWidth="2" />
        <rect x="9" y="8" width="62" height="22" rx="4" fill="#fff0d2" />
        <rect x="9" y="8" width="62" height="7" rx="3" fill="#c8443f" />
        <path d="M14 22h30" stroke="#7a2a4a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 26h20" stroke="#7a2a4a" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <circle cx="56" cy="22" r="3" fill="#2f8f5b" />
        <path d="M56 17v10M51 22h10" stroke="#fff0d2" strokeWidth="1" opacity="0.8" />
        <path d="M16 52l5-12h38l5 12Z" fill="#33162f" />
        <path d="M4 5 C14 -3 26 3 38 -1 C52 -4 62 3 76 4 C70 8 60 6 52 9 C40 6 30 10 20 8 C12 9 8 8 4 5Z" fill="#f2f4ff" />
        <g className="cassette-reel" style={{ transformOrigin: '30px 44px' }}>
          <circle cx="30" cy="44" r="4.5" fill="#fff0d2" />
          <path d="M30 40.5v7M26.5 44h7" stroke="#33162f" strokeWidth="1.4" />
        </g>
        <g className="cassette-reel" style={{ transformOrigin: '50px 44px' }}>
          <circle cx="50" cy="44" r="4.5" fill="#fff0d2" />
          <path d="M50 40.5v7M46.5 44h7" stroke="#33162f" strokeWidth="1.4" />
        </g>
      </svg>
      <span className="cassette-note" style={{ left: '28%' }}>
        ♪
      </span>
      <span className="cassette-note cassette-note--b" style={{ left: '62%' }}>
        ♫
      </span>
    </div>
  )
}

export default Cassette

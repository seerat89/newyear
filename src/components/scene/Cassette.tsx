import { useEffect, useRef, useState } from 'react'
import { useMusic } from '../../hooks/useMusic'
import { omidBehave as behave } from '../omid/behave'

// Omid's cassette player: a small cream-and-red portable player that rests on the
// shore beside him all year (Christmas only decorates it: snow, holly and a scarf, in
// CSS). It answers him and he answers it, using only the existing omid-behave events:
// tapping it makes Omid jump, and it hops when he jumps. Now and then (never while the
// tab is hidden or the page is on the map) a short routine plays on its own: Omid comes
// to his resting place beside it (lookout) and then inspects it, nudges it, listens
// beside it, dances to it or makes a little magic with it. There is no sound; the reels
// turn and notes rise. The viewer's music preference (hooks/useMusic.ts, shown by the
// round button in the corner) keeps the reels turning and the notes drifting.
type Play = 'nudge' | 'listen' | 'inspect' | 'dance' | 'magic'

const PLAYS: Play[] = ['inspect', 'nudge', 'listen', 'dance', 'magic', 'listen', 'nudge', 'dance']
const PLAYS_ON: Play[] = ['listen', 'dance', 'magic', 'listen', 'dance']
const LENGTH: Record<Play, number> = { nudge: 3_200, listen: 7_000, inspect: 3_400, dance: 5_200, magic: 4_200 }

// Speaker grille: a hex grid of small holes inside a circle.
const HOLES: [number, number][] = []
for (let row = -4; row <= 4; row++) {
  for (let col = -4; col <= 4; col++) {
    const x = col * 3.3 + (row % 2 ? 1.65 : 0)
    const y = row * 2.9
    if (Math.hypot(x, y) <= 11.6) HOLES.push([91 + x, 48 + y])
  }
}

function Reel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="cassette-reel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={6.6} fill="#fff0d2" stroke="#3a1517" strokeWidth={0.8} />
      <path
        d={`M${cx} ${cy - 5.4}V${cy + 5.4}M${cx - 4.68} ${cy - 2.7}L${cx + 4.68} ${cy + 2.7}M${cx - 4.68} ${cy + 2.7}L${cx + 4.68} ${cy - 2.7}`}
        stroke="#3a1517"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={2.3} fill="#fff0d2" stroke="#3a1517" strokeWidth={0.7} />
    </g>
  )
}

const KEYS = [17, 32.5, 48, 63.5, 79, 94.5]

function Cassette() {
  const [play, setPlay] = useState<Play | null>(null)
  const music = useMusic()
  const timers = useRef<number[]>([])
  const musicRef = useRef(music)
  useEffect(() => {
    musicRef.current = music
  }, [music])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const all = timers.current
    const later = (ms: number, fn: () => void) => {
      all.push(window.setTimeout(fn, ms))
    }
    let n = 0
    const schedule = () =>
      later(34_000 + Math.random() * 36_000, () => {
        const onMap = document.querySelector('.app')?.getAttribute('data-scene') === 'map'
        if (!document.hidden && !onMap) {
          const list = musicRef.current ? PLAYS_ON : PLAYS
          const next = list[n++ % list.length]
          behave('lookout')
          later(3_200, () => {
            setPlay(next)
            if (next === 'nudge' || next === 'magic') behave('jump')
            if (next === 'dance') {
              behave('jump')
              later(1_700, () => behave('jump'))
              later(3_400, () => behave('jump'))
            }
            later(LENGTH[next], () => setPlay(null))
          })
        }
        schedule()
      })
    schedule()
    return () => all.forEach((id) => window.clearTimeout(id))
  }, [])

  return (
    <div
      className="cassette"
      data-play={play ?? undefined}
      data-music={music ? 'on' : undefined}
      onClick={() => behave('jump')}
    >
      <div className="cassette-aura" />
      <svg viewBox="0 0 120 86" aria-hidden="true">
        <defs>
          <linearGradient id="cas-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3d6" />
            <stop offset="0.55" stopColor="#f8e2b4" />
            <stop offset="1" stopColor="#e8c78a" />
          </linearGradient>
          <linearGradient id="cas-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d2323a" />
            <stop offset="1" stopColor="#8e1b24" />
          </linearGradient>
          <linearGradient id="cas-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe29a" />
            <stop offset="1" stopColor="#b9822f" />
          </linearGradient>
          <radialGradient id="cas-lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffc46a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffc46a" stopOpacity="0" />
          </radialGradient>
          <clipPath id="cas-scarf">
            <path d="M1.5 35 Q6 32.5 10.5 35 V63 Q6 65.5 1.5 63Z" />
          </clipPath>
        </defs>

        {/* handle: gold frame, red grip */}
        <path d="M21 26 L23 11 Q23.4 8 26.5 8H93.5Q96.6 8 97 11L99 26" fill="none" stroke="url(#cas-gold)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={30} y={4.6} width={60} height={6} rx={3} fill="url(#cas-red)" />
        <rect x={32} y={5.4} width={56} height={1.6} rx={0.8} fill="#fff" opacity={0.28} />

        {/* body, with a red edge down the right side */}
        <rect x={4} y={24} width={112} height={56} rx={11} fill="url(#cas-red)" />
        <rect x={4} y={24} width={105} height={56} rx={11} fill="url(#cas-body)" />
        <path d="M13 26.5H98" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />

        {/* chunky top keys; the red one is play */}
        {KEYS.map((x, i) =>
          i === 3 ? (
            <g key={x} className="cassette-key cassette-key--play">
              {/* a narrow, squared hardware key in its slot, with bevelled edges */}
              <rect x={x + 0.6} y={13} width={11.8} height={12.6} rx={1.2} fill="#3d1013" />
              <rect x={x + 1.3} y={14.5} width={10.4} height={11} rx={1} fill="#8e1b24" />
              <rect x={x + 1.3} y={13.5} width={10.4} height={8.8} rx={1} fill="url(#cas-red)" />
              <rect x={x + 1.3} y={13.7} width={1.1} height={8.4} rx={0.5} fill="#ff8a8c" opacity={0.35} />
              <rect x={x + 10.6} y={13.7} width={1.1} height={8.4} rx={0.5} fill="#5e0f16" opacity={0.4} />
              <rect x={x + 2.4} y={13.8} width={8.2} height={1} rx={0.5} fill="#fff" opacity={0.35} />
              <path d={`M${x + 5.2} 16.3 L${x + 8.7} 18.4 L${x + 5.2} 20.5Z`} fill="#5a0d14" opacity={0.5} />
              <path d={`M${x + 5.2} 15.8 L${x + 8.7} 17.9 L${x + 5.2} 20Z`} fill="#ffe1a0" />
            </g>
          ) : (
            <g key={x} className="cassette-key">
              <rect x={x} y={14.5} width={13} height={11} rx={2.6} fill="#d9b97c" />
              <rect x={x} y={13.5} width={13} height={9.6} rx={2.6} fill="#fff1d0" />
              <rect x={x + 1.6} y={14.6} width={9.8} height={1.6} rx={0.8} fill="#fff" opacity={0.7} />
            </g>
          ),
        )}

        {/* cassette window with the tape and two reels */}
        <rect x={12} y={31} width={58} height={33} rx={6} fill="#4a1519" />
        <rect x={15} y={34} width={52} height={27} rx={4} fill="url(#cas-red)" />
        <rect x={33} y={41.5} width={16} height={11} rx={2.5} fill="#2a0f12" />
        <rect x={33} y={41.5} width={16} height={11} rx={2.5} fill="url(#cas-lamp)" className="cassette-lamp" />
        <Reel cx={26} cy={47} />
        <Reel cx={56} cy={47} />
        <path d="M34 57.4h10M41.4 55l3 2.4-3 2.4" fill="none" stroke="#ffd9a0" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 35.4 L40 35.4 L33 41 L16 41Z" fill="#fff" opacity={0.14} />

        {/* speaker grille */}
        <circle cx={91} cy={48} r={16} fill="#f2dba9" stroke="#dcbb80" strokeWidth={1} />
        {HOLES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.95} fill="#9a7338" opacity={0.85} />
        ))}

        {/* side volume knob, screws and feet */}
        <rect x={109} y={36} width={9} height={20} rx={3.6} fill="url(#cas-gold)" />
        <path d="M111.4 38.5V53.5" stroke="#fff" strokeWidth={1} opacity={0.5} strokeLinecap="round" />
        <circle cx={9.5} cy={29} r={1.4} fill="url(#cas-gold)" />
        <circle cx={9.5} cy={75} r={1.4} fill="url(#cas-gold)" />
        <circle cx={100} cy={75} r={1.4} fill="url(#cas-gold)" />
        <rect x={16} y={80} width={14} height={3.4} rx={1.7} fill="#5a1a1c" />
        <rect x={84} y={80} width={14} height={3.4} rx={1.7} fill="#5a1a1c" />

        {/* Christmas: snow on the keys, holly, and a striped scarf (shown by CSS) */}
        <g className="cassette-xmas">
          <path d="M16 15 C22 9 30 12 38 12 C46 9 52 13 62 12 C72 9 82 13 92 12 C99 10 105 12 109 15 C104 16.5 100 14.5 95 16.5 C88 14 80 17 72 15 C62 17 54 14 46 16 C38 14 30 17 24 15.5 C21 16 18 16 16 15Z" fill="#f2f4ff" />
          <g transform="translate(103 24)">
            <ellipse cx={-4} cy={1.5} rx={6} ry={2.6} transform="rotate(-28 -4 1.5)" fill="#2f8f5b" />
            <ellipse cx={5} cy={2.5} rx={6} ry={2.6} transform="rotate(24 5 2.5)" fill="#237a49" />
            <circle cx={0.6} cy={3.2} r={2} fill="#d92b3a" />
            <circle cx={-2.6} cy={5} r={1.7} fill="#d92b3a" />
            <circle cx={3.6} cy={5.4} r={1.7} fill="#c21f2f" />
          </g>
          <g clipPath="url(#cas-scarf)">
            <rect x={0} y={32} width={12} height={34} fill="#fff1d9" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M-2 ${33 + i * 6} L13 ${28 + i * 6} L13 ${31.4 + i * 6} L-2 ${36.4 + i * 6}Z`} fill="#cf2f3a" />
            ))}
          </g>
          <path d="M2 62 Q1.4 70 3.6 75 L9.4 73 Q7.4 68 8.4 62.6Z" fill="#cf2f3a" />
          <path d="M3 67 L8.6 65.4 M3.6 71.4 L8.8 69.6" stroke="#fff1d9" strokeWidth={1.6} />
        </g>
      </svg>
      <span className="cassette-note" style={{ left: '22%' }}>♪</span>
      <span className="cassette-note cassette-note--b" style={{ left: '50%' }}>♫</span>
      <span className="cassette-note cassette-note--c" style={{ left: '74%' }}>♩</span>
      <span className="cassette-spark" style={{ left: '12%' }}>✦</span>
      <span className="cassette-spark cassette-spark--b" style={{ left: '46%' }}>✦</span>
      <span className="cassette-spark cassette-spark--c" style={{ left: '82%' }}>✦</span>
    </div>
  )
}

export default Cassette

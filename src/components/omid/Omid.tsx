import { memo } from 'react'
import type { CSSProperties } from 'react'
import { energyForGlow } from './omidState'

// Round body, one curl of light on top, tiny arms and feet. Colours come from
// the --theme-spirit-* tokens. A dim fill and a bright fill are stacked, and
// the bright one's opacity is the glow level, so glow never needs re-mixing.
const BODY =
  'M100 70 C140 70 172 100 172 142 C172 186 142 214 100 214 C58 214 28 186 28 142 C28 100 60 70 100 70Z'
const CREST =
  'M82 84 C78 62 88 40 108 30 C128 20 148 30 145 48 C143 61 128 65 119 57 C128 57 132 49 127 44 C121 38 111 41 107 51 C102 62 110 74 118 84Z'

type OmidProps = {
  /** Warm inner light, 0..1. */
  glow: number
  /** Horizontal look direction, -1..1. */
  gaze: number
  className?: string
}

type LimbProps = { glow: number; children: (fill: string) => React.ReactNode }

// A limb is a dim and a bright copy; the bright one fades in with the glow.
function Limb({ glow, children }: LimbProps) {
  return (
    <>
      <g fill="var(--theme-spirit-dim-limb)">{children('dim')}</g>
      <g fill="var(--theme-spirit-limb)" opacity={glow}>
        {children('bright')}
      </g>
    </>
  )
}

const arm = (cx: number, cy: number, rotate: number) => (
  <ellipse
    cx={cx}
    cy={cy}
    rx={11}
    ry={16}
    transform={`rotate(${rotate} ${cx} ${cy})`}
  />
)

function Omid({ glow, gaze, className = '' }: OmidProps) {
  const style = {
    '--omid-glow': glow,
    '--omid-energy': energyForGlow(glow),
    '--omid-gaze': gaze,
  } as CSSProperties
  const cheek = 0.5 * (0.38 + 0.42 * glow)

  return (
    <div aria-hidden="true" className={`omid ${className}`} style={style}>
      <div className="omid-ground" />
      <div className="omid-halo" />
      <svg className="omid-root" viewBox="16 14 168 218" focusable="false">
        <defs>
          <radialGradient id="omid-body-dim" cx="50%" cy="60%" r="62%">
            <stop offset="0" style={{ stopColor: 'var(--theme-spirit-dim-core)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--theme-spirit-dim-mid)' }} />
            <stop offset="1" style={{ stopColor: 'var(--theme-spirit-dim-edge)' }} />
          </radialGradient>
          <radialGradient id="omid-body-bright" cx="50%" cy="60%" r="62%">
            <stop offset="0" style={{ stopColor: 'var(--theme-spirit-core)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--theme-spirit-mid)' }} />
            <stop offset="1" style={{ stopColor: 'var(--theme-spirit-edge)' }} />
          </radialGradient>
          <linearGradient id="omid-crest-dim" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--theme-spirit-dim-core)' }} />
            <stop offset="1" style={{ stopColor: 'var(--theme-spirit-dim-crest)' }} />
          </linearGradient>
          <linearGradient id="omid-crest-bright" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--theme-spirit-crest-low)' }} />
            <stop offset="1" style={{ stopColor: 'var(--theme-spirit-crest-high)' }} />
          </linearGradient>
          <radialGradient id="omid-inner">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="1" />
            <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
          <clipPath id="omid-clip">
            <path d={BODY} />
          </clipPath>
        </defs>

        <g id="omid-feet">
          <Limb glow={glow}>
            {() => (
              <>
                <ellipse cx={80} cy={216} rx={13} ry={7} />
                <ellipse cx={120} cy={216} rx={13} ry={7} />
              </>
            )}
          </Limb>
        </g>

        <g id="omid-arms">
          <g className="omid-arm omid-arm-l">
            <Limb glow={glow}>{() => arm(30, 160, 26)}</Limb>
          </g>
          <g className="omid-arm omid-arm-r">
            <Limb glow={glow}>{() => arm(170, 160, -26)}</Limb>
          </g>
        </g>

        <g id="omid-crest" className="omid-crest">
          <path d={CREST} fill="url(#omid-crest-dim)" />
          <path d={CREST} fill="url(#omid-crest-bright)" opacity={glow} />
          <path
            d="M94 74 C90 58 98 44 112 36"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.18 + 0.3 * glow}
          />
        </g>

        <g id="omid-body">
          <path d={BODY} fill="url(#omid-body-dim)" />
          <path d={BODY} fill="url(#omid-body-bright)" opacity={glow} />
        </g>

        <g id="omid-glow" clipPath="url(#omid-clip)">
          <circle
            cx={100}
            cy={150}
            r={74}
            fill="url(#omid-inner)"
            opacity={0.15 + 0.7 * glow}
          />
          <path
            d={BODY}
            fill="none"
            stroke="#fff3c4"
            strokeWidth={5}
            opacity={0.35 * glow}
          />
        </g>

        <g id="omid-sheen">
          <ellipse
            cx={70}
            cy={104}
            rx={17}
            ry={9}
            transform="rotate(-38 70 104)"
            fill="#fff"
            opacity={0.18 + 0.25 * glow}
          />
          <circle cx={52} cy={128} r={3} fill="#fff" opacity={0.14 + 0.2 * glow} />
        </g>

        <g id="omid-face">
          <ellipse cx={60} cy={164} rx={12} ry={7} fill="var(--theme-blush)" opacity={cheek} />
          <ellipse cx={140} cy={164} rx={12} ry={7} fill="var(--theme-blush)" opacity={cheek} />
          <g className="omid-gaze">
            <g className="omid-blink">
              {[77, 123].map((x) => (
                <g key={x}>
                  <ellipse cx={x} cy={140} rx={10.5} ry={13.5} fill="var(--theme-spirit-face)" />
                  <circle cx={x + 3.8} cy={134} r={4.2} fill="#fff" opacity={0.95} />
                  <circle cx={x - 3.6} cy={146} r={2} fill="#fff" opacity={0.65} />
                </g>
              ))}
            </g>
          </g>
          <path
            d="M92 166 Q100 175 108 166"
            fill="none"
            stroke="var(--theme-spirit-face)"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}

export default memo(Omid)

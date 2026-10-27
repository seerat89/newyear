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

function Omid({ glow, className = '' }: OmidProps) {
  const style = {
    '--omid-glow': glow,
    '--omid-energy': energyForGlow(glow),
  } as CSSProperties
  const cheek = 0.5 * (0.38 + 0.42 * glow)

  return (
    <div aria-hidden="true" className={`omid ${className}`} style={style}>
      <div className="omid-action">
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
          <linearGradient id="omid-cap" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#7a716c" />
            <stop offset="1" stopColor="#4d4644" />
          </linearGradient>
          <linearGradient id="omid-brim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8323a" />
            <stop offset="1" stopColor="#9a1f28" />
          </linearGradient>
          <linearGradient id="omid-santa" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#e23a3f" />
            <stop offset="1" stopColor="#a8212b" />
          </linearGradient>
          <radialGradient id="omid-fluff" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ece4dc" />
          </radialGradient>
          <radialGradient id="omid-inner">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="1" />
            <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
          <clipPath id="omid-clip">
            <path d={BODY} />
          </clipPath>
        </defs>

        <g id="omid-feet" className="omid-feet">
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
          <g className="omid-arm-pose omid-arm-pose-l">
            <g className="omid-arm omid-arm-l">
              <Limb glow={glow}>{() => arm(30, 160, 26)}</Limb>
            </g>
          </g>
          <g className="omid-arm-pose omid-arm-pose-r">
            <g className="omid-arm omid-arm-r">
              <Limb glow={glow}>{() => arm(170, 160, -26)}</Limb>
            </g>
          </g>
        </g>

        <g className="omid-crest-pose">
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

        <g className="omid-scarf" transform="translate(0 60)">
          <path d="M140 122 C147 130 150 142 147 154 L162 151 C164 140 160 128 152 116Z" fill="#b8393f" />
          <path d="M147 144 L161 141 M146 150 L160 147" stroke="#f6c56e" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M40 104 C70 124 130 124 160 104 L164 118 C132 140 68 140 36 118Z" fill="#c8443f" />
          <path d="M39 111 C70 131 130 131 161 111" fill="none" stroke="#f6c56e" strokeWidth="3" strokeLinecap="round" />
          <path d="M43 120 C72 138 128 138 157 120" fill="none" stroke="#8f2a3f" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
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

        {/* Headwear: overlays only (the body is untouched); the curl is hidden by CSS. */}
        <g className="omid-hat omid-hat--cap" transform="translate(0 -2) rotate(-3 100 100)">
          <path d="M38 100 C35 66 64 46 100 46 C136 46 165 66 162 100 C138 108 62 108 38 100Z" fill="url(#omid-cap)" />
          <path d="M100 48 C93 66 93 88 98 105 M100 48 C107 66 107 88 102 105 M66 56 C60 74 60 90 62 104 M134 56 C140 74 140 90 138 104" fill="none" stroke="#3d3736" strokeWidth={1.1} opacity={0.45} />
          <path d="M62 62 C72 52 88 48 104 49" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.16} />
          <circle cx={100} cy={46} r={5.4} fill="#d8323a" />
          <circle cx={98.4} cy={44.4} r={1.6} fill="#fff" opacity={0.4} />
          <path d="M34 100 Q100 128 166 100 Q100 110 34 100Z" fill="url(#omid-brim)" />
        </g>
        <g className="omid-hat omid-hat--santa" transform="rotate(-3 100 100)">
          <path d="M42 96 C37 56 68 24 106 24 C142 24 168 50 176 88 C168 82 162 86 158 96Z" fill="url(#omid-santa)" />
          <path d="M64 56 C78 38 96 30 116 30" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.2} />
          <g fill="url(#omid-fluff)">
            <rect x={34} y={89} width={132} height={22} rx={11} />
            {[42, 58, 76, 96, 116, 136, 156].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 111 : 109} r={7.5} />
            ))}
            {[46, 70, 94, 118, 142].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 89 : 91} r={6.5} />
            ))}
            <circle cx={177} cy={92} r={11} />
            <circle cx={170} cy={87} r={6} />
            <circle cx={184} cy={97} r={5} />
          </g>
        </g>
      </svg>
      </div>
    </div>
  )
}

export default memo(Omid)

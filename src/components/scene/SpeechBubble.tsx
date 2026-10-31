import { useLayoutEffect, useRef, useState } from 'react'
import { cloud } from '../../lib/cloudPath'

/** Space (px) kept clear between the bubble and the edge of the screen. */
const MARGIN = 8

/**
 * Omid's speech bubble (styled in cassette.css): a minimal cloud balloon beside his face, with a
 * curled tail pointing at his cheek and mouth (a ring of round bumps, lib/cloudPath.ts). It sits on the left; when there is not room there (he
 * is near the left edge, or the screen is narrow) it flips to the right, and if neither
 * side fits it takes the roomier one and wraps its text. It lives inside his moving body, so
 * it travels with him, and its side is re-checked a few times a second while it is shown.
 */
function SpeechBubble({ text }: { text: string }) {
  const bubble = useRef<HTMLParagraphElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = bubble.current
    const host = el?.parentElement
    if (!el || !host) return
    const place = () => {
      const box = host.getBoundingClientRect()
      const left = box.left - MARGIN
      const right = window.innerWidth - box.right - MARGIN
      el.style.maxWidth = ''
      const wanted = el.offsetWidth
      const current = el.dataset.side === 'right' ? 'right' : 'left'
      let side = current
      if ((current === 'left' ? left : right) < wanted) {
        const other = current === 'left' ? 'right' : 'left'
        side = (other === 'left' ? left : right) >= wanted || (other === 'left' ? left : right) > (current === 'left' ? left : right) ? other : current
      }
      const room = side === 'left' ? left : right
      if (room < wanted) el.style.maxWidth = `${Math.max(80, room)}px`
      if (el.dataset.side !== side) el.dataset.side = side
    }
    place()
    const timer = window.setInterval(place, 250)
    // The cloud is drawn to the bubble's measured size (the text, and any wrapping).
    const measure = () => setSize((o) => (o.w === el.offsetWidth && o.h === el.offsetHeight ? o : { w: el.offsetWidth, h: el.offsetHeight }))
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    return () => {
      window.clearInterval(timer)
      resize.disconnect()
    }
  }, [text])
  const { w, h } = size
  const shape = w > 0 ? cloud(w, h) : null

  return (
    <p ref={bubble} className="omid-speech" dir="auto" data-side="left">
      {/* The balloon: a plain soft cloud with a small tail, drawn to the text's size, with no outline. */}
      <svg className="omid-speech-shape" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <defs>
          <linearGradient id="omid-speech-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
            <stop offset="0" stopColor="#fffdf5" />
            <stop offset="1" stopColor="#fff3d3" />
          </linearGradient>
        </defs>
        {shape && (
          <>
            {/* The outline: both shapes stroked together, then both filled on top, so only the
                outer edge shows and body and tail join seamlessly. */}
            <g fill="#c58f3c" stroke="#c58f3c" strokeWidth="4" strokeLinejoin="round">
              <path d={shape.body} />
              <path d={shape.tail} />
            </g>
            <g fill="url(#omid-speech-fill)">
              <path d={shape.body} />
              <path d={shape.tail} />
            </g>
          </>
        )}
      </svg>
      <span className="omid-speech-text">{text}</span>
    </p>
  )
}

export default SpeechBubble

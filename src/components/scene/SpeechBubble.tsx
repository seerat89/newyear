import { useLayoutEffect, useRef } from 'react'

/** Space (px) kept clear between the bubble and the edge of the screen. */
const MARGIN = 8

/**
 * Omid's speech bubble (styled in cassette.css): beside his face at mouth level, with a
 * small tail pointing at his mouth. It sits on the left; when there is not room there (he
 * is near the left edge, or the screen is narrow) it flips to the right, and if neither
 * side fits it takes the roomier one and wraps its text. It lives inside his moving body, so
 * it travels with him, and its side is re-checked a few times a second while it is shown.
 */
function SpeechBubble({ text }: { text: string }) {
  const bubble = useRef<HTMLParagraphElement>(null)

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
    return () => window.clearInterval(timer)
  }, [text])

  return (
    <p ref={bubble} className="omid-speech" dir="auto" data-side="left">
      {text}
    </p>
  )
}

export default SpeechBubble

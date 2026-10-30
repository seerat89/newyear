import { useEffect, useState } from 'react'
import { CHRISTMAS_TRACKS, shuffledTracks } from '../lib/christmasMusic'

// While Christmas mode is on and music is enabled, plays the Christmas tracks as a small
// shuffled playlist: the next one starts when a track ends and the same track is never
// repeated straight away. Nothing is requested until then (the element has no source before
// its first play). Leaving Christmas mode drops the element's source; switching music off
// only pauses, so switching it on again carries on. Browsers may hold sound back until a
// tap or key press: `blocked` is true meanwhile, and the first gesture starts it.

const GESTURES = ['pointerup', 'mousedown', 'touchend', 'keydown'] as const

let element: HTMLAudioElement | null = null
let queue: string[] = []
let last: string | null = null

const audio = () => (element ??= Object.assign(new Audio(), { preload: 'none' }))

/** Whether the Christmas music is being held back until a tap or key press. */
export function useChristmasMusic(christmas: boolean, enabled: boolean): boolean {
  const [blocked, setBlocked] = useState(false)

  // Leaving Christmas mode: forget the playlist and release the file.
  useEffect(() => {
    if (!christmas) return
    return () => {
      const a = audio()
      a.pause()
      a.removeAttribute('src')
      a.load()
      queue = []
      last = null
    }
  }, [christmas])

  useEffect(() => {
    if (!christmas || !enabled) return
    const a = audio()
    let alive = true
    let failures = 0
    let waiting = false

    const stopWaiting = () => {
      GESTURES.forEach((g) => window.removeEventListener(g, retry))
      waiting = false
    }
    const retry = () => {
      stopWaiting()
      play()
    }
    const next = () => {
      if (queue.length === 0) queue = shuffledTracks(last)
      last = queue.shift() as string
      a.src = last
      play()
    }
    const play = () => {
      a.play().then(
        () => alive && setBlocked(false),
        (err: DOMException) => {
          // A changed source or a pause interrupts the promise: nothing to do.
          if (!alive || err.name !== 'NotAllowedError' || waiting) return
          setBlocked(true)
          waiting = true
          GESTURES.forEach((g) => window.addEventListener(g, retry))
        },
      )
    }
    const onEnded = () => {
      failures = 0
      next()
    }
    const onError = () => {
      // A missing or unreadable file: try another, but give up after one full round.
      if (++failures < CHRISTMAS_TRACKS.length) next()
    }

    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)
    if (a.getAttribute('src') && !a.ended) play()
    else next()

    return () => {
      alive = false
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
      stopWaiting()
      a.pause()
      setBlocked(false)
    }
  }, [christmas, enabled])

  return blocked
}

import { useEffect, useState } from 'react'
import { audioOf, nextTrack, resetPlaylist } from '../lib/playlists'
import type { Playlist } from '../lib/playlists'

// Plays a small shuffled playlist (lib/playlists.ts): the next track starts when one ends and
// the same track is never repeated straight away. Nothing is requested until the first play
// (the element has no source before then).
//
// `loaded` says the playlist is wanted at all (Christmas mode for the Christmas tracks, outside
// it for the normal ones); when it turns false the element's source is dropped. `playing` says
// it should be heard right now (music switched on, and not during the special midnight
// recording); when it turns false the track is only paused, so it carries on from the same
// place afterwards. Browsers may hold sound back until a tap or key press: the return value
// is true meanwhile, and the first gesture starts it.

const GESTURES = ['pointerup', 'mousedown', 'touchend', 'keydown'] as const

/** Whether the music is being held back until a tap or key press. */
export function usePlaylist(list: Playlist, loaded: boolean, playing: boolean): boolean {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!loaded) return
    return () => resetPlaylist(list)
  }, [list, loaded])

  useEffect(() => {
    if (!loaded || !playing || list.tracks.length === 0) return
    const a = audioOf(list)
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
      a.src = nextTrack(list)
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
    const onPlaying = () => {
      failures = 0
    }
    const onError = () => {
      // A missing or unreadable file: try another, but give up after one full round.
      if (++failures < list.tracks.length) next()
    }

    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)
    a.addEventListener('playing', onPlaying)
    if (a.getAttribute('src') && !a.ended) play()
    else next()

    return () => {
      alive = false
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
      a.removeEventListener('playing', onPlaying)
      stopWaiting()
      a.pause()
      setBlocked(false)
    }
  }, [list, loaded, playing])

  return blocked
}

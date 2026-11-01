// The music playlists. The files are large, so they are not in the repository or the PWA
// precache: they are served from a Vercel Blob store (a public address, VITE_AUDIO_BASE_URL in
// .env.local, see .env.example) and a playlist is only requested while it is wanted
// (hooks/usePlaylist.ts), Christmas tracks in Christmas mode and the normal-day tracks otherwise,
// both only while music is enabled. The service worker does not touch these cross-origin requests.
const AUDIO_BASE = String(import.meta.env.VITE_AUDIO_BASE_URL ?? '').replace(/\/+$/, '')

export const CHRISTMAS_TRACKS = [
  `${AUDIO_BASE}/christmas/carol-of-the-bells.mp3`,
  `${AUDIO_BASE}/christmas/christmas-prayer.mp3`,
  `${AUDIO_BASE}/christmas/quiet-eve.mp3`,
  `${AUDIO_BASE}/christmas/holiday-seasonal-3-510.mp3`,
]

export const NORMAL_TRACKS = [
  `${AUDIO_BASE}/normal/vastness.mp3`,
  `${AUDIO_BASE}/normal/forest-mist-whispers.mp3`,
  `${AUDIO_BASE}/normal/voxscape.mp3`,
]

/** One playlist's state: its audio element (made on first play) and its shuffle. */
export type Playlist = {
  tracks: string[]
  audio: HTMLAudioElement | null
  queue: string[]
  last: string | null
}

const makePlaylist = (tracks: string[]): Playlist => ({ tracks, audio: null, queue: [], last: null })

export const CHRISTMAS = makePlaylist(CHRISTMAS_TRACKS)
export const NORMAL = makePlaylist(NORMAL_TRACKS)

/** A shuffled copy of `tracks` whose first track is not `last` (no immediate repeat). */
export function shuffledTracks(tracks: string[], last: string | null, random: () => number = Math.random): string[] {
  const order = [...tracks]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order.length > 1 && order[0] === last) order.push(order.shift() as string)
  return order
}

/** The playlist's audio element, made on first use. */
export const audioOf = (list: Playlist): HTMLAudioElement => (list.audio ??= Object.assign(new Audio(), { preload: 'none' }))

/** The next track to play (a fresh shuffle when the last one is used up). */
export function nextTrack(list: Playlist): string {
  if (list.queue.length === 0) list.queue = shuffledTracks(list.tracks, list.last)
  list.last = list.queue.shift() as string
  return list.last
}

/** Forgets the shuffle and releases the file. */
export function resetPlaylist(list: Playlist) {
  const a = audioOf(list)
  a.pause()
  a.removeAttribute('src')
  a.load()
  list.queue = []
  list.last = null
}

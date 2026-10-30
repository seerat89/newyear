// The Christmas playlist (public/audio/christmas/). The files are large and are not part of
// the PWA precache: they are only requested while Christmas mode is on and music is enabled
// (hooks/useChristmasMusic.ts).
export const CHRISTMAS_TRACKS = [
  '/audio/christmas/carol-of-the-bells.mp3',
  '/audio/christmas/christmas-prayer.mp3',
  '/audio/christmas/quiet-eve.mp3',
  '/audio/christmas/holiday-seasonal-3-510.mp3',
]

/** A shuffled copy of the playlist whose first track is not `last` (no immediate repeat). */
export function shuffledTracks(last: string | null, random: () => number = Math.random): string[] {
  const order = [...CHRISTMAS_TRACKS]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order.length > 1 && order[0] === last) order.push(order.shift() as string)
  return order
}

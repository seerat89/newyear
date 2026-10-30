// Pure timing for the midnight audio (public/audio/midnight-sequence.mp3, about four
// minutes). In the recording the spoken ten-second countdown begins 26 s in and "Happy
// New Year" begins 36 s in, so it starts 36 s before the viewer's midnight: the spoken
// 10 is at T-10 and "Happy New Year" is at T=0, where the Happy New Year state and the
// big visual celebration begin. Like the rest of lib/, it takes `now` as a parameter.

export const AUDIO_SRC = '/audio/midnight-sequence.mp3'
/** Seconds into the recording at which midnight ("Happy New Year") is. */
export const AUDIO_MIDNIGHT_S = 36
export const AUDIO_LENGTH_S = 240.3

/** Where the recording should be (seconds) at `now` for a midnight, or null outside it. */
export function audioOffset(now: number, midnight: number): number | null {
  const offset = (now - midnight) / 1000 + AUDIO_MIDNIGHT_S
  return offset >= 0 && offset < AUDIO_LENGTH_S ? offset : null
}

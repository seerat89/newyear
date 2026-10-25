// The score of the midnight show: one list of bursts, read by MidnightShow (the
// fireworks in the sky) and MidnightPulse (the light they throw on the city and
// the water). It is composed, not random: a grand opener, then a crescendo of
// about ten seconds, with the pace quickening from one burst a second to several,
// in three depths (large, medium and small distant ones) and built from mirrored
// pairs, a palm, a sweep and a salvo, that climaxes in a great willow; then a
// long, thinning tail that calms into the ordinary day.
//
// Phones play the backbone only. Bursts marked `wide` are dropped on phones;
// bursts marked `tv` appear only on wide landscape screens, where they fill the
// full width of the sky.

export type Hue = 'gold' | 'white' | 'red' | 'blue'
export type Style = 'ring' | 'peony' | 'willow' | 'double' | 'glitter' | 'comet' | 'palm'

export type Burst = {
  /** Seconds after midnight. */
  t: number
  /** Percent of the width, and a fraction of the way down to the horizon. */
  x: number
  y: number
  /** Relative size; bursts of 1.2 or more are "major" and light the city and water. */
  size: number
  hue: Hue
  style: Style
  /** Hidden on phones, so the small screen stays calm. */
  wide: boolean
  /** Only on wide landscape screens (TV, desktop). */
  tv: boolean
}

export const isMajor = (b: Burst) => b.size >= 1.2 && b.style !== 'comet'
/** Small, dim bursts that sit far away near the skyline. */
export const isFar = (b: Burst) => b.size <= 0.55

const burst = (t: number, x: number, y: number, size: number, hue: Hue, style: Style, wide = true, tv = false): Burst => ({
  t, x, y, size, hue, style, wide, tv,
})
/** Two bursts mirrored about the centre line. */
const mirror = (t: number, d: number, y: number, size: number, hue: Hue, style: Style, wide = true): Burst[] => [
  burst(t, 50 - d, y, size, hue, style, wide),
  burst(t, 50 + d, y, size, hue, style, wide),
]
/** The same, for wide screens only. */
const tvMirror = (t: number, d: number, y: number, size: number, hue: Hue, style: Style): Burst[] => [
  burst(t, 50 - d, y, size, hue, style, true, true),
  burst(t, 50 + d, y, size, hue, style, true, true),
]
/** A quick run of small distant bursts across the sky, for wide screens. */
const tvRun = (t: number, xs: number[], y: number, size: number, hue: Hue, gap = 0.15): Burst[] =>
  xs.map((x, i) => burst(t + gap * i, x, y, size, hue, 'glitter', true, true))

const SWEEP_X = [12, 30, 50, 70, 88]
const SWEEP_Y = [0.62, 0.5, 0.4, 0.5, 0.62]
const SWEEP_HUE: Hue[] = ['gold', 'white', 'gold', 'white', 'gold']

export const SHOW: Burst[] = [
  // The first major firework: a warm white willow in the middle of the sky.
  // Omid's celebration jump is timed so he hangs in the star pose as it opens.
  burst(1, 50, 0.58, 1.8, 'white', 'willow', false),
  // The crescendo: mirrored pairs open outward, then the pace quickens.
  ...mirror(2.2, 16, 0.64, 0.9, 'gold', 'ring', false),
  ...tvMirror(1.9, 44, 0.78, 0.5, 'gold', 'ring'),
  ...tvMirror(2.5, 36, 0.74, 0.5, 'white', 'ring'),
  ...mirror(2.9, 30, 0.5, 1.1, 'red', 'peony'),
  ...tvMirror(3, 10, 0.7, 0.95, 'gold', 'peony'),
  ...mirror(3.5, 43, 0.42, 0.9, 'blue', 'ring'),
  ...tvMirror(3.6, 38, 0.45, 1.5, 'gold', 'willow'),
  burst(4, 50, 0.4, 1.5, 'gold', 'palm', false),
  ...tvMirror(4.2, 47, 0.8, 0.5, 'blue', 'glitter'),
  burst(4.6, 8, 0.8, 0.9, 'gold', 'comet'),
  burst(4.6, 92, 0.8, 0.9, 'gold', 'comet'),
  ...tvMirror(4.6, 20, 0.6, 1, 'red', 'ring'),
  burst(5.4, 50, 0.5, 1.7, 'white', 'peony', false),
  ...tvMirror(5, 33, 0.5, 1.6, 'white', 'peony'),
  ...tvRun(5.4, [18, 38, 62, 82], 0.8, 0.45, 'gold'),
  ...mirror(6.2, 24, 0.6, 1.25, 'gold', 'willow', false),
  ...tvMirror(6, 14, 0.68, 0.9, 'gold', 'double'),
  ...tvMirror(6.6, 44, 0.38, 1.7, 'gold', 'palm'),
  ...SWEEP_X.map((x, i) => burst(7 + 0.35 * i, x, SWEEP_Y[i], 0.85, SWEEP_HUE[i], i % 2 ? 'ring' : 'double', i !== 2)),
  ...tvMirror(7, 8, 0.72, 0.8, 'white', 'ring'),
  ...tvRun(7.3, [10, 30, 70, 90], 0.78, 0.5, 'white', 0.12),
  ...tvMirror(7.8, 28, 0.44, 1.8, 'white', 'willow'),
  ...[40, 30, 20, 10].flatMap((d, i) => mirror(9 + 0.4 * i, d, [0.7, 0.55, 0.65, 0.5][i], 0.8, 'gold', 'glitter', i % 2 === 1)),
  ...tvMirror(8.4, 40, 0.6, 1.1, 'gold', 'ring'),
  ...tvRun(8.8, [8, 22, 36, 64, 78, 92], 0.8, 0.5, 'gold', 0.1),
  ...tvMirror(9.4, 18, 0.5, 1.9, 'gold', 'willow'),
  ...tvMirror(10.2, 44, 0.55, 2.2, 'white', 'peony'),
  // The climax: a great gold willow with white double rings beside it.
  burst(10.8, 50, 0.55, 2.1, 'gold', 'willow', false),
  ...mirror(11.4, 22, 0.5, 1.3, 'white', 'double', false),
  // The tail: fewer, smaller and lower, until the sky is quiet.
  ...tvMirror(12.2, 30, 0.62, 1, 'gold', 'willow'),
  ...mirror(14, 36, 0.55, 0.8, 'gold', 'ring'),
  ...tvRun(13.6, [14, 34, 66, 86], 0.78, 0.5, 'gold', 0.2),
  burst(15.5, 50, 0.7, 0.7, 'gold', 'glitter', false),
  ...tvMirror(16, 40, 0.66, 0.8, 'gold', 'ring'),
  burst(17.5, 50, 0.5, 1, 'white', 'peony', false),
  ...tvRun(19, [24, 76], 0.78, 0.5, 'gold', 0.3),
  ...mirror(20, 28, 0.62, 0.7, 'gold', 'willow'),
  ...mirror(23, 18, 0.72, 0.6, 'gold', 'glitter'),
  burst(26, 50, 0.6, 0.8, 'gold', 'ring', false),
  burst(28.2, 38, 0.66, 0.55, 'gold', 'glitter'),
  burst(28.8, 62, 0.7, 0.55, 'gold', 'glitter'),
]

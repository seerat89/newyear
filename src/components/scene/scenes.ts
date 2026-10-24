import type { Pt } from './ridge'

// Midnight City: four separately composed pieces of art, one per screen shape.
// Each is drawn in its own viewBox (the stage at the bottom of the screen) and
// shown by media query (see index.css), so the phone is not a shrunk TV. The art
// is a distant lit skyline over dark water, with all the open sky left for Omid.
// Coordinates are viewBox units, y down, origin at the top-left of the stage.
// `unit` scales small details (windows, buildings) so they stay about the same
// size on screen across compositions.

export type SceneArt = {
  id: 'phone' | 'tablet' | 'desktop' | 'tv'
  width: number
  height: number
  unit: number
  /** Warm celebration glow behind the skyline. */
  glow: { x: number; y: number; rx: number; ry: number }
  /** The shoreline: where the water meets the skyline, and where Omid's feet rest. */
  shore: number
  /** The silhouette's envelope: the buildings' crest heights (y) along the stage. */
  skyline: Pt[]
  /** Omid's resting place: his feet, and his width. */
  omid: { x: number; feet: number; width: number }
  /** Where a distant firework bursts when he stops to watch (centre of the flash). */
  spark: { x: number; y: number }
  /** Warm motes drifting over the water (static positions, ambient drift in CSS). */
  fireflies: { x: number; y: number; r: number; a: number }[]
  /** Where Omid's feet go to watch the firework and to visit the drifting motes. */
  stops: { lantern: Pt; meadow: Pt[] }
  /** The lowest his feet may go. */
  feetMax: number
}

/** The centre of the distant firework burst, in viewBox units. */
export function lampCenter(art: SceneArt): { x: number; y: number } {
  return art.spark
}

/** The water surface straight below a point: the shore, or his feet if he is already over the water. */
export function groundBelow(art: SceneArt, _x: number, feetY: number): number {
  return Math.max(art.shore, feetY)
}

const ff = (list: [number, number, number, number][]) =>
  list.map(([x, y, r, a]) => ({ x, y, r, a }))

export const SCENES: SceneArt[] = [
  {
    // 390 x 844 phone, portrait: the skyline fills the lower 46 %, Omid is the centre.
    id: 'phone',
    width: 390,
    height: 390,
    unit: 1,
    glow: { x: 190, y: 104, rx: 360, ry: 150 },
    shore: 121,
    skyline: [[-20, 78], [60, 60], [130, 74], [200, 52], [270, 70], [330, 50], [410, 66]],
    omid: { x: 190, feet: 119, width: 148 },
    spark: { x: 322, y: 52 },
    fireflies: ff([
      [26, 128, 2.2, 0.95], [58, 106, 2.7, 1], [86, 134, 2, 0.8], [112, 96, 3, 1],
      [136, 122, 2.4, 0.9], [46, 144, 1.8, 0.7], [78, 88, 1.8, 0.7], [152, 104, 2.2, 0.85],
      [18, 98, 1.6, 0.6],
    ]),
    stops: { lantern: [262, 132], meadow: [[88, 198], [64, 150]] },
    feetMax: 236,
  },
  {
    // 820 x 1180 tablet, portrait: a wider bay, more sky above the city.
    id: 'tablet',
    width: 820,
    height: 470,
    unit: 1.4,
    glow: { x: 410, y: 148, rx: 640, ry: 210 },
    shore: 162,
    skyline: [[-20, 104], [120, 80], [260, 98], [400, 72], [540, 94], [680, 70], [840, 88]],
    omid: { x: 406, feet: 160, width: 210 },
    spark: { x: 690, y: 76 },
    fireflies: ff([
      [44, 156, 3, 0.9], [92, 132, 3.6, 1], [140, 170, 2.8, 0.75], [186, 118, 4, 1],
      [226, 154, 3.2, 0.9], [66, 190, 2.4, 0.65], [120, 106, 2.4, 0.7], [270, 128, 3, 0.85],
      [30, 118, 2.2, 0.6], [200, 188, 2.6, 0.7], [300, 160, 2.2, 0.6], [160, 142, 2, 0.6],
    ]),
    stops: { lantern: [590, 170], meadow: [[150, 282], [124, 206]] },
    feetMax: 340,
  },
  {
    // 1280 x 720 desktop, landscape: Omid left of centre, the firework far right.
    id: 'desktop',
    width: 1600,
    height: 360,
    unit: 1.5,
    glow: { x: 980, y: 136, rx: 900, ry: 190 },
    shore: 150,
    skyline: [[-20, 96], [200, 74], [420, 92], [660, 66], [900, 88], [1140, 64], [1380, 84], [1620, 70]],
    omid: { x: 620, feet: 148, width: 224 },
    spark: { x: 1262, y: 70 },
    fireflies: ff([
      [130, 140, 3, 0.9], [200, 112, 3.6, 1], [270, 150, 2.8, 0.8], [338, 98, 4, 1],
      [392, 132, 3.2, 0.9], [172, 166, 2.4, 0.65], [250, 84, 2.4, 0.7], [452, 112, 3, 0.85],
      [90, 106, 2.2, 0.6], [330, 170, 2.6, 0.7], [420, 160, 2.2, 0.6], [214, 142, 2, 0.6],
    ]),
    stops: { lantern: [1130, 160], meadow: [[330, 236], [282, 184]] },
    feetMax: 290,
  },
  {
    // 1920 x 1080 TV: bolder and simpler. Omid sits at the centre and everything
    // stays inside the overscan-safe area.
    id: 'tv',
    width: 1920,
    height: 432,
    unit: 1.8,
    glow: { x: 960, y: 162, rx: 1100, ry: 220 },
    shore: 176,
    skyline: [[-20, 104], [240, 78], [500, 98], [780, 70], [1080, 94], [1360, 68], [1640, 90], [1940, 74]],
    omid: { x: 960, feet: 174, width: 300 },
    spark: { x: 1560, y: 84 },
    fireflies: ff([
      [230, 150, 3.6, 0.9], [330, 112, 4.4, 1], [420, 164, 3.4, 0.8], [520, 104, 4.8, 1],
      [600, 146, 3.8, 0.9], [276, 192, 3, 0.65], [380, 82, 3, 0.7], [680, 120, 3.6, 0.85],
      [180, 118, 2.8, 0.6], [500, 192, 3.2, 0.7], [640, 184, 2.8, 0.6], [440, 140, 2.4, 0.6],
      [300, 150, 2.2, 0.55], [560, 72, 2.4, 0.6],
    ]),
    stops: { lantern: [1350, 184], meadow: [[430, 274], [384, 222]] },
    feetMax: 340,
  },
]

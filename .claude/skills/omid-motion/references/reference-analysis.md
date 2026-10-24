# What the reference video shows

Source: `.references/omid-animation-reference.mp4` (25.2 s, 30 fps, 2026x1006).
It is a hand-held phone recording of an onboarding flow for another app. **It is a
motion reference only. Never copy its character, art, palette or layout.**

How this analysis was made (so it can be repeated and checked, not trusted
blindly): contact sheets from `scripts/contact_sheet.py` at 2 fps (overview),
6-7 fps (travel) and 15 fps (the jump). Timings are read from sampled frames, so
treat them as +/- one frame (about 70-170 ms depending on the sheet). Re-run the
script and look before you rely on any number here.

| Time in clip | What is on screen |
|---|---|
| 0-11 s | A character floating on a pool ring, steered by physically tilting the phone ("Tilt to float"). |
| ~11-25 s | Screen capture of five onboarding screens. Two show scripted character moves: "Leaps out of the bushes" (the jump) and "Swims through ice cubes" (the swim). |

## 1. Tilt-driven floating (0-11 s)

- **Tilt is a push, not a position.** The character keeps drifting after the phone
  levels out. Launches are quick (about 0.5 s to cross a third of the screen);
  the glide afterwards is long and eases out like drag in water.
- **Soft edges.** He drifts toward an edge and settles near it. No hard rebound.
  He never leaves the screen.
- **Orientation barely changes.** A few degrees of lean at most. It reads as one
  object floating on a surface, not a sprite that spins toward its target.
- **Environment answers him.** Concentric ripples spread from him and linger where
  he has been. A faint trail persists. The pool feels disturbed by him. This is
  the strongest "he lives here" signal in the clip.
- **Move/rest ratio.** He is rarely perfectly still (a slow drift continues), but
  strong movement only happens while there is input.

## 2. The jump ("Leaps out of the bushes")

Phases, from the 15 fps sheet (about 2.4 s for the whole visible leap, then about
1.3 s of nothing before the next one):

| # | Phase | About | What is visible |
|---|---|---|---|
| 1 | Anticipation | 0.1-0.2 s | Only the top of the head shows at the bottom edge, as if crouched. The body is compressed low and wide. |
| 2 | Launch and rise | ~0.3 s | Fast rise, body **stretched tall** and slightly tilted, limbs trailing behind it. Speed is highest at the start of the rise, then falls off (ease-out). |
| 3 | Open pose at the top | ~0.3 s | The body opens into a **readable star pose**: arms and legs splayed, silhouette suddenly wider. This is the "pose you could draw from one frame". Small bits of foliage fly up at the launch. |
| 4 | Hang | ~0.8 s | The longest phase. The character almost stops at the top, then **sinks only about a tenth of the jump height**. Pose is held. The audience gets time to read the pose and enjoy it. |
| 5 | Descent | ~0.3 s | Fast drop, body upright, accelerating (ease-in). |
| 6 | Landing | ~0.1 s | Sinks into the bushes, compressing. It lands in something soft, which hides the impact. |
| 7 | Settle | - | It disappears below the edge; a calm gap before the next jump. |

Things that make it work, in order of importance:

1. **The hang.** About a third of the move is spent nearly still at the apex.
   Rise and fall are fast, the top is slow. Never keep a constant speed.
2. **The pose change is the event.** The body shape is different at the top
   (wide, open) from the bottom (narrow, stretched). It is not the same shape moved up.
3. **Asymmetric timing.** Rise about 0.3 s, hang about 0.8 s, fall about 0.3 s.
4. **The apex is high.** Roughly 1.5 body heights above the launch point.
5. **Something reacts.** Foliage kicks up; the bushes absorb the landing.

## 3. The swim ("Swims through ice cubes")

From the 7 fps sheet (about 7 s, spanning two passes):

- **The swim pose is a different pose.** The character is drawn lying flat, in
  profile, head forward, legs trailing. It is not the upright pose rotated by 60-90
  degrees. When you only have one pose, you have to *build* the swim posture (a
  lean of ten to twenty degrees, a stretch along the direction of travel, trailing
  limbs and crest), not rotate the whole body.
- **Gradual entry.** The character first shows as a clipped sliver at the screen
  edge, then slides in. The screen edge is the staging device; nothing pops in.
- **Sustained glide.** Mid-screen the speed is slow and roughly constant. A screen
  width takes about 4 s, which is under one body length per second.
- **Bob and tilt.** A small vertical bob (about a tenth of the body height at
  roughly 0.5 Hz) and a few degrees of tilt keep a constant-speed glide alive.
- **Different heights per pass.** The first pass crosses the upper part of the
  screen, the next one enters lower and ends near the centre. The path is a gentle
  curve, not a straight line at constant height.
- **Moves over the content.** The character swims above and across the content
  area, and the content stays readable.

## 4. Principles to carry over (and what not to carry over)

Carry over:

- Input (or intent) produces acceleration. Motion decays by drag.
- Long calm, short expressive. Quiet is part of the animation.
- A distinctive pose at the peak of each move, held long enough to read.
- Asymmetric phase timing, with the interesting phase the slowest.
- A soft place to land, and an environment that reacts.
- Clear staging: things enter and leave through edges, or land in something.

Do not carry over:

- The art, the character, the colours, the pool.
- The way the reference swaps drawings between poses; Omid must build poses from
  one rig (see `motion-model.md`).
- The assumption that the screen is a pool; Omid's world is the midnight sky and
  the orbit dial.

## 5. Limits of this analysis

- Sampled frames only; no per-frame tracking. The phone is hand-held, so the
  floating scene's absolute speeds are unreliable.
- The narration track was not transcribed.
- Verify any number you intend to encode by re-sheeting the exact segment:
  `python scripts/contact_sheet.py <video> --start 18.2 --duration 2.4 --fps 15 ...`

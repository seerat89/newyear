---
name: omid-motion
description: How to design, build and verify Omid's movement (the mascot of the New Year countdown) so it reads as a living character, not an SVG being translated. Use this skill whenever the task touches Omid's motion or animation in any way, including floating, swimming, jumping, hopping, rolling, idle actions, the physics/autopilot code, squash and stretch, crest or arm motion, gaze, halo or light trails, scene reactions to Omid, or reports like "the animation looks jerky/mechanical/robotic", "make Omid feel alive", "match the reference video". Use it even when the user does not mention the skill or the reference video. It encodes the motion language taken from .references/omid-animation-reference.mp4 and requires checking the result in a running browser over time.
---

# Omid Motion

Omid is the round, glowing spirit of the New Year countdown. His movement is the
thing people will remember. The first attempts failed because they moved a rigid
SVG with translate and rotate: starts, turns and stops were abrupt, the swim was
a big rotation plus a slide, nothing inside him moved differently from the
whole, and the scene ignored him. This skill exists to stop that from happening again.

**Primary reference:** `.references/omid-animation-reference.mp4`. It is a
reference for *motion behaviour only*. Never copy its character, art, colours or
layout. What it teaches is written up, with timings, in
`references/reference-analysis.md` (read it before designing a move).

## Core idea

Animate a **character performing**, not an object being moved. A strong move has a
reason (intent), a preparation (anticipation), a body that obeys inertia
(acceleration, drag), a pose that changes shape (squash, stretch, open pose),
parts that lag and overshoot (crest, arms, halo, gaze), a soft finish
(overshoot and settle), and a scene that answers it. Remove any of these and it
reads as mechanical.

## Rules

Each rule has its reason, so you can judge edge cases instead of following blindly.

**Dynamics**
1. **Acceleration, inertia, drag.** Input changes acceleration; the body integrates it.
   Never write a position or a velocity directly. Direct writes make starts and
   stops snap.
2. **Smooth, curved trajectories.** No obvious linear interpolation from A to B.
   Steer along a gentle arc with arrival steering. A ruler line reads as a machine.
3. **Anticipation before strong movement.** Any launch above a gentle drift gets a
   short opposite-direction squash or dip first (about 0.15-0.3 s). It tells the eye
   what is coming.
4. **Overshoot and settle.** Stops and landings overshoot slightly and settle, then
   idle breathing resumes. A stop is the mirror of a start.

**Pose and shape**
5. **Restrained body rotation.** Gliding lean at most 12 degrees (18 at peak
   acceleration), angular speed under about 60 degrees/s. No arbitrary large
   rotations; never 60+ degrees to "swim".
6. **Orientation follows the direction of travel gradually,** mostly through gaze,
   stretch along the heading and crest side, and a few degrees of lean, not by
   spinning the body.
7. **Squash and stretch on launch, impact and settling.** Volume preserving (scaleX x
   scaleY about 1), within about 0.8-1.2.
8. **Smooth entry and exit from poses; no snapping between idle and travel.** Blend
   with smoothed weights. Idle breathing and blinking keep running underneath, scaled down,
   never switched off.

**Secondary motion**
9. **Crest lag driven by acceleration.** A damped spring that trails the body, overshoots
   and keeps wobbling briefly after he stops.
10. **Arm secondary motion driven by acceleration.** They swing against it, lift on
    launch, paddle in a glide.
11. **Gaze reacts to the destination first, then to velocity.** The eyes lead the body.
12. **Halo lags and stretches slightly; faint light trails.** They tell the eye where he
    has been and which way he is going.

**Behaviour and staging**
13. **Meaningful destinations and actions,** not random transforms. Every move should
    be explainable: he goes to see something, visits a bead, leaps because he is
    delighted. Random jitter is not behaviour.
14. **Long calm periods balanced with deliberate character moments.** At least about 70 % of
    the time he only breathes and blinks. A strong moment roughly every 20-45 s, never two
    strong ones in a row. Quiet is part of the animation.
15. **No teleport-like edge wrapping unless visually staged.** Prefer paths that stay
    on screen. If he leaves, he keeps moving off screen for a believable time and
    returns with a reason, with position and velocity continuous.
16. **Environmental reaction.** The scene answers his movement (a wake, brightening
    beads, drifting motes, a ground glow on landings). A character that does not touch
    anything feels pasted on. See `references/motion-model.md` section 7.

**Constraints**
17. **Reduced motion:** no frame loop, no travel, no jump; a composed static pose.
18. **Phone, desktop and TV:** one fluid layout, sizes relative to the dial; check every size.
    The countdown stays legible and stays the visual priority.
19. **Weak devices:** one frame loop writing only transform and opacity to a few refs, no
    React state per frame, asleep when idle, stopped when hidden, a small budget of
    extra animated elements, proven with frame-pacing numbers.

## The two signature moves

Details and timings are in `references/motion-model.md` section 5. Do not shortcut them.

**Jump:** anticipation/squash -> fast launch -> stretch -> readable airborne pose and
hang -> descent -> landing compression -> settle. The **hang is the longest phase**
(about a third of the move), almost still, sinking about a tenth of the height.
The pose at the top (open, wide) differs from the pose on the way up (narrow,
stretched). The reference rises about 1.5 body heights. Only jump where there is
clear room.

**Swim:** gradual orientation -> acceleration -> sustained glide -> subtle bob and
secondary movement -> deceleration -> natural settle. The reference swims
slowly (a screen width in about 4 s) at roughly constant speed along a gentle
curve with a small bob. The reference's swimmer is *drawn in a different pose*; Omid has
one body, so build the posture from lean, stretch, trailing crest, paddling arms
and a trail. **Do not simply rotate him 60+ degrees and translate him across the screen.**

## Workflow

1. **Look at the reference first.** Re-sheet the relevant segment with
   `scripts/contact_sheet.py` and read it; do not rely on remembered numbers.
2. **Write a choreography brief before code:** the intent of the move, a phase
   table (phase, duration, body, shape, secondary parts, environment, gaze), the
   curve each phase uses, and what the scene does. Check it against the rules above.
3. **Build in layers** (see `references/motion-model.md`): intent, steering, body
   dynamics, pose blending, secondary springs, environment. Keep physics code pure and
   DOM-free; keep the DOM writes in one small hook.
4. **Verify in the running browser** (see below). This step is not optional.
5. **Iterate** on the single biggest problem each round until the strips read like the
   reference and the numbers are clean.
6. **Report** what was checked, at which sizes, the numbers before and after, and what
   is still weak. Never call motion "done" from still screenshots.

## Visual verification (required)

Follow `references/verification.md`. In short:

- Run the real app and drive it with the `playwright-cli` skill. Do not judge from code.
- **Evaluate transitions over time:** record the moving parts with
  `scripts/track_sampler.js`, analyse with `scripts/analyze_track.py`, and read
  frame strips made with `scripts/contact_sheet.py` from a video of the move.
- **Compare against the reference:** sheet the matching reference segment with the
  same settings and compare phases, proportions and silhouettes.
- **Check** phone, small phone, desktop and TV; reduced motion; idle (loop asleep);
  hidden tab (loop stopped); a CPU-throttled run where possible.
- **If it looks mechanical, iterate.** The numbers only catch mechanical failures
  (abrupt starts/stops, snaps, big rotations). Whether it feels alive is decided by
  reading the strips.

## Project rules that still apply

These come from `CLAUDE.md` and the user's standing instructions:

- Run `npm run lint` and `npm run build` after changes. Report files changed, issues
  and follow-ups. **Never commit unless asked.**
- `src/lib/countdown.ts` and `src/hooks/useNow.ts` stay untouched unless asked.
- No new dependencies without explaining why the existing stack is not enough. (A
  physics library is not needed: a point body with springs is a few dozen lines.)
- The countdown stays legible. No jokes, fireworks, audio or midnight sequence work
  inside a motion task.
- Do not redesign Omid's look or the orbit dial while working on motion, unless that is
  the task.
- Where `frontend-design` is also in play, it guides *visual* decisions for new scene
  elements (wake, glow, particles). It does not override this skill on motion.

## Files

- `references/reference-analysis.md`: what the reference shows (floating, jump, swim),
  with timings and its limits.
- `references/motion-model.md`: the layered model, starting constants, choreography
  tables, staging, environment reactions, failures to avoid.
- `references/verification.md`: the Playwright-based verification protocol.
- `scripts/contact_sheet.py`: frame strips from any video (reference or recording).
- `scripts/track_sampler.js`: per-frame position, rotation, scale and opacity of chosen
  elements in the page.
- `scripts/analyze_track.py`: smoothness, rotation and pacing metrics with flags.

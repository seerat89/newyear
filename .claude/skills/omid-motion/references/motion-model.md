# Motion model for Omid

The aim is a **character performing**, not an SVG being moved. Build the motion as
layers, from intent down to pixels, and make every layer continuous (no layer may
jump to a new value).

```
intent        what is he doing and why (a destination, a mood, a beat)
steering      a smooth desired velocity along a curved path
body dynamics acceleration (limited), drag, soft boundaries -> position, velocity
pose          anticipation / travel / airborne / landing, blended by weights
secondary     crest, arms, halo, gaze: springs driven by the body's acceleration
environment   things in the scene that answer his movement
```

## Where it lives in this repo

The model above is implemented, one module per layer, in
`src/components/omid/motion/` (pure, no DOM) and driven by one frame loop in
`src/components/omid/useOmidMotion.ts`:

| Layer | Module |
|---|---|
| intent | `director.ts`: behaviours as steps (travel, hold, jump) with destination, gaze, scene event |
| steering | `path.ts` (curved Beziers, rounded corners round the countdown), `profile.ts` (asymmetric smooth speed profile); the carrot follows the route, the body is a damped spring chasing it |
| pose and secondary | `rig.ts` (lean, squash/stretch, crest, arms, halo lag, gaze), `jump.ts` (the reference phases) |
| environment | `fireflies.ts` plus the light pool, trail, lantern flare and parallax written by the controller |

To add a behaviour: write a builder in `director.ts` (destination from `Places`,
a route from `planRoute`, a gaze), put it in the bag, then verify it as
described in `verification.md`. Do not add CSS keyframes for movement.

## 1. Body dynamics

- State: position, velocity. **Input only ever changes acceleration.** Never write
  a position or a velocity directly (the one exception: a staged, hidden reposition,
  see below).
- Limit acceleration and, if needed, jerk, so starts and stops are rounded.
- The body is a damped spring chasing a carrot that moves along the route:
  stiffness (omega) about 5.5-7 rad/s, damping ratio about 0.75-0.8. Its
  steady-state lag behind a carrot at speed v is about 2*zeta*v/omega, which is the
  inertia you see; the spring's own acceleration drives the rig.
- Window bounds are only a safety net (a clamp with almost no bounce); plan routes
  inside them instead.
- Destinations are **targets for steering**, not for a spring that grows with
  distance. A spring toward a far point produces a long, obviously straight, ever
  slowing line: that is the "A to B" look. Use arrival steering (desired speed
  proportional to remaining distance, capped) plus a lateral offset (below).

## 2. Curved trajectories

Straight lines read as machine paths. Give every trip a gentle arc:

- Add a lateral offset that rises and falls once over the trip (a half sine,
  amplitude about 8-15 % of the trip length, sign random), applied as a steering
  term perpendicular to the heading, not as a position offset. Or steer through one
  intermediate waypoint chosen off the straight line.
- Keep the heading change rate low (a gentle turn takes at least 0.8 s).
- Slow vertical bob on top (about 8-10 % of body height at roughly 0.5 Hz) fading
  in after the glide is established and out before the arrival.

## 3. Pose blending (the part that makes it a performance)

Keep a small set of **pose parameters**, each smoothed with its own time constant,
and never assign one directly:

| Parameter | Driven by | Notes |
|---|---|---|
| `lean` (roll, degrees) | low-passed lateral acceleration and, weakly, velocity | Hard cap: 12 deg while gliding, 18 deg at peak acceleration, angular speed below 60 deg/s. Never 60+ degrees. |
| `stretch` | speed along the heading | Volume preserving (scaleX x scaleY about 1). At most about 1.15 along the heading. |
| `squash` | anticipation and impacts | Wide and low before a launch, on landing and on a hard stop. Rebounds with overshoot. |
| `heading` | smoothed direction of travel | Expressed as a facing bias (eye gaze, crest side, a few degrees of lean), **not** as full rotation. |
| `travelWeight` | 0 idle, 1 fully travelling | Smoothed (time constant about 0.35 s). Idle breathing and blinking keep running underneath and are scaled by `1 - travelWeight`, never switched off. |

Rules of thumb:

- Transitions between idle and travel are eased in both directions. Entering a pose
  is as important as holding it.
- A stop is the mirror of a start: deceleration, then a small overshoot and settle,
  then idle breathing resumes.

## 4. Secondary motion (springs driven by acceleration)

Use a damped spring per part, driven by the **body's acceleration** (negative
sign: parts lag behind). One integrator, a few lines, run in the same frame loop.

| Part | Behaviour | Starting values (tune by eye, then measure) |
|---|---|---|
| Crest | Trails behind the acceleration, overshoots, wobbles twice, settles | natural frequency about 8-10 rad/s, damping ratio about 0.35-0.45 |
| Arms | Swing opposite to the acceleration, lift on launch, paddle in a glide | frequency about 10-12 rad/s, damping ratio about 0.45-0.55 |
| Halo | Lags the body by about 0.15 s, stretches slightly along the velocity | position time constant about 0.15 s |
| Gaze | Looks at the destination first (leads the head by about 0.2 s), then along the velocity; returns to idle gaze slowly | smoothed target, time constant about 0.2 s |

Secondary motion must fade out with the primary: the crest still wobbles a little
*after* the body has stopped. That tail is what stops it looking rigid.

## 5. Choreography tables

Durations are starting points taken from the reference (see
`reference-analysis.md`). Adjust to Omid's character, then verify over time.

### Jump

| Phase | About | Notes |
|---|---|---|
| Anticipation | 0.2 s | Squash (about 1.12 wide x 0.86 tall), crest dips, arms drop. Gaze looks up. |
| Launch and rise | 0.3 s | Fast, ease-out. Stretch tall (about 0.9 x 1.15). Crest trails below. Small motes kick up. |
| Open pose | 0.25 s | Arms spread, body widens, crest flares. A silhouette that reads in one frame. |
| Hang | 0.7-0.9 s | The longest phase. Almost still, sinking about 8-10 % of the jump height, small rocking. |
| Descent | 0.3 s | Ease-in, body upright, arms come in, stretch again. |
| Landing | 0.12 s | Compression (about 1.15 x 0.84), glow flares on the "ground", motes splash. |
| Settle | 0.4 s | Rebound with overshoot (about 0.97 x 1.05), crest wobble, breathing resumes. |

Jump height: about 1.5 body heights (more only with real room). Jump only where
there is clear room above him.

### Swim

| Phase | About | Notes |
|---|---|---|
| Gradual orientation | 0.5-0.8 s | `lean` and `stretch` ease in while he is still nearly still. Gaze turns toward the destination first. |
| Acceleration | 0.8-1.2 s | Gentle push to cruise speed. A small anticipatory dip opposite to the direction is welcome. |
| Sustained glide | as long as the distance needs | Roughly constant speed, a screen width in about 4 s on a TV, slower on a phone. Gentle arc, bob, arm paddle, crest streaming behind, a faint light trail. |
| Deceleration | 1.0-1.5 s | Arrival steering. Lean eases out *before* the stop, crest overshoots forward. |
| Settle | 0.5 s | Small overshoot, return to idle pose, breathing resumes. |

Omid has one body, so **do not rotate him 60-90 degrees**. Build the swim posture
from a modest lean (10-18 deg), stretch along the heading, trailing crest, arms
paddling and the light trail.

### Floating / drift (the calm default)

- Long glides with arrival steering, long rests, almost no pose change.
- Quiet is the baseline: at least 70 % of the time he only breathes and blinks.
- A deliberate moment (a float, a swim, a jump) roughly every 20-45 s, never two
  strong ones back to back.

## 6. Staging entries, exits and repositioning

- Prefer **no off-screen travel at all**. A path that stays on screen never needs
  an excuse.
- If he leaves through an edge, he must keep moving off-screen for a believable time
  (at least the time the distance would take) and return from an edge with a clear
  reason: a different height, a different pose, a different speed. No instant jump to
  the opposite edge with a velocity reset.
- Anything that has to reposition him invisibly does it while he is fully
  off-screen *and* keeps position and velocity continuous in the frame it resumes.

## 7. Environment answers him

He must feel part of the scene (the reference's strongest cue is the ripples).
Cheap ideas, each driven from the same frame loop or from CSS variables set once
per frame at most:

- A light **wake**: a few small glowing HTML rings or dots left along his path that
  fade over about 1.5 s (a pool of 6-8 recycled elements, not new nodes).
- The seconds/minutes/hours **beads** brighten slightly while he is close.
- Nearby **motes** drift aside or brighten as he passes.
- On a jump landing, a soft **ground glow** flare that spreads and fades.
- The dial's rings could ripple very faintly when he crosses them.

Budget: at most about 8 extra animated elements, transform and opacity only, none
that need layout.

## 8. Constraints that stay (from CLAUDE.md)

- Countdown legible and the visual priority; no overlap that hurts legibility.
- `src/lib` and `src/hooks` untouched unless asked; no new dependencies without
  asking; no commits without being asked.
- One frame loop, writes only transforms and opacity to a handful of refs, no React
  state per frame, sleeps when idle, stops when hidden, absent under reduced motion.
- Reduced motion: no loop, no travel, no jump; a composed static pose.
- Phone, desktop and TV share one layout; measure at each; weak devices matter.

## 9. Failures to avoid (learned from the first attempt)

These all happened and were visible in the recording:

1. Moving a rigid SVG with `translate` and `rotate` only. Nothing inside it moved
   differently from the whole.
2. A swim that was a 64-degree rotation plus a translation. It read as a sprite sliding.
3. Switching a swim attribute on and off. The pose changed with a transition but
   began and ended abruptly relative to the motion underneath it.
4. Wrapping from one edge to the other instantly, and resetting the vertical velocity at
   the wrap.
5. A spring that pulled him in a straight line to a target; starts, turns and stops were
   mechanical and obvious.
6. Fading opacity as a stand-in for being "behind" things.
7. Jump keyframes with a fixed height regardless of where he was, so the hang
   happened behind the digits.
8. Secondary motion that was idle-only (breathing, sway) and did not respond to the
   movement.
9. A static scene that did not react to him at all.

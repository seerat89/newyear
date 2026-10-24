# Verifying motion in the running browser

Still screenshots cannot show whether motion is natural. A frame can look fine
while the move jerks, snaps or stops dead. Judge **transitions over time**, with
numbers *and* with frame strips, and compare against the reference.

Tools: the `playwright-cli` skill (installed in `.claude/skills/playwright-cli`)
and the scripts in `scripts/`. Playwright's own outputs land in `.playwright-cli/`
(git-ignored). Scratch files go in the session scratchpad, not in the repo.

## 0. Serve the app

```bash
npm run build && npx vite preview --port 4173      # production build, closest to real
# or: npm run dev
```

## 1. Open at each size

Check at least phone, small phone, desktop and TV. Resize rather than reopening:

```bash
playwright-cli open http://localhost:4173/
playwright-cli resize 390 844      # phone
playwright-cli resize 320 568      # small phone
playwright-cli resize 1440 900     # desktop
playwright-cli resize 1920 1080    # TV
```

Reload after resizing (`playwright-cli reload`) when the code measures the page at
mount.

## 2. Record the movement numerically

```bash
playwright-cli eval "$(cat .claude/skills/omid-motion/scripts/track_sampler.js)"
playwright-cli eval "window.__track.start({ body: '.omid-root', crest: '.omid-crest-pose', armL: '.omid-arm-pose-l' })"
# trigger or wait for the move; for a known action:
playwright-cli eval "(()=>{const o=document.querySelector('.omid'); o.dataset.dir='r'; o.dataset.action='jump'})()"
# ...wait for the move to finish...
playwright-cli eval "window.__track.stop()"
playwright-cli --raw eval "JSON.stringify(window.__track.data)" > track.json
python .claude/skills/omid-motion/scripts/analyze_track.py track.json --series body
```

Notes:

- In this repo you can start a named behaviour deterministically:
  `window.dispatchEvent(new CustomEvent('omid-behave', { detail: 'jump' }))` (names:
  meadow, lantern, fly, glide, cross, jump, float, lookout). `data-behaviour` on
  `.scene` shows which behaviour is playing (absent when none), so a script can wait
  for it to finish. If the attribute stays absent the behaviour did not fit at this
  size (for example `fly` on a phone has no open sky).
- Useful selectors: `.scene-omid-body` (pure body translation, use this for speed and
  smoothness), `.omid-action` (lean and squash/stretch), `.omid-crest-pose`,
  `.omid-arm-pose-l`, `.omid-halo`, `.omid-root`.
- Selectors depend on the current markup. Open the file and adjust. Name every moving
  part you care about (body, crest, arms, halo, gaze group).
- Triggering with `dataset.action` bypasses the scheduler's safety checks. That is
  fine for looking at a move, but also watch the *scheduled* behaviour for a few
  minutes with the real timers.
- Samples are taken per animation frame. Headless Chrome can run at 150+ fps, so use
  the real time stamps (the analyzer does).
- `--series body` matters: the rotation and scale limits are for the whole body.
  Crest and arms are expected to rotate more; read their rows for continuity and
  overshoot, not for those limits.

What the numbers tell you (and do not):

| Output | Look for |
|---|---|
| `ramp_up_s`, `ramp_down_s` | Starts and stops that take a visible time. Very small values are snaps. |
| `max_speed_step_vs_peak` | One-frame jumps in speed: teleports, resets, or keyframes meeting at a corner. |
| `max_heading_rate_deg_s`, `straightness` | Sharp turns; a straightness of about 1.0 over a long path is a ruler line. |
| `rotation_range_deg`, `rotation_peak_rate_deg_s` | The body spinning more than a gentle lean. |
| `rms_jerk_px_s3` | Only meaningful as a comparison between iterations. Lower is smoother. |

A clean report only rules out mechanical failures. It does not mean the motion is
good. The strips below are the real test.

## 3. Record video and read it as strips

```bash
playwright-cli video-start move.webm --fps=60
# trigger the move, wait for it to finish
playwright-cli video-stop
python .claude/skills/omid-motion/scripts/contact_sheet.py move.webm --start 0 --duration 4 --fps 12 --width 260 --cols 8 --rows 5 --out sheets/move
```

Then sheet the **reference segment for the same kind of move** with the same
settings and look at both sheets one after the other (use the Read tool on the
JPEGs):

```bash
python .claude/skills/omid-motion/scripts/contact_sheet.py .references/omid-animation-reference.mp4 --start 18.2 --duration 2.4 --fps 12 --crop 340:480:830:150 --width 260 --cols 8 --rows 5 --out sheets/ref_jump
python .claude/skills/omid-motion/scripts/contact_sheet.py .references/omid-animation-reference.mp4 --start 16 --duration 7 --fps 7 --crop 340:420:1190:100 --width 230 --cols 9 --rows 6 --out sheets/ref_swim
```

Questions to answer while reading a strip, frame by frame:

1. **Phases.** Can you point to each phase (anticipation, launch, pose, hang, descent,
   landing, settle) and see its share of the total time? For the jump, does the hang
   take about a third of it?
2. **Silhouette per phase.** Does the shape change (squash, stretch, open pose), not
   only the position?
3. **First and last frames.** Does anything move before the anticipation? Does the last
   frame jump to idle, or does it ease there?
4. **Continuity.** Between neighbouring frames is the displacement growing and shrinking
   smoothly, or does it change by a lot in one step?
5. **Rotation.** Is the body orientation restrained, and does it lead into and out of
   the move?
6. **Secondary motion.** Do the crest, arms, halo and gaze lag and overshoot, and keep
   moving a little after the body stops?
7. **Environment.** Did anything in the scene respond?
8. **Content.** Is the countdown still legible throughout?

## 4. Reduced motion and idle

```bash
playwright-cli set-reduced-motion reduce
playwright-cli reload
# wait; confirm nothing moves (transform stays empty, no animation frames requested)
playwright-cli clear-reduced-motion
```

At rest, confirm the frame loop sleeps: count `requestAnimationFrame` calls over
a few seconds with no move active, and again after `document.hidden` is set (a
visibility change) to confirm the loop stops.

## 5. Weak devices

Frame pacing matters more than averages. Frame-gap p95 and the maximum come from the
analyzer; for a weak-device check throttle the CPU in the same session, for example:

```bash
playwright-cli run-code "async page => { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }) }"
```

(Not yet exercised in this project's setup. If it errors, say so in the report and use the
headless frame-gap numbers with that caveat.)

## 6. Iterate, then report

Loop: record -> analyze -> read the strips -> name the single biggest problem ->
change it -> record again. Stop when the strips read like the reference's phases
and the numbers are clean. In the report, give: what was checked at which sizes,
the numbers before and after, which strips were compared, what is still weak. If
the motion looks mechanical in the strips, it is not done, whatever the numbers say.

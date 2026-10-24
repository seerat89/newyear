# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

New Year countdown app scaffolded from the Vite React + TypeScript template. The template demo has been removed. The visual identity is **Midnight City** (static art, ambient CSS motion): a rich midnight-blue and plum sky with a restrained dark-red band and a warm gold glow of distant celebration light, silver-blue moonlight haze, stars, a pale hazy far city, a lit nearer city with a landmark tower, and a bay with the city's golden reflections, out-of-focus lights and a garland of festoon lights across the foreground. The countdown is set in the sky in cream Fraunces. The scene lives in [src/components/scene/](src/components/scene/): `scenes.ts` holds **four separately composed pieces of art** (phone, tablet, desktop, TV; coordinates are data: glow, shore, skyline envelope, Omid's lookout, the spot where a distant firework flashes, motes and Omid's stops), `SceneArt.tsx` draws one as static SVG in four layers (far, mid, ground, near; near sits in front of Omid), `Stars.tsx` is a star field that thins towards the horizon, `Fireworks.tsx` adds a few faint far-away bursts at the sides (CSS, one at a time, hidden under reduced motion), and `Scene.tsx` stacks sky, stars, fireworks, art, Omid and a vignette. [src/index.css](src/index.css) switches compositions by media query (phone < 480 px portrait, tablet portrait, landscape desktop, landscape >= 1600 px TV) using `--stage-*`, `--horizon-y`, `--hero-*` and `--num` variables; the stage is capped by screen height so short screens get a smaller centred stage (the city and water run on past it). Colours are semantic CSS tokens (`--theme-*`, midnight values only; no runtime theme switching). The display font Fraunces is self-hosted in [public/fonts/](public/fonts/) (OFL, see its README; roman plus an italic used only if the italic unit labels are chosen). The old Dawn Ridge hills, road and lantern, the orbit dial, backdrop layers and eyebrow heading were retired.

Omid, the mascot (a round glowing spirit), lives in [src/components/omid/](src/components/omid/): layered SVG with a dim and a bright fill stacked by glow level, micro-idle (breathing, one long irregular-blink keyframe, halo, faint crest and arm sway) as CSS keyframes tuned by `--omid-energy`, and pure mood helpers in `omidState.ts`. He rests on the shore in front of the city in each composition, large and part of the scene.

**All of his major movement goes through one motion system** (follow the `omid-motion` project skill for any change): the pure modules in [motion/](src/components/omid/motion/) plus the one frame loop in [useOmidMotion.ts](src/components/omid/useOmidMotion.ts). The director (`director.ts`) picks a behaviour from a shuffled bag every ~10-25 s (visit the drifting motes, watch a distant firework, fly, glide, cross, jump, float, return to his resting place) and turns it into steps (travel, hold, jump) with a destination, gaze and scene effect; routes are curved Beziers or rounded corners that avoid the countdown (`path.ts`). A travel step moves a carrot along the route on a smooth speed profile (`profile.ts`); his body is a damped spring chasing the carrot, so starts, turns and stops have inertia, lag and a small overshoot. The rig (`rig.ts`) turns the body's velocity and acceleration into lean (capped), squash and stretch, crest and arm lag, halo lag and gaze; the jump (`jump.ts`) follows the reference phases (crouch, kick, rise, star-pose hang, fast drop, landing, settle). The scene answers him: the warm motes gather or scatter (`fireflies.ts`), a warm light pool follows him over the water, a faint trail follows big moves, the distant firework flashes when he stops to watch it (the `.lantern-flare` element), and the far and ground/near layers drift a little (parallax). The loop writes only transforms and opacity, never re-renders React, sleeps when nothing is moving, stops while the tab is hidden and does not run under reduced motion (he rests in his place). `window.dispatchEvent(new CustomEvent('omid-behave', { detail: 'jump' }))` starts a named behaviour (used by tests) and `data-behaviour` on `.scene` shows which one is playing. Motes, out-of-focus lights, stars and the far-away fireworks drift or pulse as ambient CSS.

Animation is CSS or transform+opacity only and reduced-motion aware. There is no fireworks, midnight sequence, or curated message content yet.

Countdown logic is pure and lives in [src/lib/countdown.ts](src/lib/countdown.ts): `getCountdownState(now)` returns one of three phases by local date: `celebrating` (January 1), `afterglow` (January 2–7, also exposes a secondary countdown to the next New Year), or `counting` (January 8 onward, with the upcoming `year` and remaining time to the next January 1). All functions take `now` as a parameter, so they are unit-testable later. [src/hooks/useNow.ts](src/hooks/useNow.ts) is the only place that reads the clock for the UI.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then `vite build`
- `npm run lint` — Oxlint (config in [.oxlintrc.json](.oxlintrc.json): react, typescript, oxc plugins)
- `npm run preview` — serve the production build

No test runner is configured.

## Stack notes

- React 19, TypeScript 6, Vite 8 with `@vitejs/plugin-react`. Linting is Oxlint, not ESLint.
- Tailwind v4 is enabled via the `@tailwindcss/vite` plugin in [vite.config.ts](vite.config.ts), and [src/index.css](src/index.css) only contains `@import "tailwindcss";`. `motion` is installed but not yet used.
- TypeScript config is split into project references ([tsconfig.app.json](tsconfig.app.json) for `src`, [tsconfig.node.json](tsconfig.node.json) for Vite config), hence `tsc -b` in the build.

## Product direction

This is a public New Year countdown PWA designed for both phones and large TV/fullscreen displays.

The core experience should remain simple:

- accurate local New Year countdown
- polished animated phone experience
- polished TV/fullscreen experience
- elegant midnight celebration sequence
- occasional curated funny or inspirational resolution/message
- shareable New Year message/story image
- optional world New Year context/map later
- PWA installation and offline support
- SEO-friendly public pages
- push notifications later if required

The initial release is for Gregorian New Year only.

Future celebrations such as Nowruz may reuse parts of the architecture, but do not build a generic celebration framework unless explicitly requested.

## Product scope rules

Keep the product intentionally focused.

Do not add:

- accounts or authentication
- profiles
- chat
- party rooms
- joining codes
- audience-submitted content
- photo/selfie uploads
- social-network features
- a backend unless explicitly requested
- unnecessary dependencies or infrastructure

Do not implement future roadmap items while working on the current task.

## Architecture principles

- Keep countdown and date/time logic separate from presentation components.
- Calculate countdown state from absolute timestamps rather than decrementing a counter.
- Components should remain small and focused.
- Prefer React state and browser APIs over introducing global state libraries.
- Avoid abstractions until there is a concrete need for them.
- Do not add dependencies without explaining why the existing stack is insufficient.
- Keep future phone and TV layouts driven by the same underlying countdown logic.
- Keep visual/theme data separable from core timing logic where practical.

## Visual direction

The experience should feel alive even when the user is simply watching the countdown.

Visual direction:

- elegant dark midnight theme
- restrained gold accents
- expressive typography
- ambient animated elements
- subtle stars, particles, balloons, fireworks, or similar celebratory objects
- occasional playful animated message reveals
- a more dramatic but polished midnight sequence

Waterllama is inspiration only for the principle of an animated, lively main screen. Do not copy its artwork, characters, layouts, or visual identity.

Animations should support the countdown rather than distract from it.

During the final countdown, the numbers should remain the visual priority.

## Responsive experience

Design from the beginning for:

- mobile phones
- tablets/desktop
- 16:9 television/fullscreen displays

TV mode should not become a separate application unless there is a strong technical reason.

Avoid layouts that only look correct at one viewport size.

## Animation and accessibility

- Use Motion for React for UI transitions and interactive motion where appropriate.
- Prefer CSS/SVG for lightweight ambient animation.
- Do not introduce WebGL/Three.js unless a requirement genuinely needs it.
- Respect `prefers-reduced-motion`.
- Important information must remain understandable when animation is disabled.
- Maintain sufficient text contrast and readable countdown typography.
- Avoid excessive flashing or rapid animation.

## SEO

SEO is a first-class requirement.

Public landing pages must eventually provide crawlable semantic content, metadata, canonical URLs, sitemap support, and year-specific search targeting.

The interactive countdown must not prevent search engines from accessing useful page content.

Do not choose an SEO implementation yet unless the current task requires it.

## PWA

The app will eventually be installable and usable offline where practical.

Do not add PWA tooling until that phase is explicitly started.

The countdown itself should remain functional offline using local time data.

Background push notifications are a later backend-dependent feature and should not be simulated with unreliable long-running browser timers.

## Content

Funny New Year resolutions and inspirational messages should initially come from a curated collection.

Content must be:

- harmless
- broadly relatable
- non-offensive
- non-political
- non-discriminatory
- free from jokes targeting protected or vulnerable groups

Regional content, if added later, must be opt-in rather than automatically assumed from a user's location.

## Efficiency

Use the minimum work needed to complete the requested task.

- Do not re-analyse reference files unless the task specifically requires it.
- Do not repeat previously established design or motion analysis.
- Do not run exhaustive Playwright checks for small changes.
- For normal UI changes, check only the most relevant phone and TV sizes unless broader responsive verification is requested.
- Do not generate contact sheets, traces, recordings, or performance profiles unless they are needed to answer a specific question.
- Do not inspect unrelated files.
- Do not refactor unrelated code.
- Keep implementation reports concise: what changed, tests run, important caveats.
- Use installed skills as guidance, not as a requirement to perform every workflow step on every task.
- If a task is visually small, prefer a targeted implementation and targeted verification.

## Token and Context Budget

Be economical with context and tool usage.

- Prefer targeted reads over broad repository exploration.
- Do not reread files that were already inspected unless they may have changed.
- Do not repeatedly re-open screenshots, reference videos, or design documents unless needed for the current decision.
- Do not run multiple visual-verification methods for the same change.
- Do not use subagents unless the task genuinely benefits from parallel independent work.
- Do not invoke skills that are irrelevant to the current task.
- Avoid long internal exploration when a reasonable implementation path is already clear.
- Make one focused attempt, verify it, and report.
- If a task can be completed with one or two targeted checks, do not perform a full audit.

## Development workflow

Before changing code:

1. Inspect the relevant files.
2. Understand the existing implementation.
3. Make the smallest reasonable change for the requested task.
4. Avoid unrelated refactoring.

After changing code:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Report which files changed.
4. Report any warnings, failures, compromises, or follow-up items.
5. Do not commit unless explicitly requested.

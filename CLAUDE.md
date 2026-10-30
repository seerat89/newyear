# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

New Year countdown app scaffolded from the Vite React + TypeScript template. The template demo has been removed. The visual identity is **Midnight City** (static art, ambient CSS motion): a rich midnight-blue and plum sky with a restrained dark-red band and a warm gold glow of distant celebration light, silver-blue moonlight haze, stars, a pale hazy far city, a lit nearer city with a landmark tower, and a bay with the city's golden reflections, out-of-focus lights and a garland of festoon lights across the foreground. The countdown is set in the sky in cream Fraunces. The scene lives in [src/components/scene/](src/components/scene/): `scenes.ts` holds **four separately composed pieces of art** (phone, tablet, desktop, TV; coordinates are data: glow, shore, skyline envelope, Omid's lookout, the spot where a distant firework flashes, motes and Omid's stops), `SceneArt.tsx` draws one as static SVG in four layers (far, mid, ground, near; near sits in front of Omid), `Stars.tsx` is a star field that thins towards the horizon, `Fireworks.tsx` adds a few faint far-away bursts at the sides (CSS, one at a time, hidden under reduced motion), and `Scene.tsx` stacks sky, stars, fireworks, art, Omid and a vignette. [src/index.css](src/index.css) switches compositions by media query (phone < 480 px portrait, tablet portrait, landscape desktop, landscape >= 1600 px TV) using `--stage-*`, `--horizon-y`, `--hero-*` and `--num` variables; the stage is capped by screen height so short screens get a smaller centred stage (the city and water run on past it). Colours are semantic CSS tokens (`--theme-*`, midnight values only; no runtime theme switching). The display font Fraunces is self-hosted in [public/fonts/](public/fonts/) (OFL, see its README; roman plus an italic used only if the italic unit labels are chosen). The old Dawn Ridge hills, road and lantern, the orbit dial, backdrop layers and eyebrow heading were retired.

Omid, the mascot (a round glowing spirit), lives in [src/components/omid/](src/components/omid/): layered SVG with a dim and a bright fill stacked by glow level, micro-idle (breathing, one long irregular-blink keyframe, halo, faint crest and arm sway) as CSS keyframes tuned by `--omid-energy`, and pure mood helpers in `omidState.ts`. He rests on the shore in front of the city in each composition, large and part of the scene.

**All of his major movement goes through one motion system** (follow the `omid-motion` project skill for any change): the pure modules in [motion/](src/components/omid/motion/) plus the one frame loop in [useOmidMotion.ts](src/components/omid/useOmidMotion.ts). The director (`director.ts`) picks a behaviour from a shuffled bag every ~10-25 s (visit the drifting motes, watch a distant firework, fly, glide, cross, jump, float, return to his resting place) and turns it into steps (travel, hold, jump) with a destination, gaze and scene effect; routes are curved Beziers or rounded corners that avoid the countdown (`path.ts`). A travel step moves a carrot along the route on a smooth speed profile (`profile.ts`); his body is a damped spring chasing the carrot, so starts, turns and stops have inertia, lag and a small overshoot. The rig (`rig.ts`) turns the body's velocity and acceleration into lean (capped), squash and stretch, crest and arm lag, halo lag and gaze; the jump (`jump.ts`) follows the reference phases (crouch, kick, rise, star-pose hang, fast drop, landing, settle). The scene answers him: the warm motes gather or scatter (`fireflies.ts`), a warm light pool follows him over the water, a faint trail follows big moves, the distant firework flashes when he stops to watch it (the `.lantern-flare` element), and the far and ground/near layers drift a little (parallax). The loop writes only transforms and opacity, never re-renders React, sleeps when nothing is moving, stops while the tab is hidden and does not run under reduced motion (he rests in his place). **Touch, pointer and mouse:** the same loop lets him be picked up (Pointer Events with capture; only his painted shapes take the pointer, via `data-omid-touch` on `.scene`, which is off under reduced motion). A tap (< 6 px of movement) runs the existing `jump`; a drag suspends the director and sends the carrot to the pointer (clamped to the layout bounds, softer spring so the rig leans him), `data-dragging` is set while held, and on release he settles where he was dropped and the director resumes after 6-10 s. Per move only the target is stored (no React state, no layout reads); the dropped position is not saved. `window.dispatchEvent(new CustomEvent('omid-behave', { detail: 'jump' }))` starts a named behaviour (used by tests) and `data-behaviour` on `.scene` shows which one is playing. Motes, out-of-focus lights, stars and the far-away fireworks drift or pulse as ambient CSS.

**Performance** (`styles/performance.css`, imported last): while Omid is held (`data-dragging` on `.scene`) only the slow loops inside the big city SVG layers are paused (snow, stars and the rest keep moving), the hidden map's loops are paused on the countdown page, and on phones (`max-width: 600px`, or touch up to 960 px) the SVG-internal loops (windows, reflections, bokeh, horizon glow, tree lights) hold still, star twinkles use opacity instead of a filter, the film grain, tree glow filter and small-control backdrop blurs are dropped and about a third of the snow is hidden (`.fl-extra`). Desktop and TV are unchanged. Animating inside a big SVG (not just HTML) repaints the whole SVG each frame, so prefer HTML/CSS elements for new ambient loops.

Animation is CSS or transform+opacity only and reduced-motion aware. There is no curated message content yet.

**Midnight celebration sequence** ([src/components/celebration/](src/components/celebration/), pure timing in [src/lib/celebration.ts](src/lib/celebration.ts)): `getCelebration(state, now)` derives a stage from time alone: `show` for the first 32 s of January 1, `sustain` until 17 min (a long, thinning display generated by `sustainedScript.ts` from a seeded sequence, with a volley and a willow every few minutes and an Omid jump at each volley; `useSustainedBursts` keeps only the live bursts in the page), `settle` for the last minute, then null (the ordinary January 1 state), so a page opened late joins wherever the night has got to. `MidnightShow` (mounted by `Scene` while a stage exists) plays a flash, a horizon bloom and a composed show (`showScript.ts`: a grand opener, a ~10 s peak of mirrored pairs, a palm, a sweep and a salvo ending in a great willow, then a thinning tail; major bursts also wash the skyline and ripple the water via `MidnightPulse`, which also adds a light pulse and sparse foreground sparks) (the CSS burst styles in `index.css`, played once, offsets from midnight via negative delays); `data-celebrate` on `.scene` brightens windows, reflections and the horizon glow and adds an aura on Omid's body; `useOmidCelebration` makes Omid jump at set times through the existing `omid-behave` event (no motion-system change); `NewYearMessage` reveals "Happy New Year" and the year. On wide landscape screens (>= 900 px) the show is bigger: extra `tv` bursts in three depths fill the sky with an accelerating crescendo, reflections and the skyline lift more, the year is larger, more foreground sparks and streaks drift, and Omid travels through the scene (cross, fly, glide, a final jump, then home) via `omid-behave`; phones keep the quieter backbone. To watch the sequence in development without waiting, a local-only, git-ignored file `src/dev/devClock.ts` (loaded by `main.tsx` in dev only; absent from clones and builds) can patch `Date.now` from a `?at=2026-12-31T23:59:50` URL: `const start = new Date(new URLSearchParams(location.search).get('at') ?? '').getTime(); if (!Number.isNaN(start)) { const real = Date.now.bind(Date), off = start - real(); Date.now = () => real() + off }`. Under reduced motion there is no animation, only a calm static glow.

**Design pass (palette and map):** the sky tokens are ink-navy to cobalt with a single warm gold horizon (no plum or rose); the map scene fades the city sky to a calm deep-navy backdrop with only stars, draws the map frameless, uses colour with meaning (waiting = slate blue, arrived = amber, celebrating = bright white-gold, next = one cool aqua accent) and groups the status, key and buttons in one glass dock (`.wm-dock`) with the time-lapse as the single primary button.

**World Map** ([src/components/worldmap/](src/components/worldmap/), pure logic in [src/lib/worldTime.ts](src/lib/worldTime.ts)): two separate fullscreen scenes with no page scrolling (`html, body` overflow hidden; `.app` fixed, `data-scene` = `map` | `countdown`): the World Map scene (map only, no countdown) and the Countdown scene (hero + city + celebration, unchanged). `App.tsx` never overrides the viewer's choice (`SceneSwitch` switches manually, the countdown is the default); its one automatic move is to the Countdown when the viewer's local midnight is 5 minutes away (`lib/autoView.ts`, window -5 to +20 min; the viewer can switch back). The scene (sky, stars, the scene's Omid) is one fixed layer under both; in the map scene the city art fades and the scene stage is raised above the map (z-index 25, above the dock; the dock is pinned to the bottom of the page), so Omid roams the whole page as in the countdown scene and is never hidden. The dock has a fixed height (both status lines always laid out, one-line ellipsis, fixed button row) so the map never jumps. The map has its own glowing beacon star on the frontier (Omid is not the marker); when midnight reaches a new place while the map is on screen, Omid gets an `omid-behave` `glide` (at most every 6 s). `places.ts` lists about 100 cities, one per time zone (countries with several zones appear once per zone), each with an IANA zone; `worldTime.ts` finds each zone's New Year instant from the browser's own `Intl` time zone database (so daylight saving and :30/:45 offsets are right) and its status (`waiting`, `celebrating` for the first hour, `arrived`); the map year is `getWorldYear(now)` (the wave runs UTC+14 to UTC-12, and the year stays on screen for a day after it ends). Land is a coarse halftone from Natural Earth 1:110m (public domain, `landMask.ts`, generated once; no map library), and every land dot takes the status of the nearest place, which approximates zone borders. Selecting a place (tap the map or use the list) shows its local time and status; the next place(s) to reach midnight are highlighted. A glowing frontier line with a warm wake of light behind it shows where midnight is arriving (`frontier.ts` groups places by the instant they begin the year and glides between the groups in step with the clock), with the beacon star riding it. The view is one screen with no scrolling: the map is the focus, with two quiet status lines (just rang in, next to midnight), a small legend, and two small buttons (the time-lapse, and a collapsible place picker that opens a panel with the selected place's local time and status); on portrait screens the map is wider than its window and slides to keep the frontier in view; a small dev-only "Time-lapse (dev)" button in the top-left corner plays the whole night as a 26 s time-lapse; it is a development aid shown only in `npm run dev` (`import.meta.env.DEV`), not in production builds. The place picker is a searchable combobox (`PlaceSearch.tsx`, accent-insensitive, arrow keys/Enter/Escape); the legend uses a different shape per state (disc, sparkle, triangle, hollow ring), not colour alone. **New Year atmosphere** (normal mode only, `scene/Atmosphere.tsx` + the `.atmo*` CSS): a violet-and-gold horizon haze, slow gold and blue bokeh, soft blurred foreground lights, rising gold dust, glints on the water, a darker textured lower third and a faint warm aura round Omid; hidden under reduced motion, and the haze, glints and lower third fade out on the map page. No snow, scarf, cassette or festive items.

**Christmas mode:** `lib/season.ts` `getSeason(now, tz)` returns `christmas` for local December 24-26 (the chosen city's zone, else the device's); it returns to normal on December 27. App sets `data-season` on `.app`: warmer sky tokens, heavy layered snow (`scene/Snow.tsx`: ~240 CSS flakes in far, mid and soft near depths, six-armed crystals that turn, golden bokeh; hidden under reduced motion) over a static snowscape (`scene/SnowScape.tsx`: snow-laden pines with twinkling warm lights at both edges and drifts along the bottom; the trees are hidden on a phone's map page) and a cloud bank along the horizon, a scarf on Omid (`.omid-scarf` in `Omid.tsx`, shown only in Christmas), Omid's cassette player (`scene/Cassette.tsx`) rests beside him all year: a cream-and-red portable player with a window and reels, speaker grille, chunky top keys, side knob and a warm glow; Christmas only decorates it in CSS (snow, holly, scarf). Tapping it fires `omid-behave` `jump`, and it hops when he jumps; it is hidden on the map scene. Now and then (every ~35-70 s, only on the countdown scene, never under reduced motion) a routine plays through the existing `omid-behave` events: Omid goes to his resting place beside it (`lookout`), then inspects it, nudges it, listens, dances or makes a little magic (glow and sparkles), with notes rising. A round music button (`MusicToggle.tsx`, beside the bottom Countdown / World Map switch inside `.bottom-bar`; `hooks/useMusic.ts`, `newyear.music` in localStorage, **on unless the viewer switched it off**) keeps the reels turning and notes drifting, and lets the midnight recording play by itself: `public/audio/midnight-sequence.mp3` (about 4 min) is played by `hooks/useMidnightAudio.ts`, starting `AUDIO_MIDNIGHT_S` (36 s: the spoken ten-second countdown starts 26 s into the file and "Happy New Year" 36 s in) before the viewer's midnight, so the spoken 10 is at T-10 and "Happy New Year" lands on T=0 with the celebration (`lib/midnightAudio.ts`). It is slaved to the clock: a page opened late joins at the right second and it is re-checked every 200 ms and put back if it drifts more than 0.12 s. Browsers may refuse sound without a gesture (kiosk flag, installed app or a site allowed to play sound lets it start alone); then the first tap or key press (any remote button) starts it at the right place and Omid shows a small speech bubble ("Want sound for the countdown? Tap anywhere once.", `hooks/useSoundNudge.ts`, `soundNudge` string): once about 10 s after load, once more when midnight is under 5 minutes away, and while the recording is held back; any tap or key ends it for the visit. In Christmas mode the same music switch plays the four tracks in `public/audio/christmas/` as a shuffled playlist (`hooks/useChristmasMusic.ts`, `lib/christmasMusic.ts`; next track on its own, never the same one twice in a row, source dropped when Christmas mode ends; not precached, requested only then; credits in `docs/audio-sources.md`). When the midnight recording starts, `App.tsx` also moves a viewer on the map to the countdown. **Sync of the visuals:** `useNow` ticks on whole multiples of 250 ms of the clock, the show is put in the page 4 s before midnight (`SHOW_PREROLL_MS` in `App.tsx`; its CSS delays are in the future) and `useOnTheDot` re-bases its animations to the moment the delays were read, so the first flash is within a frame of midnight instead of ~0.5 s late. There is no per-firework sync: the generated sustained display (`sustainedScript.ts`) is liveliest in the first minute and clearly calmer by the time the recording ends (about 204 s after midnight), then keeps thinning. The service worker keeps the recording in its own `media-1` cache (not precached; stored on first use, range requests answered from it); rename that cache if the file is replaced. **Language:** one setting drives all visible text (`lib/locale.ts`: 25 languages, the browser's language by default (Norwegian nb and nn map to `no`), English fallback, the viewer's choice remembered as `newyear.lang`; sets `<html lang dir>`; in dev `?lang=fi` previews one). `lib/greetings.ts` holds Merry Christmas / Happy New Year per language (the year stays beside it) and `lib/strings.ts` holds the interface strings (`useT()` returns `t(key, params)`; missing keys fall back to English; span unit letters come from `abbr`). `LanguageSelect` is the first row of the corner menu (a speed-dial style button, bottom right, that opens Language, About, Privacy and Terms upward). City and country names and the About, Privacy and Terms pages are not translated yet. Arabic and Persian use right-to-left text direction, while the scene, countdown and map stay left to right. To add a language, add a row to all three files. Test with `?at=2026-12-24T20:00:00`.

**Location and small pages:** the countdown follows the viewer's chosen city (`hooks/useCity.ts`, owned by App; `getCountdownState(now, tz)` and `getNewYearWindow(now, tz)` take an optional IANA zone) and falls back to the browser's time zone when none is chosen; a caption "Midnight in <city>" shows on the countdown scene when a city is set. On the map, the viewer can search a city or tap "Or use my location" (`navigator.geolocation`, optional, never blocking; on denial a message points back to the search); the position is only used to pick the nearest listed city and is not stored. The chosen city (name only) is remembered in `localStorage` under `newyear.city` (`worldmap/savedCity.ts`) and can be cleared with "Clear". About, Privacy and Terms (`components/InfoPage.tsx`, with the bottom-right corner menu in `CornerMenu.tsx`; hash routes `#about`, `#privacy`, `#terms` via `hooks/usePage.ts`, no router) open as a full-screen page over the app, linked from that corner menu; keep their copy factual and update Privacy if analytics, cookies or any server storage are ever added. The countdown, celebration and the scene's Omid are unchanged.

Countdown logic is pure and lives in [src/lib/countdown.ts](src/lib/countdown.ts): `getCountdownState(now)` returns one of three phases by local date: `celebrating` (January 1), `afterglow` (January 2–7, also exposes a secondary countdown to the next New Year), or `counting` (January 8 onward, with the upcoming `year` and remaining time to the next January 1). All functions take `now` as a parameter, so they are unit-testable later. [src/hooks/useNow.ts](src/hooks/useNow.ts) is the only place that reads the clock for the UI.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then `vite build`
- `npm run lint` — Oxlint (config in [.oxlintrc.json](.oxlintrc.json): react, typescript, oxc plugins)
- `npm run preview` — serve the production build

No test runner is configured.

## Stack notes

- React 19, TypeScript 6, Vite 8 with `@vitejs/plugin-react`. Linting is Oxlint, not ESLint.
- Tailwind v4 is enabled via the `@tailwindcss/vite` plugin in [vite.config.ts](vite.config.ts), and [src/index.css](src/index.css) is the entry file: `@import "tailwindcss";` then the feature files in [src/styles/](src/styles/) (base, theme, layout, scene, countdown, accessibility, omid, celebration, world-map, legal, christmas, cassette, atmosphere, language), imported in cascade order, so keep that order when adding a file. `motion` is installed but not yet used.
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

The app is installable and launches offline after one online visit. `public/site.webmanifest` (standalone, `start_url` `/`) and the icons in `public/` are the install package; `public/sw.js` is a small hand-written service worker registered by `src/pwa.ts` (production builds only). `vite.config.ts` (the `serviceWorker` plugin, no PWA library) fills in its precache list (every built file) and a build id hashed from the contents, so each deploy has its own cache: pages are network-first (never stale when online, cached copy offline or after 4 s), everything else comes from the cache, and a new build takes over at once and deletes the old cache. Hash pages and the language, city and music preferences are unaffected. No push, no background sync.

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

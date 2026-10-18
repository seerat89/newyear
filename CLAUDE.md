# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

New Year countdown app, freshly scaffolded from the Vite React + TypeScript template. [src/App.tsx](src/App.tsx) is still the unmodified template demo (counter, Vite/React links); the countdown itself has not been built yet.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then `vite build`
- `npm run lint` — Oxlint (config in [.oxlintrc.json](.oxlintrc.json): react, typescript, oxc plugins)
- `npm run preview` — serve the production build

No test runner is configured.

## Stack notes

- React 19, TypeScript 6, Vite 8 with `@vitejs/plugin-react`. Linting is Oxlint, not ESLint.
- `tailwindcss` v4 and `@tailwindcss/vite` and `motion` are listed as dependencies, but [vite.config.ts](vite.config.ts) only registers the React plugin and nothing imports Tailwind or motion yet. To use Tailwind, add `tailwindcss()` to the Vite plugins and `@import "tailwindcss";` in [src/index.css](src/index.css).
- TypeScript config is split into project references ([tsconfig.app.json](tsconfig.app.json) for `src`, [tsconfig.node.json](tsconfig.node.json) for Vite config), hence `tsc -b` in the build.
- Static assets referenced by absolute URL (e.g. `/icons.svg#...`) live in [public/](public/).

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
